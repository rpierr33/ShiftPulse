"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ShieldCheck } from "lucide-react";

interface ComplianceTrendChartProps {
  data: Array<{
    week: string;
    violations: number;
    warnings: number;
  }>;
}

export function ComplianceTrendChart({ data }: ComplianceTrendChartProps) {
  const hasData = data.some((d) => d.violations > 0 || d.warnings > 0);

  if (!hasData) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-300 gap-2">
        <ShieldCheck size={32} className="text-emerald-200" />
        <span className="text-sm">No violations in this period</span>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f3f4f6"
            vertical={false}
          />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            axisLine={{ stroke: "#f3f4f6" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #f3f4f6",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              fontSize: 13,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="violations"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 4, fill: "#ef4444" }}
            name="Violations"
          />
          <Line
            type="monotone"
            dataKey="warnings"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 4, fill: "#f59e0b" }}
            name="Warnings"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
