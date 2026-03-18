"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { approveMembership, rejectMembership } from "@/actions/company";

export function WorkerApprovalActions({ membershipId }: { membershipId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleApprove() {
    setLoading(true);
    await approveMembership(membershipId);
    router.refresh();
  }

  async function handleReject() {
    setLoading(true);
    await rejectMembership(membershipId);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={handleApprove} disabled={loading} variant="success">
        Approve
      </Button>
      <Button size="sm" onClick={handleReject} disabled={loading} variant="destructive">
        Reject
      </Button>
    </div>
  );
}
