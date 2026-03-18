"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requestShift } from "@/actions/company";
import { Hand } from "lucide-react";

interface RequestShiftButtonProps {
  shiftId: string;
}

export function RequestShiftButton({ shiftId }: RequestShiftButtonProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRequest() {
    setError("");
    startTransition(async () => {
      const result = await requestShift(shiftId);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        router.refresh();
      }
    });
  }

  if (success) {
    return (
      <span className="text-xs text-green-600 font-medium px-3 py-1.5 bg-green-50 rounded-lg">
        Requested
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={handleRequest} loading={isPending} className="gap-1">
        <Hand size={14} />
        Request
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
