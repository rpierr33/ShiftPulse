import { requireRole } from "@/lib/auth-utils";
import { getAdminDashboardMetrics } from "@/actions/admin";
import { db } from "@/lib/db";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Building2, Users, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  await requireRole("ADMIN");
  const metrics = await getAdminDashboardMetrics();

  const [recentCompanies, recentUsers, recentLogs] = await Promise.all([
    db.company.findMany({
      include: { _count: { select: { memberships: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.auditLog.findMany({
      include: { actor: { select: { name: true } }, company: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div>
      <TopBar title="Admin Dashboard" subtitle="Platform overview" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Companies" value={metrics.companyCount} color="blue" href="/admin/companies" />
          <MetricCard label="Workers" value={metrics.workerCount} color="green" href="/admin/users" />
          <MetricCard label="Time Entries" value={metrics.timeEntryCount} color="purple" href="/admin/time-entries" />
          <MetricCard label="Manual Entries" value={metrics.flaggedCount} color="amber" href="/admin/time-entries" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent companies */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 size={18} />
                Recent Companies
              </CardTitle>
              <Link href="/admin/companies" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                All <ArrowRight size={14} />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCompanies.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2">
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-gray-500">{c._count.memberships} members</p>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users size={18} />
                Recent Users
              </CardTitle>
              <Link href="/admin/users" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                All <ArrowRight size={14} />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-2">
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <Badge variant={u.role === "ADMIN" ? "danger" : u.role === "COMPANY" ? "default" : "secondary"}>
                      {u.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent audit logs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText size={18} />
                Recent Activity
              </CardTitle>
              <Link href="/admin/audit-log" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                All <ArrowRight size={14} />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLogs.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="p-2">
                      <p className="text-sm">
                        <span className="font-medium">{log.actor.name}</span>{" "}
                        <span className="text-gray-500">{log.action.replace(/_/g, " ").toLowerCase()}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {log.company?.name && `${log.company.name} · `}
                        {formatDate(log.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
