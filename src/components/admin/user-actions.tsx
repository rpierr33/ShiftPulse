"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleUserActive } from "@/actions/admin";

interface UserActionsProps {
  userId: string;
  isActive: boolean;
}

export function UserActions({ userId, isActive }: UserActionsProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant={isActive ? "destructive" : "success"}
      size="sm"
      loading={isPending}
      onClick={() => startTransition(() => toggleUserActive(userId))}
    >
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
