import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { getClockStatus } from "@/actions/clock";
import { TopBar } from "@/components/layout/top-bar";
import { ClockPageClient } from "@/components/worker/clock-page-client";

export default async function ClockPage() {
  const user = await requireRole("WORKER");
  const clockStatus = await getClockStatus(user.id);

  const companies = await db.companyMembership.findMany({
    where: { userId: user.id, status: "APPROVED" },
    include: { company: { select: { id: true, name: true } } },
  });

  const recentEvents = await db.clockEvent.findMany({
    where: { userId: user.id },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Serialize dates for client component
  const serializedClockStatus = {
    isClockedIn: clockStatus.isClockedIn,
    ...(clockStatus.isClockedIn ? {
      currentEntryId: clockStatus.currentEntryId,
      clockInTime: clockStatus.clockInTime,
      companyId: clockStatus.companyId,
      companyName: clockStatus.companyName,
      shiftTitle: clockStatus.shiftTitle,
    } : {}),
  };

  return (
    <div>
      <TopBar title="Clock In/Out" />
      <ClockPageClient
        clockStatus={serializedClockStatus}
        companies={companies.map((m) => ({
          id: m.id,
          company: { id: m.company.id, name: m.company.name },
        }))}
        recentEvents={recentEvents.map((e) => ({
          id: e.id,
          type: e.type,
          timestamp: e.timestamp,
          company: { name: e.company.name },
        }))}
      />
    </div>
  );
}
