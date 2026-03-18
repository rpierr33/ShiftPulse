import { requireRole } from "@/lib/auth-utils";
import { getCompanyForUser } from "@/actions/company";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CreateShiftForm } from "@/components/company/create-shift-form";
import { AssignWorkerDialog } from "@/components/company/assign-worker-dialog";
import { formatDate, formatTime } from "@/lib/utils";
import { Calendar, Repeat } from "lucide-react";

export default async function CompanyShiftsPage() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/login");

  const [shifts, approvedWorkers] = await Promise.all([
    db.shift.findMany({
      where: { companyId: company.id },
      include: {
        _count: { select: { assignments: true } },
        assignments: {
          where: { status: { not: "CANCELLED" } },
          include: { workerProfile: { include: { user: { select: { name: true } } } } },
        },
      },
      orderBy: { date: "desc" },
    }),
    db.companyMembership.findMany({
      where: { companyId: company.id, status: "APPROVED", role: "worker" },
      include: {
        user: {
          select: {
            name: true,
            workerProfile: { select: { id: true, specialties: true } },
          },
        },
      },
    }),
  ]);

  const workers = approvedWorkers
    .filter((m) => m.user.workerProfile)
    .map((m) => ({
      profileId: m.user.workerProfile!.id,
      name: m.user.name,
      specialties: m.user.workerProfile!.specialties,
    }));

  const statusVariant = (status: string) => {
    switch (status) {
      case "OPEN": return "default" as const;
      case "ASSIGNED": return "success" as const;
      case "IN_PROGRESS": return "warning" as const;
      case "COMPLETED": return "secondary" as const;
      case "CANCELLED": return "danger" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div>
      <TopBar title="Shifts" subtitle="Create and manage shifts" />

      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-end">
          <Link href="/company/shifts/templates">
            <Button variant="outline">
              <Repeat size={16} />
              Manage Templates
            </Button>
          </Link>
        </div>

        <CreateShiftForm companyId={company.id} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={18} />
              All Shifts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shifts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No shifts created yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{shift.title}</p>
                          {shift.assignments.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {shift.assignments.map((a) => a.workerProfile.user.name).join(", ")}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(shift.date)}</TableCell>
                      <TableCell>
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </TableCell>
                      <TableCell>{shift.location || "—"}</TableCell>
                      <TableCell>
                        {shift._count.assignments} / {shift.capacity}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(shift.status)}>{shift.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {shift.status !== "CANCELLED" && shift.status !== "COMPLETED" && shift._count.assignments < shift.capacity && (
                          <AssignWorkerDialog
                            shiftId={shift.id}
                            shiftTitle={shift.title}
                            workers={workers.filter(
                              (w) => !shift.assignments.some((a) => a.workerProfileId === w.profileId)
                            )}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
