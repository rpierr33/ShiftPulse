"use client";

import { MetricCard } from "@/components/shared/metric-card";

interface VisitStatus {
  label: string;
  count: number;
  color: string;
  href?: string;
}

export function VisitStatusCards({ statuses }: { statuses: VisitStatus[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {statuses.map((status) => (
        <MetricCard
          key={status.label}
          label={status.label}
          value={status.count}
          color={status.color}
          href={status.href}
        />
      ))}
    </div>
  );
}
