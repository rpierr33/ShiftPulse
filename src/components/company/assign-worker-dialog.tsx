"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { assignWorkerToShift } from "@/actions/company";
import { UserPlus } from "lucide-react";

interface Worker {
  profileId: string;
  name: string;
  specialties: string[];
}

interface AssignWorkerDialogProps {
  shiftId: string;
  shiftTitle: string;
  workers: Worker[];
}

export function AssignWorkerDialog({ shiftId, shiftTitle, workers }: AssignWorkerDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAssign() {
    if (!selectedWorker) {
      setError("Please select a worker");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await assignWorkerToShift(shiftId, selectedWorker);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setSelectedWorker("");
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1">
        <UserPlus size={14} />
        Assign
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogHeader>
          <DialogTitle>Assign Worker to Shift</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-gray-500 mb-4">
            Assign a worker to <span className="font-medium text-gray-900">{shiftTitle}</span>
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {workers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No available workers</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {workers.map((w) => (
                <label
                  key={w.profileId}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedWorker === w.profileId
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="worker"
                    value={w.profileId}
                    checked={selectedWorker === w.profileId}
                    onChange={() => setSelectedWorker(w.profileId)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium">{w.name}</p>
                    {w.specialties.length > 0 && (
                      <p className="text-xs text-gray-500">{w.specialties.join(", ")}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} loading={isPending} disabled={!selectedWorker}>
            Assign Worker
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
