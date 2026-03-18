import { requireRole } from "@/lib/auth-utils";
import { getCompanyForUser } from "@/actions/company";
import { db } from "@/lib/db";
import { getWeekRange, formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { Badge } from "@/components/ui/badge";
import { WeeklyChart } from "@/components/company/weekly-chart";
import { VisitStatusCards } from "@/components/company/visit-status-cards";
import { Clock, Calendar, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";

export default async function CompanyDashboard() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/login");

  const { start, end } = getWeekRange();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    workerCount,
    pendingApprovals,
    weekEntries,
    todayShifts,
    pendingTimeEntries,
    recentEntries,
  ] = await Promise.all([
    db.companyMembership.count({ where: { companyId: company.id, status: "APPROVED" } }),
    db.companyMembership.count({ where: { companyId: company.id, status: "PENDING" } }),
    db.timeEntry.findMany({
      where: { companyId: company.id, clockInTime: { gte: start, lte: end } },
      include: { user: { select: { name: true } } },
    }),
    db.shift.findMany({
      where: { companyId: company.id, date: { gte: today, lt: tomorrow } },
      include: {
        assignments: { include: { workerProfile: { include: { user: { select: { name: true } } } } } },
      },
    }),
    db.timeEntry.count({ where: { companyId: company.id, status: "PENDING" } }),
    db.timeEntry.findMany({
      where: { companyId: company.id },
      include: {
        user: { select: { name: true } },
        shift: { select: { title: true } },
      },
      orderBy: { clockInTime: "desc" },
      take: 5,
    }),
  ]);

  const weekHours = weekEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / 60;
  const activeClockIns = weekEntries.filter((e) => !e.clockOutTime).length;

  // Build daily hours for chart
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyData = daysOfWeek.map((day, i) => {
    const dayEntries = weekEntries.filter(
      (e) => new Date(e.clockInTime).getDay() === i
    );
    return {
      day,
      hours: dayEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / 60,
    };
  });

  // Visit status counts (inspired by reference UI)
  const completedToday = weekEntries.filter(
    (e) =>
      new Date(e.clockInTime).toDateString() === new Date().toDateString() &&
      e.clockOutTime
  ).length;
  const inProgressToday = weekEntries.filter(
    (e) =>
      new Date(e.clockInTime).toDateString() === new Date().toDateString() &&
      !e.clockOutTime
  ).length;

  const visitStatuses = [
    { label: "In Progress", count: inProgressToday, color: "blue", href: "/company/time-entries" },
    { label: "Unable to Complete", count: 0, color: "amber", href: "/company/time-entries" },
    { label: "Missed", count: 0, color: "red", href: "/company/shifts" },
    { label: "Not Started", count: todayShifts.length - completedToday - inProgressToday, color: "gray", href: "/company/shifts" },
    { label: "Completed", count: completedToday, color: "green", href: "/company/time-entries" },
    { label: "Pending Approval", count: pendingTimeEntries, color: "yellow", href: "/company/time-entries" },
  ];

  return (
    <div>
      <TopBar title="Dashboard" subtitle={company.name} />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Visit Status (reference UI inspired) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Visit Status on {formatDate(new Date())}
            </CardTitle>
            <Link href="/company/dashboard" className="text-gray-400 hover:text-gray-600">
              <RefreshCw size={16} />
            </Link>
          </CardHeader>
          <CardContent>
            <VisitStatusCards statuses={visitStatuses} />
          </CardContent>
        </Card>

        {/* Quick metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Active Workers" value={workerCount} color="blue" href="/company/workers" />
          <MetricCard label="Hours This Week" value={weekHours.toFixed(1)} color="green" href="/company/reports" />
          <MetricCard label="Active Now" value={activeClockIns} color="purple" href="/company/time-entries" />
          <MetricCard
            label="Pending Approvals"
            value={pendingApprovals + pendingTimeEntries}
            color={pendingApprovals + pendingTimeEntries > 0 ? "amber" : "gray"}
            href="/company/time-entries"
          />
        </div>

        {/* Weekly chart + Today's shifts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Weekly Hours</CardTitle>
              <span className="text-sm text-gray-500">
                {formatDate(start)} - {formatDate(end)}
              </span>
            </CardHeader>
            <CardContent>
              <WeeklyChart data={dailyData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar size={18} />
                Today&apos;s Shifts
              </CardTitle>
              <Link href="/company/shifts" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </CardHeader>
            <CardContent>
              {todayShifts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No shifts today</p>
              ) : (
                <div className="space-y-3">
                  {todayShifts.map((shift) => (
                    <div key={shift.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{shift.title}</p>
                        <Badge variant={shift.status === "COMPLETED" ? "success" : "default"}>
                          {shift.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {shift.assignments.length} / {shift.capacity} assigned
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent time entries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} />
              Recent Time Entries
            </CardTitle>
            <Link href="/company/time-entries" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardContent>
            {recentEntries.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No entries yet</p>
            ) : (
              <div className="space-y-2">
                {recentEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{entry.user.name}</p>
                      <p className="text-xs text-gray-500">
                        {entry.shift?.title || "No shift"} · {formatDate(entry.clockInTime)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        entry.status === "APPROVED" ? "success" :
                        entry.status === "PENDING" ? "warning" :
                        entry.status === "REJECTED" ? "danger" : "secondary"
                      }
                    >
                      {entry.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Join code */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Company Join Code</p>
              <p className="text-xs text-blue-600">Share this code with workers to join your company</p>
            </div>
            <span className="text-2xl font-mono font-bold text-blue-700 tracking-wider">
              {company.joinCode}
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
