"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import {
  checkWorkerCompliance,
  checkShiftCompliance,
  generateComplianceSummary,
  type ComplianceViolation,
  type ComplianceSettings,
} from "@/lib/compliance";
import { getWeekRange } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────

async function getComplianceSettings(
  companyId: string
): Promise<ComplianceSettings> {
  const settings = await db.settings.findUnique({
    where: { companyId },
  });

  return {
    overtimeThreshold: settings?.overtimeThreshold ?? 40,
    maxConsecutiveHours: settings?.maxConsecutiveHours ?? 16,
    minRestBetweenShifts: settings?.minRestBetweenShifts ?? 8,
    requireBreakAfterHours: settings?.requireBreakAfterHours ?? 6,
    enableDailyOvertimeRule: settings?.enableDailyOvertimeRule ?? false,
    dailyOvertimeThreshold: settings?.dailyOvertimeThreshold ?? 10,
  };
}

// ─── Server Actions ─────────────────────────────────────────────

/**
 * Run compliance checks for all workers in a company for the current week.
 */
export async function getComplianceDashboard(companyId: string) {
  await getSessionUser();

  const settings = await getComplianceSettings(companyId);
  const { start: weekStart, end: weekEnd } = getWeekRange();

  // Fetch all approved workers for the company
  const memberships = await db.companyMembership.findMany({
    where: { companyId, status: "APPROVED" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const allViolations: ComplianceViolation[] = [];

  for (const membership of memberships) {
    const userId = membership.user.id;

    // Fetch time entries for this worker in the current week
    const timeEntries = await db.timeEntry.findMany({
      where: {
        userId,
        companyId,
        clockInTime: { gte: weekStart, lte: weekEnd },
        deletedAt: null,
      },
      select: {
        clockInTime: true,
        clockOutTime: true,
        duration: true,
      },
    });

    // Fetch upcoming shifts assigned to this worker
    const now = new Date();
    const assignments = await db.assignment.findMany({
      where: {
        workerProfile: { userId },
        shift: {
          companyId,
          startTime: { gte: now },
          deletedAt: null,
        },
        status: { in: ["PENDING", "CONFIRMED"] },
        deletedAt: null,
      },
      include: {
        shift: {
          select: { startTime: true, endTime: true },
        },
      },
    });

    const upcomingShifts = assignments
      .filter((a) => a.shift)
      .map((a) => ({
        startTime: a.shift!.startTime,
        endTime: a.shift!.endTime,
      }));

    const violations = checkWorkerCompliance({
      timeEntries,
      upcomingShifts,
      weekStart,
      weekEnd,
      workerName: membership.user.name,
      workerId: userId,
      settings,
    });

    allViolations.push(...violations);
  }

  const summary = generateComplianceSummary(allViolations);

  // Calculate compliance score: 100% = no violations among total workers
  const totalWorkers = memberships.length;
  const workersWithViolations = summary.byWorker.length;
  const complianceScore =
    totalWorkers > 0
      ? Math.round(((totalWorkers - workersWithViolations) / totalWorkers) * 100)
      : 100;

  return {
    violations: allViolations,
    summary,
    complianceScore,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    totalWorkers,
  };
}

/**
 * Get historical compliance violations for a specific worker over a date range.
 */
export async function getWorkerComplianceHistory(
  workerId: string,
  dateRange: { start: string; end: string }
) {
  await getSessionUser();

  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);

  // Find the worker's company memberships
  const memberships = await db.companyMembership.findMany({
    where: { userId: workerId, status: "APPROVED" },
    select: { companyId: true },
  });

  const user = await db.user.findUnique({
    where: { id: workerId },
    select: { name: true },
  });

  if (!user) return { violations: [], summary: generateComplianceSummary([]) };

  const allViolations: ComplianceViolation[] = [];

  for (const membership of memberships) {
    const settings = await getComplianceSettings(membership.companyId);

    // Check week by week within the date range
    const current = new Date(startDate);
    while (current <= endDate) {
      const { start: weekStart, end: weekEnd } = getWeekRange(current);

      const timeEntries = await db.timeEntry.findMany({
        where: {
          userId: workerId,
          companyId: membership.companyId,
          clockInTime: { gte: weekStart, lte: weekEnd },
          deletedAt: null,
        },
        select: {
          clockInTime: true,
          clockOutTime: true,
          duration: true,
        },
      });

      const violations = checkWorkerCompliance({
        timeEntries,
        upcomingShifts: [],
        weekStart,
        weekEnd,
        workerName: user.name,
        workerId,
        settings,
      });

      allViolations.push(...violations);

      // Advance to next week
      current.setDate(current.getDate() + 7);
    }
  }

  const summary = generateComplianceSummary(allViolations);
  return { violations: allViolations, summary };
}

/**
 * Pre-check if assigning a worker to a proposed shift would cause violations.
 */
export async function checkProposedShift(
  shiftData: { startTime: string; endTime: string; companyId: string },
  workerId: string
) {
  await getSessionUser();

  const settings = await getComplianceSettings(shiftData.companyId);

  const user = await db.user.findUnique({
    where: { id: workerId },
    select: { name: true },
  });

  if (!user) return { violations: [], clear: true };

  const proposedStart = new Date(shiftData.startTime);
  const proposedEnd = new Date(shiftData.endTime);

  // Look at entries and shifts within +/- 2 days of the proposed shift
  const rangeStart = new Date(proposedStart);
  rangeStart.setDate(rangeStart.getDate() - 2);
  const rangeEnd = new Date(proposedEnd);
  rangeEnd.setDate(rangeEnd.getDate() + 2);

  const [existingEntries, existingAssignments] = await Promise.all([
    db.timeEntry.findMany({
      where: {
        userId: workerId,
        companyId: shiftData.companyId,
        clockInTime: { gte: rangeStart, lte: rangeEnd },
        deletedAt: null,
      },
      select: { clockInTime: true, clockOutTime: true },
    }),
    db.assignment.findMany({
      where: {
        workerProfile: { userId: workerId },
        shift: {
          companyId: shiftData.companyId,
          startTime: { gte: rangeStart, lte: rangeEnd },
          deletedAt: null,
        },
        status: { in: ["PENDING", "CONFIRMED"] },
        deletedAt: null,
      },
      include: {
        shift: { select: { startTime: true, endTime: true } },
      },
    }),
  ]);

  const existingShifts = existingAssignments
    .filter((a) => a.shift)
    .map((a) => ({
      startTime: a.shift!.startTime,
      endTime: a.shift!.endTime,
    }));

  const violations = checkShiftCompliance({
    proposedShift: { startTime: proposedStart, endTime: proposedEnd },
    existingEntries,
    existingShifts,
    workerName: user.name,
    workerId,
    settings,
  });

  return {
    violations,
    clear: violations.length === 0,
  };
}
