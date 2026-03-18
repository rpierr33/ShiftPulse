import { requireRole } from "@/lib/auth-utils";
import { getCompanyForUser } from "@/actions/company";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ShiftRequestActions, CancelAssignmentButton } from "@/components/company/assignment-actions";
import { formatDate, formatTime } from "@/lib/utils";
import { Briefcase, Hand } from "lucide-react";

export default async function CompanyAssignmentsPage() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/login");

  const assignments = await db.assignment.findMany({
    where: {
      shift: { companyId: company.id },
    },
    include: {
      workerProfile: { include: { user: { select: { name: true } } } },
      shift: { select: { title: true, date: true, startTime: true, endTime: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingRequests = assignments.filter((a) => a.status === "PENDING");
  const activeAssignments = assignments.filter((a) => ["CONFIRMED", "IN_PROGRESS"].includes(a.status));
  const pastAssignments = assignments.filter((a) => ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(a.status));

  const statusVariant = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "success" as const;
      case "PENDING": return "warning" as const;
      case "IN_PROGRESS": return "default" as const;
      case "COMPLETED": return "secondary" as const;
      case "CANCELLED": return "danger" as const;
      case "NO_SHOW": return "danger" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div>
      <TopBar title="Assignments" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Pending shift requests */}
        {pendingRequests.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Hand size={18} />
                Shift Requests ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.workerProfile.user.name}</TableCell>
                      <TableCell>{a.shift?.title || "—"}</TableCell>
                      <TableCell>{a.shift ? formatDate(a.shift.date) : "—"}</TableCell>
                      <TableCell>
                        {a.shift ? `${formatTime(a.shift.startTime)} - ${formatTime(a.shift.endTime)}` : "—"}
                      </TableCell>
                      <TableCell>
                        <ShiftRequestActions assignmentId={a.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Active assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase size={18} />
              Active Assignments ({activeAssignments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeAssignments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No active assignments</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAssignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.workerProfile.user.name}</TableCell>
                      <TableCell>{a.shift?.title || "—"}</TableCell>
                      <TableCell>{a.shift ? formatDate(a.shift.date) : "—"}</TableCell>
                      <TableCell>
                        {a.shift ? `${formatTime(a.shift.startTime)} - ${formatTime(a.shift.endTime)}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <CancelAssignmentButton assignmentId={a.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Past assignments */}
        {pastAssignments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Past Assignments ({pastAssignments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastAssignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.workerProfile.user.name}</TableCell>
                      <TableCell>{a.shift?.title || "—"}</TableCell>
                      <TableCell>{a.shift ? formatDate(a.shift.date) : "—"}</TableCell>
                      <TableCell>
                        {a.shift ? `${formatTime(a.shift.startTime)} - ${formatTime(a.shift.endTime)}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
