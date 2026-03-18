"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/time-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createManualTimeEntry } from "@/actions/clock";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";

interface ManualEntryFormProps {
  companies: { id: string; name: string }[];
}

export function ManualEntryForm({ companies }: ManualEntryFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const form = new FormData(e.currentTarget);
    const companyId = form.get("companyId") as string;
    const date = form.get("date") as string;
    const clockInTime = form.get("clockInTime") as string;
    const clockOutTime = form.get("clockOutTime") as string;
    const notes = form.get("notes") as string;

    if (!companyId || !date || !clockInTime || !clockOutTime) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    const result = await createManualTimeEntry(companyId, date, clockInTime, clockOutTime, notes || undefined);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setOpen(false);
      (e.target as HTMLFormElement).reset();
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  }

  if (companies.length === 0) return null;

  return (
    <>
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
          Manual time entry submitted successfully!
        </div>
      )}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setOpen(!open)}>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Plus size={18} />
              Add Manual Time Entry
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
              <div>
                <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <select
                  id="companyId"
                  name="companyId"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <Input id="date" name="date" type="date" label="Date" required />
                <TimePicker name="clockInTime" label="Clock In" defaultValue="07:00" />
                <TimePicker name="clockOutTime" label="Clock Out" defaultValue="15:00" />
              </div>
              <Input id="notes" name="notes" label="Notes" placeholder="Optional notes about this entry" />
              <Button type="submit" loading={loading}>
                Submit Entry
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </>
  );
}
