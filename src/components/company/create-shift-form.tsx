"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/time-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createShift } from "@/actions/company";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";

export function CreateShiftForm({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createShift(companyId, formData);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
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
            Create New Shift
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
              <Input id="title" name="title" label="Shift Title" placeholder="Morning Shift" required />
              <Input id="location" name="location" label="Location" placeholder="123 Main St" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <Input id="date" name="date" type="date" label="Date" required min={new Date().toISOString().split("T")[0]} />
              <TimePicker name="startTime" label="Start Time" defaultValue="07:00" />
              <TimePicker name="endTime" label="End Time" defaultValue="15:00" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input id="capacity" name="capacity" type="number" label="Capacity" defaultValue="1" min="1" />
              <Input id="description" name="description" label="Description" placeholder="Optional notes" />
            </div>
            <Button type="submit" loading={loading}>
              Create Shift
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
