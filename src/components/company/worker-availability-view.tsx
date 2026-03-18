"use client";

import type { DayOfWeek } from "@prisma/client";

type AvailabilitySlot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  isUnavailable: boolean;
};

const DAYS: { key: DayOfWeek; label: string; abbr: string }[] = [
  { key: "MONDAY", label: "Monday", abbr: "Mon" },
  { key: "TUESDAY", label: "Tuesday", abbr: "Tue" },
  { key: "WEDNESDAY", label: "Wednesday", abbr: "Wed" },
  { key: "THURSDAY", label: "Thursday", abbr: "Thu" },
  { key: "FRIDAY", label: "Friday", abbr: "Fri" },
  { key: "SATURDAY", label: "Saturday", abbr: "Sat" },
  { key: "SUNDAY", label: "Sunday", abbr: "Sun" },
];

function formatTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "p" : "a";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return mStr === "00" ? `${hour12}${ampm}` : `${hour12}:${mStr}${ampm}`;
}

export function WorkerAvailabilityView({
  slots,
  workerName,
}: {
  slots: AvailabilitySlot[];
  workerName?: string;
}) {
  const recurringSlots = slots.filter((s) => s.isRecurring && !s.isUnavailable);

  if (recurringSlots.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">No availability set</p>
    );
  }

  return (
    <div className="space-y-1.5">
      {workerName && (
        <p className="text-sm font-medium text-gray-700 mb-2">{workerName}</p>
      )}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(({ key, abbr }) => {
          const slot = recurringSlots.find((s) => s.dayOfWeek === key);
          return (
            <div
              key={key}
              className={`text-center rounded-md p-1.5 text-xs ${
                slot
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-gray-100 text-gray-400 border border-gray-200"
              }`}
            >
              <div className="font-medium">{abbr}</div>
              {slot && (
                <div className="mt-0.5 text-[10px] leading-tight">
                  {formatTime(slot.startTime)}-{formatTime(slot.endTime)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Condensed summary for table cells: "Mon-Fri 7a-6p" style
 */
export function AvailabilitySummary({
  slots,
}: {
  slots: AvailabilitySlot[];
}) {
  const recurringSlots = slots.filter((s) => s.isRecurring && !s.isUnavailable);

  if (recurringSlots.length === 0) {
    return <span className="text-sm text-gray-400">Not set</span>;
  }

  // Build day abbreviation pills
  return (
    <div className="flex gap-0.5 flex-wrap">
      {DAYS.map(({ key, abbr }) => {
        const slot = recurringSlots.find((s) => s.dayOfWeek === key);
        return (
          <span
            key={key}
            className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${
              slot
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-400"
            }`}
            title={
              slot
                ? `${abbr}: ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`
                : `${abbr}: Not available`
            }
          >
            {abbr}
          </span>
        );
      })}
    </div>
  );
}
