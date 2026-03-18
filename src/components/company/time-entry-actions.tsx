"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { approveTimeEntry, rejectTimeEntry } from "@/actions/company";

export function TimeEntryActions({ entryId }: { entryId: string }) {
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const router = useRouter();

  function handleApprove() {
    startTransition(async () => {
      await approveTimeEntry(entryId);
      router.refresh();
    });
  }

  function handleReject() {
    setReasonError("");
    if (reason.trim().length < 5) {
      setReasonError("Rejection reason must be at least 5 characters");
      return;
    }
    startTransition(async () => {
      await rejectTimeEntry(entryId, reason.trim());
      setRejectOpen(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex gap-1">
        <Button size="sm" onClick={handleApprove} disabled={isPending} loading={isPending} variant="success">
          Approve
        </Button>
        <Button size="sm" onClick={() => setRejectOpen(true)} disabled={isPending} loading={isPending} variant="destructive">
          Reject
        </Button>
      </div>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)}>
        <DialogHeader>
          <DialogTitle>Reject Time Entry</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setReasonError("");
              }}
              rows={3}
              placeholder="Explain why this time entry is being rejected..."
              className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {reasonError && (
              <p className="text-sm text-red-600">{reasonError}</p>
            )}
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setRejectOpen(false); setReason(""); setReasonError(""); }}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReject} loading={isPending} disabled={isPending}>
            Confirm Rejection
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
