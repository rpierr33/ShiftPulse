"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleCompanyActive } from "@/actions/admin";

interface CompanyActionsProps {
  companyId: string;
  isActive: boolean;
}

export function CompanyActions({ companyId, isActive }: CompanyActionsProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant={isActive ? "destructive" : "success"}
      size="sm"
      loading={isPending}
      onClick={() => startTransition(() => toggleCompanyActive(companyId))}
    >
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
