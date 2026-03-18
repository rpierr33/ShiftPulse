"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setAvailability } from "@/actions/availability";
import type { DayOfWeek } from "@prisma/client";

type SlotData = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  enabled: boolean;
};

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "MONDAY", label: "Monday" },
  { key: "TUESDAY", label: "Tuesday" },
  { key: "WEDNESDAY", label: "Wednesday" },
  { key: "THURSDAY", label: "Thursday" },
  { key: "FRIDAY", label: "Friday" },
  { key: "SATURDAY", label: "Saturday" },
  { key: "SUNDAY", label: "Sunday" },
];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
    );
  }
}

function formatTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m} ${ampm}`;
}

type ExistingSlot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
};

export function AvailabilityEditor({
  initialSlots,
}: {
  initialSlots: ExistingSlot[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Build initial state from existing recurring slots
  const buildInitialState = (): SlotData[] => {
    return DAYS.map(({ key }) => {
      const existing = initialSlots.find(
        (s) => s.dayOfWeek === key && s.isRecurring
      );
      return {
        dayOfWeek: key,
        startTime: existing?.startTime ?? "07:00",
        endTime: existing?.endTime ?? "19:00",
        enabled: !!existing,
      };
    });
  };

  const [slots, setSlots] = useState<SlotData[]>(buildInitialState);

  function updateSlot(index: number, updates: Partial<SlotData>) {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  }

  async function handleSave() {
    setLoading(true);
    setMessage(null);

    const enabledSlots = slots
      .filter((s) => s.enabled)
      .map(({ dayOfWeek, startTime, endTime }) => ({
        dayOfWeek,
        startTime,
        endTime,
      }));

    const result = await setAvailability(enabledSlots);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Availability saved successfully" });
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {slots.map((slot, index) => {
          const day = DAYS[index];
          return (
            <div
              key={day.key}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                slot.enabled
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              {/* Day name */}
              <span className="w-28 text-sm font-medium text-gray-700 shrink-0">
                {day.label}
              </span>

              {/* Toggle */}
              <button
                type="button"
                onClick={() => updateSlot(index, { enabled: !slot.enabled })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  slot.enabled ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                    slot.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>

              {/* Time pickers */}
              {slot.enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={slot.startTime}
                    onChange={(e) =>
                      updateSlot(index, { startTime: e.target.value })
                    }
                    className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {formatTime(t)}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-500">to</span>
                  <select
                    value={slot.endTime}
                    onChange={(e) =>
                      updateSlot(index, { endTime: e.target.value })
                    }
                    className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {formatTime(t)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-sm text-gray-400 flex-1">
                  Not available
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={loading}>
          Save Availability
        </Button>
        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
