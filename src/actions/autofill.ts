"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { checkShiftCompliance, type ComplianceSettings } from "@/lib/compliance";
import { revalidatePath } from "next/cache";

// ─── Types ──────────────────────────────────────────────────────

type AutoFillCandidate = {
  workerId: string;
  workerProfileId: string;
  workerName: string;
  workerType: string | null;
  score: number;
  breakdown: {
    workerTypeMatch: number;
    credentialMatch: number;
    availability: number;
    proximity: number;
    marketplaceScore: number;
    priorRelationship: number;
    rating: number;
    compliancePenalty: number;
    conflictPenalty: number;
  };
  hasConflict: boolean;
  hasComplianceIssue: boolean;
};

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

function getDayOfWeek(date: Date): string {
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  return days[date.getDay()];
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── Scoring Algorithm ──────────────────────────────────────────

async function scoreCandidate(params: {
  workerProfile: {
    id: string;
    userId: string;
    workerType: string | null;
    user: { id: string; name: string };
    credentials: Array<{
      type: string;
      status: string;
      expiryDate: Date | null;
    }>;
    availabilitySlots: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      isUnavailable: boolean;
    }>;
  };
  shift: {
    id: string;
    companyId: string;
    startTime: Date;
    endTime: Date;
    latitude: number | null;
    longitude: number | null;
    requiredWorkerTypes: string[];
    requiredCredentials: string[];
  };
  complianceSettings: ComplianceSettings;
}): Promise<AutoFillCandidate> {
  const { workerProfile, shift, complianceSettings } = params;
  const now = new Date();

  const breakdown = {
    workerTypeMatch: 0,
    credentialMatch: 0,
    availability: 0,
    proximity: 0,
    marketplaceScore: 0,
    priorRelationship: 0,
    rating: 0,
    compliancePenalty: 0,
    conflictPenalty: 0,
  };

  // 1. Worker type match (+30)
  if (shift.requiredWorkerTypes.length === 0) {
    breakdown.workerTypeMatch = 30; // No requirement, all match
  } else if (
    workerProfile.workerType &&
    shift.requiredWorkerTypes.includes(workerProfile.workerType)
  ) {
    breakdown.workerTypeMatch = 30;
  }

  // 2. Credential match (+20)
  if (shift.requiredCredentials.length === 0) {
    breakdown.credentialMatch = 20;
  } else {
    const verifiedCreds = workerProfile.credentials.filter(
      (c) =>
        c.status === "VERIFIED" &&
        (!c.expiryDate || new Date(c.expiryDate) > now)
    );
    const verifiedTypes = new Set(verifiedCreds.map((c) => c.type));
    const matchCount = shift.requiredCredentials.filter((rc) =>
      verifiedTypes.has(rc)
    ).length;
    breakdown.credentialMatch = Math.round(
      (matchCount / shift.requiredCredentials.length) * 20
    );
  }

  // 3. Availability match (+15)
  const shiftDay = getDayOfWeek(shift.startTime);
  const shiftStartHHMM = `${String(shift.startTime.getHours()).padStart(2, "0")}:${String(shift.startTime.getMinutes()).padStart(2, "0")}`;
  const shiftEndHHMM = `${String(shift.endTime.getHours()).padStart(2, "0")}:${String(shift.endTime.getMinutes()).padStart(2, "0")}`;

  const daySlots = workerProfile.availabilitySlots.filter(
    (s) => s.dayOfWeek === shiftDay && !s.isUnavailable
  );

  if (daySlots.length > 0) {
    const isAvailable = daySlots.some(
      (slot) => slot.startTime <= shiftStartHHMM && slot.endTime >= shiftEndHHMM
    );
    breakdown.availability = isAvailable ? 15 : 5; // Partial credit for having the day
  }

  // 4. Proximity (+10) — only if GPS data available
  if (shift.latitude && shift.longitude) {
    // Try to get worker's last clock-in location or company location
    const lastEntry = await db.timeEntry.findFirst({
      where: { userId: workerProfile.userId },
      orderBy: { clockInTime: "desc" },
      select: { clockInLat: true, clockInLng: true },
    });

    if (lastEntry?.clockInLat && lastEntry?.clockInLng) {
      const distance = haversineDistance(
        lastEntry.clockInLat,
        lastEntry.clockInLng,
        shift.latitude,
        shift.longitude
      );
      // Score based on distance: < 5 miles = 10, < 15 miles = 7, < 30 = 4, else 0
      if (distance < 5) breakdown.proximity = 10;
      else if (distance < 15) breakdown.proximity = 7;
      else if (distance < 30) breakdown.proximity = 4;
    }
  }

  // 5. Marketplace score (+10, normalized)
  const completedShifts = await db.assignment.count({
    where: {
      workerProfileId: workerProfile.id,
      status: "COMPLETED",
    },
  });
  const noShows = await db.assignment.count({
    where: {
      workerProfileId: workerProfile.id,
      status: "NO_SHOW",
    },
  });
  const total = completedShifts + noShows;
  if (total > 0) {
    const reliability = completedShifts / total;
    breakdown.marketplaceScore = Math.round(reliability * 10);
  }

  // 6. Prior relationship with this company (+10)
  const priorAssignments = await db.assignment.count({
    where: {
      workerProfileId: workerProfile.id,
      shift: { companyId: shift.companyId },
      status: { in: ["COMPLETED", "CONFIRMED", "IN_PROGRESS"] },
    },
  });
  if (priorAssignments > 0) {
    breakdown.priorRelationship = Math.min(priorAssignments * 2, 10);
  }

  // 7. Rating (+5, normalized)
  const reviews = await db.review.aggregate({
    where: { targetUserId: workerProfile.userId },
    _avg: { rating: true },
    _count: true,
  });
  if (reviews._avg.rating && reviews._count > 0) {
    breakdown.rating = Math.round((reviews._avg.rating / 5) * 5);
  }

  // 8. Conflict penalty (-100)
  const conflictingAssignments = await db.assignment.findMany({
    where: {
      workerProfileId: workerProfile.id,
      shift: {
        startTime: { lt: shift.endTime },
        endTime: { gt: shift.startTime },
        deletedAt: null,
      },
      status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
      deletedAt: null,
    },
  });
  const hasConflict = conflictingAssignments.length > 0;
  if (hasConflict) {
    breakdown.conflictPenalty = -100;
  }

  // 9. Compliance penalty (-50)
  let hasComplianceIssue = false;
  if (!hasConflict) {
    const rangeStart = new Date(shift.startTime);
    rangeStart.setDate(rangeStart.getDate() - 2);
    const rangeEnd = new Date(shift.endTime);
    rangeEnd.setDate(rangeEnd.getDate() + 2);

    const [existingEntries, existingAssignments] = await Promise.all([
      db.timeEntry.findMany({
        where: {
          userId: workerProfile.userId,
          companyId: shift.companyId,
          clockInTime: { gte: rangeStart, lte: rangeEnd },
          deletedAt: null,
        },
        select: { clockInTime: true, clockOutTime: true },
      }),
      db.assignment.findMany({
        where: {
          workerProfileId: workerProfile.id,
          shift: {
            companyId: shift.companyId,
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
      proposedShift: { startTime: shift.startTime, endTime: shift.endTime },
      existingEntries,
      existingShifts,
      workerName: workerProfile.user.name,
      workerId: workerProfile.userId,
      settings: complianceSettings,
    });

    const criticalViolations = violations.filter(
      (v) => v.severity === "violation"
    );
    if (criticalViolations.length > 0) {
      hasComplianceIssue = true;
      breakdown.compliancePenalty = -50;
    }
  }

  const totalScore =
    breakdown.workerTypeMatch +
    breakdown.credentialMatch +
    breakdown.availability +
    breakdown.proximity +
    breakdown.marketplaceScore +
    breakdown.priorRelationship +
    breakdown.rating +
    breakdown.compliancePenalty +
    breakdown.conflictPenalty;

  return {
    workerId: workerProfile.userId,
    workerProfileId: workerProfile.id,
    workerName: workerProfile.user.name,
    workerType: workerProfile.workerType,
    score: Math.max(0, Math.min(100, totalScore)),
    breakdown,
    hasConflict,
    hasComplianceIssue,
  };
}

// ─── Server Actions ─────────────────────────────────────────────

/**
 * For an open shift, find and rank available workers. Returns a scored list.
 */
export async function getAutoFillSuggestions(shiftId: string) {
  await getSessionUser();

  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: {
      assignments: {
        where: {
          status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
          deletedAt: null,
        },
        select: { workerProfileId: true },
      },
    },
  });

  if (!shift) return { error: "Shift not found" };

  const alreadyAssignedIds = shift.assignments.map(
    (a) => a.workerProfileId
  );

  // Get remaining capacity
  const remainingCapacity = shift.capacity - alreadyAssignedIds.length;
  if (remainingCapacity <= 0) {
    return { suggestions: [], message: "Shift is already fully staffed" };
  }

  // Get all workers from this company who are not already assigned
  const memberships = await db.companyMembership.findMany({
    where: {
      companyId: shift.companyId,
      status: "APPROVED",
      user: { role: "WORKER", isActive: true },
    },
    include: {
      user: {
        include: {
          workerProfile: {
            include: {
              credentials: {
                select: {
                  type: true,
                  status: true,
                  expiryDate: true,
                },
              },
              availabilitySlots: {
                select: {
                  dayOfWeek: true,
                  startTime: true,
                  endTime: true,
                  isUnavailable: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const complianceSettings = await getComplianceSettings(shift.companyId);

  const candidates: AutoFillCandidate[] = [];

  for (const membership of memberships) {
    const profile = membership.user.workerProfile;
    if (!profile) continue;
    if (alreadyAssignedIds.includes(profile.id)) continue;

    const candidate = await scoreCandidate({
      workerProfile: {
        ...profile,
        user: { id: membership.user.id, name: membership.user.name },
      },
      shift: {
        id: shift.id,
        companyId: shift.companyId,
        startTime: shift.startTime,
        endTime: shift.endTime,
        latitude: shift.latitude,
        longitude: shift.longitude,
        requiredWorkerTypes: shift.requiredWorkerTypes,
        requiredCredentials: shift.requiredCredentials,
      },
      complianceSettings,
    });

    candidates.push(candidate);
  }

  // Sort by score descending, exclude disqualified (conflicts)
  const suggestions = candidates
    .filter((c) => !c.hasConflict)
    .sort((a, b) => b.score - a.score);

  return { suggestions, remainingCapacity };
}

/**
 * Auto-assign the best available workers to multiple open shifts.
 */
export async function bulkAutoFill(shiftIds: string[]) {
  const user = await getSessionUser();

  const results: Array<{
    shiftId: string;
    shiftTitle: string;
    assigned: string[];
    errors: string[];
  }> = [];

  for (const shiftId of shiftIds) {
    const suggestionsResult = await getAutoFillSuggestions(shiftId);

    if ("error" in suggestionsResult) {
      results.push({
        shiftId,
        shiftTitle: "Unknown",
        assigned: [],
        errors: [suggestionsResult.error as string],
      });
      continue;
    }

    const shift = await db.shift.findUnique({
      where: { id: shiftId },
      select: { title: true, capacity: true, companyId: true },
    });

    if (!shift) {
      results.push({
        shiftId,
        shiftTitle: "Unknown",
        assigned: [],
        errors: ["Shift not found"],
      });
      continue;
    }

    const { suggestions, remainingCapacity } = suggestionsResult;

    if (!suggestions || !remainingCapacity || remainingCapacity <= 0) {
      results.push({
        shiftId,
        shiftTitle: shift.title,
        assigned: [],
        errors: suggestions?.length === 0 ? ["No eligible workers found"] : ["Shift fully staffed"],
      });
      continue;
    }

    // Take the top N candidates (where N = remaining capacity)
    // Only assign workers with a minimum score of 30
    const toAssign = suggestions
      .filter((s) => s.score >= 30 && !s.hasComplianceIssue)
      .slice(0, remainingCapacity);

    const assigned: string[] = [];
    const errors: string[] = [];

    for (const candidate of toAssign) {
      try {
        await db.assignment.create({
          data: {
            workerProfileId: candidate.workerProfileId,
            shiftId,
            status: "PENDING",
          },
        });

        await db.auditLog.create({
          data: {
            actorId: user.id,
            companyId: shift.companyId,
            action: "ASSIGNMENT_CREATED",
            entityType: "Assignment",
            entityId: shiftId,
            after: {
              workerName: candidate.workerName,
              autoFilled: true,
              score: candidate.score,
            },
          },
        });

        assigned.push(candidate.workerName);
      } catch (err) {
        errors.push(
          `Failed to assign ${candidate.workerName}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    // Update shift status if fully staffed
    const totalAssigned = await db.assignment.count({
      where: {
        shiftId,
        status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
        deletedAt: null,
      },
    });

    if (totalAssigned >= shift.capacity) {
      await db.shift.update({
        where: { id: shiftId },
        data: { status: "ASSIGNED" },
      });
    }

    results.push({
      shiftId,
      shiftTitle: shift.title,
      assigned,
      errors,
    });
  }

  revalidatePath("/company/shifts");
  revalidatePath("/company/assignments");

  const totalAssigned = results.reduce((sum, r) => sum + r.assigned.length, 0);
  return { results, totalAssigned };
}
