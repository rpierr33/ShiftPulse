"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { handleShiftRequest, cancelAssignment } from "@/actions/company";
import { Check, X, Ban } from "lucide-react";

export function ShiftRequestActions({ assignmentId }: { assignmentId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handle(approve: boolean) {
    startTransition(async () => {
      await handleShiftRequest(assignmentId, approve);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="success" onClick={() => handle(true)} loading={isPending} className="gap-1">
        <Check size={14} />
        Approve
      </Button>
      <Button size="sm" variant="destructive" onClick={() => handle(false)} loading={isPending} className="gap-1">
        <X size={14} />
        Decline
      </Button>
    </div>
  );
}

export function CancelAssignmentButton({ assignmentId }: { assignmentId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCancel() {
    startTransition(async () => {
      await cancelAssignment(assignmentId);
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant="ghost" onClick={handleCancel} loading={isPending} className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
      <Ban size={14} />
      Cancel
    </Button>
  );
}
