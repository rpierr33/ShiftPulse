/**
 * Florida labor law compliance engine.
 *
 * Checks worker schedules and time entries for violations of
 * Florida-specific labor regulations and company-configured rules.
 */

// ─── Florida-Specific Rules (Defaults) ──────────────────────────

export const FL_RULES = {
  OVERTIME_WEEKLY_THRESHOLD: 40, // hours
  MAX_CONSECUTIVE_HOURS: 16,
  MIN_REST_BETWEEN_SHIFTS: 8, // hours
  MEAL_BREAK_AFTER_HOURS: 6, // require 30min break
  MEAL_BREAK_DURATION: 30, // minutes
  MINORS_MAX_HOURS_SCHOOL_WEEK: 30,
  MINORS_MAX_HOURS_NON_SCHOOL_WEEK: 40,
};

// ─── Types ──────────────────────────────────────────────────────

export type ComplianceViolation = {
  type:
    | "overtime"
    | "consecutive_hours"
    | "rest_period"
    | "missing_break"
    | "scheduling_conflict";
  severity: "warning" | "violation";
  message: string;
  workerName: string;
  workerId: string;
  date: string;
  details: string;
};

export type ComplianceSettings = {
  overtimeThreshold: number;
  maxConsecutiveHours: number;
  minRestBetweenShifts: number;
  requireBreakAfterHours: number;
  enableDailyOvertimeRule: boolean;
  dailyOvertimeThreshold: number;
};

type TimeEntry = {
  clockInTime: Date;
  clockOutTime: Date | null;
  duration: number | null; // minutes
};

type ShiftWindow = {
  startTime: Date;
  endTime: Date;
};

// ─── Helpers ────────────────────────────────────────────────────

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

function diffHours(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60);
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function dayStart(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dayEnd(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

/**
 * Group time entries by calendar date (based on clockInTime).
 */
function groupByDate(
  entries: TimeEntry[]
): Map<string, TimeEntry[]> {
  const map = new Map<string, TimeEntry[]>();
  for (const entry of entries) {
    const key = isoDate(toDate(entry.clockInTime));
    const list = map.get(key) ?? [];
    list.push(entry);
    map.set(key, list);
  }
  return map;
}

/**
 * Merge overlapping or adjacent work periods into continuous blocks
 * and return each block's total duration in hours.
 */
function getContinuousWorkBlocks(
  entries: TimeEntry[]
): Array<{ start: Date; end: Date; durationHours: number }> {
  const sorted = entries
    .filter((e) => e.clockOutTime)
    .map((e) => ({
      start: toDate(e.clockInTime),
      end: toDate(e.clockOutTime!),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (sorted.length === 0) return [];

  const blocks: Array<{ start: Date; end: Date; durationHours: number }> = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    // If the gap between the end of current block and start of next is <= 30 minutes,
    // treat them as continuous (no real break taken).
    const gapMinutes =
      (next.start.getTime() - current.end.getTime()) / (1000 * 60);
    if (gapMinutes <= 30) {
      // Extend current block
      if (next.end.getTime() > current.end.getTime()) {
        current.end = next.end;
      }
    } else {
      blocks.push({
        ...current,
        durationHours: diffHours(current.start, current.end),
      });
      current = { ...next };
    }
  }
  blocks.push({
    ...current,
    durationHours: diffHours(current.start, current.end),
  });

  return blocks;
}

// ─── Core Compliance Checks ─────────────────────────────────────

/**
 * Check a worker's time entries and upcoming shifts for compliance violations.
 */
export function checkWorkerCompliance(params: {
  timeEntries: TimeEntry[];
  upcomingShifts: ShiftWindow[];
  weekStart: Date;
  weekEnd: Date;
  workerName: string;
  workerId: string;
  settings: ComplianceSettings;
}): ComplianceViolation[] {
  const {
    timeEntries,
    upcomingShifts,
    weekStart,
    weekEnd,
    workerName,
    workerId,
    settings,
  } = params;

  const violations: ComplianceViolation[] = [];

  // 1. Weekly overtime check
  const weekEntries = timeEntries.filter((e) => {
    const t = toDate(e.clockInTime).getTime();
    return t >= toDate(weekStart).getTime() && t <= toDate(weekEnd).getTime();
  });

  const totalWeeklyMinutes = weekEntries.reduce(
    (sum, e) => sum + (e.duration ?? 0),
    0
  );
  const totalWeeklyHours = totalWeeklyMinutes / 60;

  if (totalWeeklyHours > settings.overtimeThreshold) {
    const overtimeHours = totalWeeklyHours - settings.overtimeThreshold;
    violations.push({
      type: "overtime",
      severity: overtimeHours > 10 ? "violation" : "warning",
      message: `Weekly overtime: ${totalWeeklyHours.toFixed(1)}h worked (threshold: ${settings.overtimeThreshold}h)`,
      workerName,
      workerId,
      date: isoDate(toDate(weekStart)),
      details: `${overtimeHours.toFixed(1)} overtime hours this week. Total: ${totalWeeklyHours.toFixed(1)}h / ${settings.overtimeThreshold}h limit.`,
    });
  }

  // 2. Daily overtime check (if enabled)
  if (settings.enableDailyOvertimeRule) {
    const byDate = groupByDate(weekEntries);
    for (const [date, dayEntries] of byDate) {
      const dayMinutes = dayEntries.reduce(
        (sum, e) => sum + (e.duration ?? 0),
        0
      );
      const dayHours = dayMinutes / 60;
      if (dayHours > settings.dailyOvertimeThreshold) {
        violations.push({
          type: "overtime",
          severity: "warning",
          message: `Daily overtime on ${date}: ${dayHours.toFixed(1)}h worked`,
          workerName,
          workerId,
          date,
          details: `Exceeded daily threshold of ${settings.dailyOvertimeThreshold}h with ${dayHours.toFixed(1)}h worked.`,
        });
      }
    }
  }

  // 3. Consecutive hours check
  const completedEntries = timeEntries.filter((e) => e.clockOutTime);
  const blocks = getContinuousWorkBlocks(completedEntries);

  for (const block of blocks) {
    if (block.durationHours > settings.maxConsecutiveHours) {
      violations.push({
        type: "consecutive_hours",
        severity: "violation",
        message: `Worked ${block.durationHours.toFixed(1)} consecutive hours (max: ${settings.maxConsecutiveHours}h)`,
        workerName,
        workerId,
        date: isoDate(block.start),
        details: `Continuous work from ${block.start.toLocaleTimeString()} to ${block.end.toLocaleTimeString()} — ${block.durationHours.toFixed(1)}h total without adequate break.`,
      });
    }
  }

  // 4. Missing break check
  for (const block of blocks) {
    if (
      block.durationHours > settings.requireBreakAfterHours
    ) {
      // Check if there was a meaningful break (gap > 30min) within this block.
      // Since getContinuousWorkBlocks already merges anything with < 30min gap,
      // any block longer than the threshold means no proper break was taken.
      violations.push({
        type: "missing_break",
        severity: "warning",
        message: `No break during ${block.durationHours.toFixed(1)}h work block`,
        workerName,
        workerId,
        date: isoDate(block.start),
        details: `Worked ${block.durationHours.toFixed(1)}h without a 30-minute break. Florida law requires a break after ${settings.requireBreakAfterHours}h of continuous work.`,
      });
    }
  }

  // 5. Rest between shifts check
  // Combine completed time entries and upcoming shifts, sorted chronologically
  const allPeriods: Array<{ start: Date; end: Date }> = [
    ...completedEntries.map((e) => ({
      start: toDate(e.clockInTime),
      end: toDate(e.clockOutTime!),
    })),
    ...upcomingShifts.map((s) => ({
      start: toDate(s.startTime),
      end: toDate(s.endTime),
    })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  for (let i = 1; i < allPeriods.length; i++) {
    const prev = allPeriods[i - 1];
    const curr = allPeriods[i];
    const restHours = diffHours(prev.end, curr.start);
    if (restHours < settings.minRestBetweenShifts) {
      violations.push({
        type: "rest_period",
        severity: "violation",
        message: `Only ${restHours.toFixed(1)}h rest between shifts (min: ${settings.minRestBetweenShifts}h)`,
        workerName,
        workerId,
        date: isoDate(curr.start),
        details: `Previous shift ended ${prev.end.toLocaleTimeString()} — next shift starts ${curr.start.toLocaleTimeString()}. Only ${restHours.toFixed(1)}h gap (minimum ${settings.minRestBetweenShifts}h required).`,
      });
    }
  }

  return violations;
}

/**
 * Check if a proposed shift assignment would cause compliance violations.
 */
export function checkShiftCompliance(params: {
  proposedShift: ShiftWindow;
  existingEntries: Array<{ clockInTime: Date; clockOutTime: Date | null }>;
  existingShifts: ShiftWindow[];
  workerName: string;
  workerId: string;
  settings: ComplianceSettings;
}): ComplianceViolation[] {
  const {
    proposedShift,
    existingEntries,
    existingShifts,
    workerName,
    workerId,
    settings,
  } = params;

  const violations: ComplianceViolation[] = [];
  const propStart = toDate(proposedShift.startTime);
  const propEnd = toDate(proposedShift.endTime);
  const proposedDurationHours = diffHours(propStart, propEnd);
  const proposedDate = isoDate(propStart);

  // 1. Check for scheduling conflict — overlap with existing shifts
  for (const shift of existingShifts) {
    const sStart = toDate(shift.startTime);
    const sEnd = toDate(shift.endTime);
    if (propStart < sEnd && propEnd > sStart) {
      violations.push({
        type: "scheduling_conflict",
        severity: "violation",
        message: `Shift overlaps with an existing assignment`,
        workerName,
        workerId,
        date: proposedDate,
        details: `Proposed: ${propStart.toLocaleTimeString()} - ${propEnd.toLocaleTimeString()} conflicts with existing ${sStart.toLocaleTimeString()} - ${sEnd.toLocaleTimeString()}.`,
      });
    }
  }

  // 2. Check rest period before/after proposed shift
  const allPeriods: Array<{ start: Date; end: Date }> = [
    ...existingEntries
      .filter((e) => e.clockOutTime)
      .map((e) => ({
        start: toDate(e.clockInTime),
        end: toDate(e.clockOutTime!),
      })),
    ...existingShifts.map((s) => ({
      start: toDate(s.startTime),
      end: toDate(s.endTime),
    })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  for (const period of allPeriods) {
    // Check rest before proposed shift
    if (period.end.getTime() < propStart.getTime()) {
      const restHours = diffHours(period.end, propStart);
      if (restHours < settings.minRestBetweenShifts) {
        violations.push({
          type: "rest_period",
          severity: "violation",
          message: `Insufficient rest before shift (${restHours.toFixed(1)}h)`,
          workerName,
          workerId,
          date: proposedDate,
          details: `Only ${restHours.toFixed(1)}h rest after previous shift ending ${period.end.toLocaleTimeString()}. Minimum ${settings.minRestBetweenShifts}h required.`,
        });
      }
    }
    // Check rest after proposed shift
    if (period.start.getTime() > propEnd.getTime()) {
      const restHours = diffHours(propEnd, period.start);
      if (restHours < settings.minRestBetweenShifts) {
        violations.push({
          type: "rest_period",
          severity: "violation",
          message: `Insufficient rest after shift (${restHours.toFixed(1)}h)`,
          workerName,
          workerId,
          date: proposedDate,
          details: `Only ${restHours.toFixed(1)}h rest before next shift starting ${period.start.toLocaleTimeString()}. Minimum ${settings.minRestBetweenShifts}h required.`,
        });
      }
    }
  }

  // 3. Check if proposed shift duration exceeds consecutive hours limit
  if (proposedDurationHours > settings.maxConsecutiveHours) {
    violations.push({
      type: "consecutive_hours",
      severity: "violation",
      message: `Shift is ${proposedDurationHours.toFixed(1)}h (max: ${settings.maxConsecutiveHours}h)`,
      workerName,
      workerId,
      date: proposedDate,
      details: `Proposed shift duration of ${proposedDurationHours.toFixed(1)}h exceeds the maximum consecutive hours limit of ${settings.maxConsecutiveHours}h.`,
    });
  }

  // 4. Check if proposed shift would push the day over daily overtime (if enabled)
  if (settings.enableDailyOvertimeRule) {
    const proposedDayStart = dayStart(propStart);
    const proposedDayEnd = dayEnd(propStart);

    const sameDayEntries = existingEntries.filter((e) => {
      const t = toDate(e.clockInTime).getTime();
      return t >= proposedDayStart.getTime() && t <= proposedDayEnd.getTime();
    });

    const existingDayMinutes = sameDayEntries.reduce((sum, e) => {
      if (!e.clockOutTime) return sum;
      return (
        sum +
        (toDate(e.clockOutTime).getTime() - toDate(e.clockInTime).getTime()) /
          (1000 * 60)
      );
    }, 0);

    const totalDayHours =
      existingDayMinutes / 60 + proposedDurationHours;

    if (totalDayHours > settings.dailyOvertimeThreshold) {
      violations.push({
        type: "overtime",
        severity: "warning",
        message: `Would result in ${totalDayHours.toFixed(1)}h on ${proposedDate}`,
        workerName,
        workerId,
        date: proposedDate,
        details: `Adding this shift would bring daily total to ${totalDayHours.toFixed(1)}h, exceeding the ${settings.dailyOvertimeThreshold}h daily threshold.`,
      });
    }
  }

  // 5. Check if shift needs a break (longer than threshold without one)
  if (proposedDurationHours > settings.requireBreakAfterHours) {
    violations.push({
      type: "missing_break",
      severity: "warning",
      message: `${proposedDurationHours.toFixed(1)}h shift requires a scheduled break`,
      workerName,
      workerId,
      date: proposedDate,
      details: `Shift duration of ${proposedDurationHours.toFixed(1)}h exceeds the ${settings.requireBreakAfterHours}h threshold. Ensure a 30-minute break is scheduled.`,
    });
  }

  return violations;
}

/**
 * Generate an aggregate compliance summary from a list of violations.
 */
export function generateComplianceSummary(
  violations: ComplianceViolation[]
): {
  totalViolations: number;
  warnings: number;
  criticalViolations: number;
  byType: Record<string, number>;
  byWorker: Array<{ workerId: string; workerName: string; count: number }>;
} {
  const warnings = violations.filter((v) => v.severity === "warning").length;
  const criticalViolations = violations.filter(
    (v) => v.severity === "violation"
  ).length;

  const byType: Record<string, number> = {};
  for (const v of violations) {
    byType[v.type] = (byType[v.type] ?? 0) + 1;
  }

  const workerMap = new Map<
    string,
    { workerId: string; workerName: string; count: number }
  >();
  for (const v of violations) {
    const existing = workerMap.get(v.workerId);
    if (existing) {
      existing.count++;
    } else {
      workerMap.set(v.workerId, {
        workerId: v.workerId,
        workerName: v.workerName,
        count: 1,
      });
    }
  }

  const byWorker = Array.from(workerMap.values()).sort(
    (a, b) => b.count - a.count
  );

  return {
    totalViolations: violations.length,
    warnings,
    criticalViolations,
    byType,
    byWorker,
  };
}
