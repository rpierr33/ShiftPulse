import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { getClockStatus } from "@/actions/clock";
import { getWeekRange, formatTime, formatDate, formatDuration } from "@/lib/utils";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { Badge } from "@/components/ui/badge";
import { ClockButton } from "@/components/worker/clock-button";
import { Clock, Calendar, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export default async function WorkerDashboard() {
  const user = await requireRole("WORKER");
  const { start, end } = getWeekRange();

  const [clockStatus, weekEntries, todayShifts, companies] = await Promise.all([
    getClockStatus(user.id),
    db.timeEntry.findMany({
      where: {
        userId: user.id,
        clockInTime: { gte: start, lte: end },
      },
      include: { company: { select: { name: true } }, shift: { select: { title: true } } },
      orderBy: { clockInTime: "desc" },
    }),
    db.assignment.findMany({
      where: {
        workerProfile: { userId: user.id },
        shift: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        status: { in: ["CONFIRMED", "PENDING"] },
      },
      include: {
        shift: { include: { company: { select: { name: true } } } },
      },
    }),
    db.companyMembership.findMany({
      where: { userId: user.id, status: "APPROVED" },
      include: { company: true },
    }),
  ]);

  const weekHours = weekEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / 60;
  const todayEntries = weekEntries.filter(
    (e) => new Date(e.clockInTime).toDateString() === new Date().toDateString()
  );
  const todayHours = todayEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / 60;

  const primaryCompany = companies[0]?.company;

  return (
    <div>
      <TopBar title="Dashboard" subtitle={`Welcome back, ${user.name.split(" ")[0]}`} />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Clock In/Out hero section */}
        <Card className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white border-0 shadow-xl shadow-blue-600/15 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-blue-200 text-xs font-medium bg-white/10 rounded-full px-3 py-1 mb-3">
                <Zap size={12} />
                Quick Action
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">
                {clockStatus.isClockedIn ? "You're on the clock" : "Ready to start?"}
              </h2>
              <p className="text-blue-100/80">
                {clockStatus.isClockedIn
                  ? `Clocked in at ${clockStatus.clockInTime ? formatTime(clockStatus.clockInTime) : ""} — ${clockStatus.companyName || ""}`
                  : primaryCompany
                    ? `Clock in to ${primaryCompany.name}`
                    : "Join a company to get started"}
              </p>
            </div>
            {primaryCompany && (
              <ClockButton
                isClockedIn={clockStatus.isClockedIn}
                companyId={clockStatus.isClockedIn && clockStatus.companyId ? String(clockStatus.companyId) : primaryCompany.id}
                clockInTime={clockStatus.clockInTime}
                companyName={clockStatus.companyName}
              />
            )}
          </CardContent>
        </Card>

        {/* Quick metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Hours Today" value={todayHours.toFixed(1)} color="blue" href="/worker/history" />
          <MetricCard label="Hours This Week" value={weekHours.toFixed(1)} color="green" href="/worker/history" />
          <MetricCard label="Entries This Week" value={weekEntries.length} color="purple" href="/worker/history" />
          <MetricCard
            label="Status"
            value={clockStatus.isClockedIn ? "Active" : "Idle"}
            color={clockStatus.isClockedIn ? "green" : "gray"}
            href="/worker/clock"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Today's Shifts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Calendar size={14} className="text-blue-600" />
                </div>
                Today&apos;s Shifts
              </CardTitle>
              <Link href="/worker/shifts" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transition-colors">
                View all <ArrowRight size={14} />
              </Link>
            </CardHeader>
            <CardContent>
              {todayShifts.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No shifts scheduled today</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {todayShifts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-xl border border-gray-100/50 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{a.shift?.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {a.shift && `${formatTime(a.shift.startTime)} - ${formatTime(a.shift.endTime)}`}
                        </p>
                      </div>
                      <Badge variant={a.status === "CONFIRMED" ? "success" : "warning"}>
                        {a.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Time Entries */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Clock size={14} className="text-purple-600" />
                </div>
                Recent Entries
              </CardTitle>
              <Link href="/worker/history" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transition-colors">
                View all <ArrowRight size={14} />
              </Link>
            </CardHeader>
            <CardContent>
              {weekEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Clock size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No entries this week</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {weekEntries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-xl border border-gray-100/50 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{entry.company.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(entry.clockInTime)} &middot;{" "}
                          {formatTime(entry.clockInTime)}
                          {entry.clockOutTime ? ` - ${formatTime(entry.clockOutTime)}` : " (active)"}
                        </p>
                      </div>
                      <div className="text-right">
                        {entry.duration ? (
                          <span className="text-sm font-semibold text-gray-900">{formatDuration(entry.duration)}</span>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Join company prompt if no companies */}
        {companies.length === 0 && (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap size={24} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">Join a Company</h3>
              <p className="text-gray-500 text-sm mb-5 max-w-sm mx-auto">
                Enter a join code from your employer to connect and start tracking your shifts.
              </p>
              <Link href="/worker/profile">
                <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-500 text-sm font-medium transition-all shadow-sm shadow-blue-600/20 hover:shadow-blue-500/30 active:scale-[0.98]">
                  Enter Join Code
                </button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
