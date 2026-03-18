"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateShiftsFromTemplates } from "@/actions/shifts";
import { Calendar, X } from "lucide-react";

function getNextMonday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split("T")[0];
}

function getNextSunday(mondayStr: string): string {
  const monday = new Date(mondayStr);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday.toISOString().split("T")[0];
}

export function GenerateShiftsDialog({
  companyId,
  templateCount,
}: {
  companyId: string;
  templateCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const defaultStart = getNextMonday();
  const defaultEnd = getNextSunday(defaultStart);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    const result = await generateShiftsFromTemplates(companyId, startDate, endDate);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(`Successfully created ${result.count} shift${result.count === 1 ? "" : "s"} from templates.`);
      router.refresh();
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline">
        <Calendar size={16} />
        Generate Shifts from Templates
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar size={18} />
            Generate Shifts from Templates
          </span>
          <button
            onClick={() => {
              setOpen(false);
              setError("");
              setSuccess("");
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">
          {templateCount} active template{templateCount === 1 ? "" : "s"} will be used to generate shifts for each matching day in the selected range.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              id="startDate"
              name="startDate"
              type="date"
              label="Start Date"
              defaultValue={defaultStart}
              required
            />
            <Input
              id="endDate"
              name="endDate"
              type="date"
              label="End Date"
              defaultValue={defaultEnd}
              required
            />
          </div>
          <Button type="submit" loading={loading} disabled={templateCount === 0}>
            Generate Shifts
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
