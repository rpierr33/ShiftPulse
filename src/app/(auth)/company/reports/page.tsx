import { requireRole } from "@/lib/auth-utils";
import { getCompanyForUser } from "@/actions/company";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { WeeklyChart } from "@/components/company/weekly-chart";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getWeekRange, formatDate } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import { ExportForm } from "@/components/company/export-form";

export default async function CompanyReportsPage() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/login");

  const { start, end } = getWeekRange();

  const [weekEntries, , workers] = await Promise.all([
    db.timeEntry.findMany({
      where: { companyId: company.id, clockInTime: { gte: start, lte: end } },
      include: { user: { select: { name: true } } },
    }),
    db.timeEntry.findMany({
      where: { companyId: company.id, clockOutTime: { not: null } },
      include: { user: { select: { name: true } } },
      orderBy: { clockInTime: "desc" },
      take: 200,
    }),
    db.companyMembership.findMany({
      where: { companyId: company.id, status: "APPROVED" },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  const totalHoursWeek = weekEntries.reduce((s, e) => s + (e.duration || 0), 0) / 60;
  const avgDailyHours = totalHoursWeek / 7;
  const approvedCount = weekEntries.filter((e) => e.status === "APPROVED").length;
  const pendingCount = weekEntries.filter((e) => e.status === "PENDING").length;

  // Hours by worker
  const workerHours = workers.map((w) => {
    const hours = weekEntries
      .filter((e) => e.userId === w.user.id)
      .reduce((s, e) => s + (e.duration || 0), 0) / 60;
    return { name: w.user.name, hours };
  }).sort((a, b) => b.hours - a.hours);

  // Daily chart
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyData = daysOfWeek.map((day, i) => ({
    day,
    hours: weekEntries
      .filter((e) => new Date(e.clockInTime).getDay() === i)
      .reduce((s, e) => s + (e.duration || 0), 0) / 60,
  }));

  return (
    <div>
      <TopBar title="Reports" subtitle={`${formatDate(start)} - ${formatDate(end)}`} />

      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Hours" value={totalHoursWeek.toFixed(1)} color="blue" />
          <MetricCard label="Avg Daily" value={avgDailyHours.toFixed(1)} color="green" />
          <MetricCard label="Approved" value={approvedCount} color="green" />
          <MetricCard label="Pending" value={pendingCount} color="amber" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Hours Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <WeeklyChart data={dailyData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={18} />
                Hours by Worker
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workerHours.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No data</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead>
                      <TableHead>Hours This Week</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workerHours.map((w) => (
                      <TableRow key={w.name}>
                        <TableCell className="font-medium">{w.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px]">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min((w.hours / 40) * 100, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm">{w.hours.toFixed(1)}h</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <ExportForm companyId={company.id} />
      </div>
    </div>
  );
}
