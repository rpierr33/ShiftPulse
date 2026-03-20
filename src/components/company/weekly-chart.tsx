"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface WeeklyChartProps {
  data: { day: string; hours: number }[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const hasData = data.some((d) => d.hours > 0);

  if (!hasData) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-300 gap-2">
        <BarChart3 size={32} className="text-gray-200" />
        <span className="text-sm">No hours logged this period</span>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            axisLine={{ stroke: "#f3f4f6" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            label={{ value: "Hours", angle: -90, position: "insideLeft", style: { fontSize: 12, fill: "#9ca3af" } }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #f3f4f6",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              fontSize: 13,
            }}
            formatter={(value) => [`${Number(value).toFixed(1)}h`, "Hours"]}
            cursor={{ fill: "rgba(59, 130, 246, 0.05)", radius: 8 }}
          />
          <Bar
            dataKey="hours"
            fill="url(#blueGradient)"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
          <defs>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
