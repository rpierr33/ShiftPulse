"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSchedule } from "@/actions/company";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";

export function CreateScheduleForm({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createSchedule(companyId, formData);

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
            Create New Schedule
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
              <Input id="name" name="name" label="Schedule Name" placeholder="Week 12 Schedule" required />
              <Input id="description" name="description" label="Description" placeholder="Optional description" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input id="startDate" name="startDate" type="date" label="Start Date" required />
              <Input id="endDate" name="endDate" type="date" label="End Date" required />
            </div>
            <Button type="submit" loading={loading}>
              Create Schedule
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
