import { requireRole } from "@/lib/auth-utils";
import { getCompanyForUser } from "@/actions/company";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { WorkerApprovalActions } from "@/components/company/worker-approval-actions";
import { AvailabilitySummary } from "@/components/company/worker-availability-view";
import { formatDate } from "@/lib/utils";
import { Users, Phone, Mail, Calendar } from "lucide-react";

export default async function CompanyWorkersPage() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/login");

  const memberships = await db.companyMembership.findMany({
    where: { companyId: company.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          workerProfile: {
            select: {
              specialties: true,
              isAvailable: true,
              availabilitySlots: {
                where: { isRecurring: true },
                orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = memberships.filter((m) => m.status === "PENDING");
  const approved = memberships.filter((m) => m.status === "APPROVED");

  return (
    <div>
      <TopBar title="Workers" subtitle={`${approved.length} active workers`} />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Pending approvals */}
        {pending.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-800">
                Pending Requests ({pending.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pending.map((m) => (
                  <div key={m.id} className="p-4 bg-white rounded-lg border space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-lg">{m.user.name}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Mail size={14} />
                            {m.user.email}
                          </span>
                          {m.user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={14} />
                              {m.user.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            Requested {formatDate(m.createdAt)}
                          </span>
                        </div>
                      </div>
                      <WorkerApprovalActions membershipId={m.id} />
                    </div>
                    {m.user.workerProfile && (
                      <div className="flex flex-wrap gap-2">
                        {m.user.workerProfile.specialties.length > 0 ? (
                          m.user.workerProfile.specialties.map((s) => (
                            <Badge key={s} variant="secondary">{s}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No specialties listed</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active workers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={18} />
              Active Workers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Specialties</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approved.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.user.name}</TableCell>
                    <TableCell>{m.user.email}</TableCell>
                    <TableCell>{m.user.phone || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {m.user.workerProfile?.specialties.slice(0, 2).map((s) => (
                          <Badge key={s} variant="secondary">{s}</Badge>
                        )) || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <AvailabilitySummary
                        slots={m.user.workerProfile?.availabilitySlots ?? []}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.user.workerProfile?.isAvailable ? "success" : "secondary"}>
                        {m.user.workerProfile?.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Join code */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-900 mb-1 font-medium">Invite Workers</p>
            <p className="text-xs text-blue-600 mb-2">
              Share this join code with workers so they can connect to your company
            </p>
            <div className="bg-white rounded-lg p-3 text-center">
              <span className="text-3xl font-mono font-bold text-blue-700 tracking-wider">
                {company.joinCode}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
