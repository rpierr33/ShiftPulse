import { requireRole } from "@/lib/auth-utils";
import { getCompanyForUser } from "@/actions/company";
import { getComplianceDashboard } from "@/actions/compliance";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  Clock,
  AlertTriangle,
  Moon,
  Coffee,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { ComplianceTrendChart } from "./compliance-trend-chart";

const VIOLATION_CONFIG: Record<
  string,
  { icon: typeof Clock; color: string; badgeVariant: "warning" | "danger" }
> = {
  overtime: { icon: Clock, color: "text-amber-500", badgeVariant: "warning" },
  consecutive_hours: {
    icon: AlertTriangle,
    color: "text-red-500",
    badgeVariant: "danger",
  },
  rest_period: { icon: Moon, color: "text-red-500", badgeVariant: "danger" },
  missing_break: {
    icon: Coffee,
    color: "text-amber-500",
    badgeVariant: "warning",
  },
  scheduling_conflict: {
    icon: Calendar,
    color: "text-amber-500",
    badgeVariant: "warning",
  },
};

const VIOLATION_LABELS: Record<string, string> = {
  overtime: "Overtime",
  consecutive_hours: "Consecutive Hours",
  rest_period: "Rest Period",
  missing_break: "Missing Break",
  scheduling_conflict: "Scheduling Conflict",
};

export default async function CompliancePage() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/login");

  const dashboard = await getComplianceDashboard(company.id);

  // Mock trend data for the past 4 weeks (in production, this would come from stored data)
  const trendData = [
    { week: "Week 1", violations: Math.max(0, dashboard.summary.totalViolations - 3), warnings: Math.max(0, dashboard.summary.warnings - 2) },
    { week: "Week 2", violations: Math.max(0, dashboard.summary.totalViolations - 1), warnings: Math.max(0, dashboard.summary.warnings - 1) },
    { week: "Week 3", violations: Math.max(0, dashboard.summary.totalViolations + 1), warnings: dashboard.summary.warnings },
    { week: "This Week", violations: dashboard.summary.totalViolations, warnings: dashboard.summary.warnings },
  ];

  return (
    <div>
      <TopBar
        title="Compliance"
        subtitle={`${formatDate(dashboard.weekStart)} - ${formatDate(dashboard.weekEnd)}`}
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Total Violations"
            value={dashboard.summary.totalViolations}
            color={dashboard.summary.totalViolations > 0 ? "red" : "green"}
          />
          <MetricCard
            label="Warnings"
            value={dashboard.summary.warnings}
            color={dashboard.summary.warnings > 0 ? "amber" : "green"}
          />
          <MetricCard
            label="Workers At Risk"
            value={dashboard.summary.byWorker.length}
            color={dashboard.summary.byWorker.length > 0 ? "orange" : "green"}
          />
          <MetricCard
            label="Compliance Score"
            value={`${dashboard.complianceScore}%`}
            color={
              dashboard.complianceScore >= 90
                ? "green"
                : dashboard.complianceScore >= 70
                  ? "amber"
                  : "red"
            }
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Trend chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ShieldCheck size={14} className="text-blue-600" />
                </div>
                Violations Trend (4 Weeks)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComplianceTrendChart data={trendData} />
            </CardContent>
          </Card>

          {/* Workers at risk */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={14} className="text-red-600" />
                </div>
                Workers At Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.summary.byWorker.length === 0 ? (
                <div className="text-center py-8">
                  <ShieldCheck size={28} className="mx-auto text-emerald-300 mb-2" />
                  <p className="text-sm text-gray-400">
                    All workers are in compliance
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dashboard.summary.byWorker.map((w) => (
                    <div
                      key={w.workerId}
                      className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-xl border border-gray-100/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center text-xs font-bold text-red-700">
                          {w.workerName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <span className="font-medium text-sm text-gray-900">
                          {w.workerName}
                        </span>
                      </div>
                      <Badge variant={w.count > 2 ? "danger" : "warning"}>
                        {w.count} violation{w.count !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Violations table */}
        <Card>
          <CardHeader>
            <CardTitle>All Violations This Week</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.violations.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheck
                  size={36}
                  className="mx-auto text-emerald-300 mb-3"
                />
                <p className="text-gray-500 font-medium">No violations found</p>
                <p className="text-sm text-gray-400 mt-1">
                  All {dashboard.totalWorkers} workers are operating within
                  compliance thresholds
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Worker
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.violations.map((v, i) => {
                      const config = VIOLATION_CONFIG[v.type] ?? {
                        icon: AlertTriangle,
                        color: "text-gray-500",
                        badgeVariant: "secondary" as const,
                      };
                      const Icon = config.icon;
                      return (
                        <tr
                          key={`${v.workerId}-${v.type}-${v.date}-${i}`}
                          className={
                            i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }
                        >
                          <td className="py-3.5 px-4 text-gray-600">
                            {formatDate(v.date)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-gray-900">
                              {v.workerName}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <Icon size={14} className={config.color} />
                              <span className="text-gray-700">
                                {VIOLATION_LABELS[v.type] ?? v.type}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant={
                                v.severity === "violation"
                                  ? "danger"
                                  : "warning"
                              }
                            >
                              {v.severity === "violation"
                                ? "Violation"
                                : "Warning"}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate">
                            {v.details}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
