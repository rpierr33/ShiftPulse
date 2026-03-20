import { formatDate, formatTime } from "@/lib/utils";

type TimeEntryForExport = {
  clockInTime: Date;
  clockOutTime: Date | null;
  duration: number | null;
  isManualEntry: boolean;
  evvStatus: string | null;
  status: string;
  user: { name: string; email: string; workerProfile?: { hourlyRate: number | null } | null };
  shift: { title: string } | null;
};

export function calculateOvertimeHours(
  weeklyHours: number,
  threshold: number = 40
): { regular: number; overtime: number } {
  if (weeklyHours <= threshold) {
    return { regular: weeklyHours, overtime: 0 };
  }
  return {
    regular: threshold,
    overtime: weeklyHours - threshold,
  };
}

function escapeCSVField(value: string): string {
  // Prevent CSV injection: prefix dangerous leading characters with a single quote
  const sanitized = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  if (sanitized.includes(",") || sanitized.includes('"') || sanitized.includes("\n")) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

export function generatePayrollCSV(
  entries: TimeEntryForExport[],
  overtimeThreshold: number = 40,
  overtimeMultiplier: number = 1.5
): string {
  const headers = [
    "Worker Name",
    "Email",
    "Date",
    "Clock In",
    "Clock Out",
    "Hours",
    "Overtime Hours",
    "Rate",
    "Total Pay",
    "Status",
    "Manual Entry",
    "EVV Status",
  ];

  // Group entries by worker to calculate weekly overtime
  const workerWeeklyHours = new Map<string, number>();
  for (const entry of entries) {
    const hours = (entry.duration || 0) / 60;
    const current = workerWeeklyHours.get(entry.user.email) || 0;
    workerWeeklyHours.set(entry.user.email, current + hours);
  }

  // Build rows, tracking running hours per worker for overtime calc
  const workerRunningHours = new Map<string, number>();
  const rows = entries.map((entry) => {
    const hours = (entry.duration || 0) / 60;
    const prevHours = workerRunningHours.get(entry.user.email) || 0;
    workerRunningHours.set(entry.user.email, prevHours + hours);

    const beforeOT = calculateOvertimeHours(prevHours, overtimeThreshold);
    const afterOT = calculateOvertimeHours(prevHours + hours, overtimeThreshold);
    const overtimeHours = afterOT.overtime - beforeOT.overtime;
    const regularHours = hours - overtimeHours;

    const rate = entry.user.workerProfile?.hourlyRate ?? 0;
    const totalPay = regularHours * rate + overtimeHours * rate * overtimeMultiplier;

    return [
      escapeCSVField(entry.user.name),
      escapeCSVField(entry.user.email),
      formatDate(entry.clockInTime),
      formatTime(entry.clockInTime),
      entry.clockOutTime ? formatTime(entry.clockOutTime) : "—",
      hours.toFixed(2),
      overtimeHours.toFixed(2),
      rate.toFixed(2),
      totalPay.toFixed(2),
      entry.status,
      entry.isManualEntry ? "Yes" : "No",
      entry.evvStatus || "N/A",
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}
