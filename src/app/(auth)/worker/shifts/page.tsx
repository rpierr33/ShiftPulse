import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { RequestShiftButton } from "@/components/worker/request-shift-button";
import { formatTime, formatDate } from "@/lib/utils";
import { Calendar, MapPin, Clock, Briefcase } from "lucide-react";

export default async function WorkerShiftsPage() {
  const user = await requireRole("WORKER");

  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: user.id },
  });

  // Get worker's company memberships
  const memberships = await db.companyMembership.findMany({
    where: { userId: user.id, status: "APPROVED" },
    select: { companyId: true, company: { select: { name: true } } },
  });
  const companyIds = memberships.map((m) => m.companyId);

  // Get worker's existing assignments
  const assignments = await db.assignment.findMany({
    where: {
      workerProfile: { userId: user.id },
      status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
    },
    include: {
      shift: { include: { company: { select: { name: true } } } },
    },
    orderBy: { shift: { date: "asc" } },
  });

  const upcomingAssignments = assignments.filter(
    (a) => a.shift && new Date(a.shift.date) >= new Date(new Date().setHours(0, 0, 0, 0))
  );

  // Get available open shifts the worker can request
  const existingShiftIds = assignments.map((a) => a.shiftId).filter(Boolean) as string[];
  const availableShifts = await db.shift.findMany({
    where: {
      companyId: { in: companyIds },
      status: "OPEN",
      date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      id: { notIn: existingShiftIds },
    },
    include: {
      company: { select: { name: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: { date: "asc" },
  });

  // Filter to shifts with remaining capacity
  const openShifts = availableShifts.filter((s) => s._count.assignments < s.capacity);

  const pastAssignments = await db.assignment.findMany({
    where: {
      workerProfile: { userId: user.id },
      status: { in: ["COMPLETED", "NO_SHOW"] },
    },
    include: {
      shift: { include: { company: { select: { name: true } } } },
    },
    orderBy: { shift: { date: "desc" } },
    take: 10,
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "success" as const;
      case "PENDING": return "warning" as const;
      case "IN_PROGRESS": return "default" as const;
      case "COMPLETED": return "secondary" as const;
      case "NO_SHOW": return "danger" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div>
      <TopBar title="My Shifts" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Available shifts to request */}
        {openShifts.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Briefcase size={18} />
                Available Shifts ({openShifts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {openShifts.map((shift) => (
                  <div key={shift.id} className="p-4 bg-white border border-blue-100 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{shift.title}</h4>
                        <p className="text-sm text-gray-500">{shift.company.name}</p>
                      </div>
                      {workerProfile && (
                        <RequestShiftButton shiftId={shift.id} />
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(shift.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </span>
                      {shift.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {shift.location}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {shift._count.assignments}/{shift.capacity} assigned
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* My upcoming shifts */}
        <Card>
          <CardHeader>
            <CardTitle>My Upcoming Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length === 0 ? (
              <EmptyState
                icon={<Calendar size={40} />}
                title="No upcoming shifts"
                description={openShifts.length > 0
                  ? "Request available shifts above to get started."
                  : "No shifts available right now. Check back later or contact your company."
                }
              />
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((a) => (
                  <div key={a.id} className="p-4 border rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{a.shift?.title}</h4>
                        <p className="text-sm text-gray-500">{a.shift?.company.name}</p>
                      </div>
                      <Badge variant={statusVariant(a.status)}>
                        {a.status === "PENDING" ? "Requested" : a.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {a.shift && formatDate(a.shift.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {a.shift && `${formatTime(a.shift.startTime)} - ${formatTime(a.shift.endTime)}`}
                      </span>
                      {a.shift?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {a.shift.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past shifts */}
        <Card>
          <CardHeader>
            <CardTitle>Past Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            {pastAssignments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No past shifts</p>
            ) : (
              <div className="space-y-3">
                {pastAssignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{a.shift?.title}</p>
                      <p className="text-xs text-gray-500">
                        {a.shift && `${a.shift.company.name} · ${formatDate(a.shift.date)} · ${formatTime(a.shift.startTime)} - ${formatTime(a.shift.endTime)}`}
                      </p>
                    </div>
                    <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
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
