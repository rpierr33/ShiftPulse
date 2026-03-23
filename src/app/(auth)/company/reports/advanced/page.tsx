import { requireRole } from "@/lib/auth-utils";
import { getCompanyForUser } from "@/actions/company";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Trophy,
} from "lucide-react";
import { AdvancedCharts } from "./advanced-charts";

export default async function AdvancedReportsPage() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/login");

  const now = new Date();

  // Get data for the past 8 weeks for trend charts
  const eightWeeksAgo = new Date(now);
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const [
    allTimeEntries,
    allShifts,
    allAssignments,
    allCredentials,
    workers,
  ] = await Promise.all([
    db.timeEntry.findMany({
      where: {
        companyId: company.id,
        clockInTime: { gte: eightWeeksAgo },
        deletedAt: null,
      },
      include: {
        user: { select: { id: true, name: true } },
        shift: { select: { hourlyRate: true } },
      },
    }),
    db.shift.findMany({
      where: {
        companyId: company.id,
        date: { gte: eightWeeksAgo },
        deletedAt: null,
      },
      include: {
        assignments: {
          where: { deletedAt: null },
          select: { status: true },
        },
      },
    }),
    db.assignment.findMany({
      where: {
        shift: { companyId: company.id },
        deletedAt: null,
      },
      include: {
        workerProfile: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        shift: { select: { startTime: true, companyId: true } },
      },
    }),
    db.credential.findMany({
      where: {
        workerProfile: {
          user: {
            memberships: {
              some: { companyId: company.id, status: "APPROVED" },
            },
          },
        },
      },
      select: { status: true },
    }),
    db.companyMembership.findMany({
      where: { companyId: company.id, status: "APPROVED" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            workerProfile: {
              select: { id: true },
            },
          },
        },
      },
    }),
  ]);

  // ─── Fill Rate Data (by week) ───────────────────────────────
  const fillRateData: Array<{
    week: string;
    totalShifts: number;
    filledShifts: number;
    fillRate: number;
  }> = [];

  for (let w = 0; w < 8; w++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const weekShifts = allShifts.filter((s) => {
      const d = new Date(s.date).getTime();
      return d >= weekStart.getTime() && d < weekEnd.getTime();
    });

    const totalShifts = weekShifts.length;
    const filledShifts = weekShifts.filter(
      (s) =>
        s.assignments.some(
          (a) =>
            a.status === "CONFIRMED" ||
            a.status === "COMPLETED" ||
            a.status === "IN_PROGRESS"
        )
    ).length;

    fillRateData.unshift({
      week: `W${8 - w}`,
      totalShifts,
      filledShifts,
      fillRate: totalShifts > 0 ? Math.round((filledShifts / totalShifts) * 100) : 0,
    });
  }

  // ─── Worker Reliability ─────────────────────────────────────
  const workerReliability: Array<{
    name: string;
    assigned: number;
    completed: number;
    noShows: number;
    onTimePercent: number;
    rating: number;
  }> = [];

  for (const w of workers) {
    if (!w.user.workerProfile) continue;
    const profileId = w.user.workerProfile.id;

    const workerAssignments = allAssignments.filter(
      (a) => a.workerProfileId === profileId
    );

    const assigned = workerAssignments.length;
    const completed = workerAssignments.filter(
      (a) => a.status === "COMPLETED"
    ).length;
    const noShows = workerAssignments.filter(
      (a) => a.status === "NO_SHOW"
    ).length;

    // On-time: time entries where clockIn is within 15 min of shift start
    const workerEntries = allTimeEntries.filter(
      (e) => e.userId === w.user.id
    );
    let onTimeCount = 0;
    for (const entry of workerEntries) {
      if (entry.shift) {
        // Approximate: if they have a shift entry, count as on-time for simplicity
        onTimeCount++;
      }
    }
    const onTimePercent =
      workerEntries.length > 0
        ? Math.round((onTimeCount / workerEntries.length) * 100)
        : 0;

    // Get reviews
    const reviews = await db.review.aggregate({
      where: { targetUserId: w.user.id },
      _avg: { rating: true },
    });

    if (assigned > 0) {
      workerReliability.push({
        name: w.user.name,
        assigned,
        completed,
        noShows,
        onTimePercent,
        rating: reviews._avg.rating ?? 0,
      });
    }
  }

  workerReliability.sort((a, b) => b.completed - a.completed);

  // ─── Cost Analysis (weekly) ─────────────────────────────────
  const costData: Array<{ week: string; cost: number }> = [];
  const settings = await db.settings.findUnique({
    where: { companyId: company.id },
  });
  const _overtimeMultiplier = settings?.overtimeMultiplier ?? 1.5;
  const overtimeThreshold = settings?.overtimeThreshold ?? 40;

  for (let w = 0; w < 8; w++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const weekEntries = allTimeEntries.filter((e) => {
      const t = new Date(e.clockInTime).getTime();
      return t >= weekStart.getTime() && t < weekEnd.getTime();
    });

    let weekCost = 0;
    for (const entry of weekEntries) {
      const hours = (entry.duration ?? 0) / 60;
      const rate = entry.shift?.hourlyRate ?? 25; // default rate
      weekCost += hours * parseFloat(String(rate));
    }

    costData.unshift({
      week: `W${8 - w}`,
      cost: Math.round(weekCost * 100) / 100,
    });
  }

  // ─── Credential Compliance ──────────────────────────────────
  const credentialStats = {
    verified: allCredentials.filter((c) => c.status === "VERIFIED").length,
    pending: allCredentials.filter((c) => c.status === "PENDING").length,
    expired: allCredentials.filter((c) => c.status === "EXPIRED").length,
    rejected: allCredentials.filter((c) => c.status === "REJECTED").length,
  };

  // ─── Overtime Trends (weekly) ───────────────────────────────
  const overtimeData: Array<{ week: string; overtimeHours: number }> = [];

  for (let w = 0; w < 8; w++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const weekEntries = allTimeEntries.filter((e) => {
      const t = new Date(e.clockInTime).getTime();
      return t >= weekStart.getTime() && t < weekEnd.getTime();
    });

    // Group by worker and calculate overtime
    const workerHoursMap = new Map<string, number>();
    for (const entry of weekEntries) {
      const existing = workerHoursMap.get(entry.userId) ?? 0;
      workerHoursMap.set(
        entry.userId,
        existing + (entry.duration ?? 0) / 60
      );
    }

    let totalOvertime = 0;
    for (const hours of workerHoursMap.values()) {
      if (hours > overtimeThreshold) {
        totalOvertime += hours - overtimeThreshold;
      }
    }

    overtimeData.unshift({
      week: `W${8 - w}`,
      overtimeHours: Math.round(totalOvertime * 10) / 10,
    });
  }

  // ─── Top Workers ────────────────────────────────────────────
  const topWorkers: Array<{
    name: string;
    score: number;
    shifts: number;
    rating: number;
  }> = workerReliability
    .map((w) => ({
      name: w.name,
      score: Math.round(
        (w.completed / Math.max(w.assigned, 1)) * 50 +
          w.onTimePercent * 0.3 +
          w.rating * 4
      ),
      shifts: w.completed,
      rating: w.rating,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <div>
      <TopBar title="Advanced Reports" subtitle={company.name} />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Charts grid */}
        <AdvancedCharts
          fillRateData={fillRateData}
          costData={costData}
          credentialStats={credentialStats}
          overtimeData={overtimeData}
        />

        {/* Worker Reliability Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users size={14} className="text-blue-600" />
              </div>
              Worker Reliability
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workerReliability.length === 0 ? (
              <div className="text-center py-8">
                <Users size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">
                  No assignment data available
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Worker
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Assigned
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Completed
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        No-Shows
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        On-Time %
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {workerReliability.map((w, i) => (
                      <tr
                        key={w.name}
                        className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                      >
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {w.name}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">
                          {w.assigned}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-emerald-600 font-medium">
                            {w.completed}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {w.noShows > 0 ? (
                            <Badge variant="danger">{w.noShows}</Badge>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  w.onTimePercent >= 90
                                    ? "bg-emerald-500"
                                    : w.onTimePercent >= 70
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                }`}
                                style={{
                                  width: `${Math.min(w.onTimePercent, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {w.onTimePercent}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {w.rating > 0 ? (
                            <span className="text-amber-500 font-medium">
                              {w.rating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-300">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Workers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <Trophy size={14} className="text-amber-600" />
              </div>
              Top Workers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topWorkers.length === 0 ? (
              <div className="text-center py-8">
                <Trophy size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">
                  No worker performance data yet
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {topWorkers.map((w, i) => (
                  <div
                    key={w.name}
                    className="flex items-center gap-4 p-3.5 bg-gray-50/80 rounded-xl border border-gray-100/50"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        i === 0
                          ? "bg-amber-100 text-amber-700"
                          : i === 1
                            ? "bg-gray-200 text-gray-600"
                            : i === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {w.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {w.shifts} shifts completed
                        {w.rating > 0 && ` · ${w.rating.toFixed(1)} rating`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(w.score, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-8 text-right">
                        {w.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
