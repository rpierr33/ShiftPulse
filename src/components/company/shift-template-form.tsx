"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/time-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createShiftTemplate } from "@/actions/shifts";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import type { DayOfWeek } from "@prisma/client";

const DAYS: { label: string; value: DayOfWeek }[] = [
  { label: "Mon", value: "MONDAY" },
  { label: "Tue", value: "TUESDAY" },
  { label: "Wed", value: "WEDNESDAY" },
  { label: "Thu", value: "THURSDAY" },
  { label: "Fri", value: "FRIDAY" },
  { label: "Sat", value: "SATURDAY" },
  { label: "Sun", value: "SUNDAY" },
];

export function ShiftTemplateForm({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const router = useRouter();

  function toggleDay(day: DayOfWeek) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;

    if (endTime <= startTime) {
      setError("End time must be after start time");
      setLoading(false);
      return;
    }

    if (selectedDays.length === 0) {
      setError("Select at least one day of the week");
      setLoading(false);
      return;
    }

    const result = await createShiftTemplate(companyId, {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      location: (formData.get("location") as string) || undefined,
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      capacity: Number(formData.get("capacity") || 1),
      daysOfWeek: selectedDays,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      setSelectedDays([]);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Plus size={18} />
            Create Shift Template
          </span>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <Input id="title" name="title" label="Template Title" placeholder="Morning Shift" required />
              <Input id="location" name="location" label="Location" placeholder="123 Main St" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <TimePicker name="startTime" label="Start Time" defaultValue="07:00" />
              <TimePicker name="endTime" label="End Time" defaultValue="15:00" />
              <Input id="capacity" name="capacity" type="number" label="Capacity" defaultValue="1" min="1" />
            </div>
            <Input id="description" name="description" label="Description" placeholder="Optional notes" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days of Week
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      selectedDays.includes(day.value)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" loading={loading}>
              Create Template
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
