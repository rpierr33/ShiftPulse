"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  DollarSign,
  ShieldCheck,
  Clock,
} from "lucide-react";

interface AdvancedChartsProps {
  fillRateData: Array<{
    week: string;
    totalShifts: number;
    filledShifts: number;
    fillRate: number;
  }>;
  costData: Array<{ week: string; cost: number }>;
  credentialStats: {
    verified: number;
    pending: number;
    expired: number;
    rejected: number;
  };
  overtimeData: Array<{ week: string; overtimeHours: number }>;
}

const CREDENTIAL_COLORS = {
  Verified: "#10b981",
  Pending: "#f59e0b",
  Expired: "#ef4444",
  Rejected: "#6b7280",
};

export function AdvancedCharts({
  fillRateData,
  costData,
  credentialStats,
  overtimeData,
}: AdvancedChartsProps) {
  const credentialPieData = [
    { name: "Verified", value: credentialStats.verified },
    { name: "Pending", value: credentialStats.pending },
    { name: "Expired", value: credentialStats.expired },
    { name: "Rejected", value: credentialStats.rejected },
  ].filter((d) => d.value > 0);

  const totalCredentials = credentialPieData.reduce(
    (sum, d) => sum + d.value,
    0
  );

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Fill Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <BarChart3 size={14} className="text-blue-600" />
            </div>
            Fill Rate by Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={fillRateData}
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
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #f3f4f6",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    fontSize: 13,
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => {
                    if (name === "totalShifts") return [value, "Total Shifts"];
                    return [value, "Filled Shifts"];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="totalShifts"
                  fill="#dbeafe"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                  name="Total Shifts"
                />
                <Bar
                  dataKey="filledShifts"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                  name="Filled Shifts"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign size={14} className="text-emerald-600" />
            </div>
            Labor Cost per Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={costData}
                margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
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
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #f3f4f6",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    fontSize: 13,
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [
                    `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    "Labor Cost",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#10b981" }}
                  name="Cost"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Credential Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <ShieldCheck size={14} className="text-purple-600" />
            </div>
            Credential Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalCredentials === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-300 gap-2">
              <ShieldCheck size={32} className="text-gray-200" />
              <span className="text-sm">No credentials on file</span>
            </div>
          ) : (
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={credentialPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={({ name, percent }: any) =>
                      `${name ?? ""} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
                  >
                    {credentialPieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          CREDENTIAL_COLORS[
                            entry.name as keyof typeof CREDENTIAL_COLORS
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #f3f4f6",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                      fontSize: 13,
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [
                      value,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* Legend */}
          {totalCredentials > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {credentialPieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{
                      backgroundColor:
                        CREDENTIAL_COLORS[
                          d.name as keyof typeof CREDENTIAL_COLORS
                        ],
                    }}
                  />
                  <span className="text-xs text-gray-500">
                    {d.name}: {d.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overtime Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
              <Clock size={14} className="text-red-600" />
            </div>
            Overtime Hours by Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={overtimeData}
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
                  label={{
                    value: "Hours",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 12, fill: "#9ca3af" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #f3f4f6",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    fontSize: 13,
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [
                    `${Number(value).toFixed(1)}h`,
                    "Overtime",
                  ]}
                />
                <Bar
                  dataKey="overtimeHours"
                  fill="#ef4444"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                  name="Overtime Hours"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
