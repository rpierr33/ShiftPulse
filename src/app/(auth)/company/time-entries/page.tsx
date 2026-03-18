import { requireRole } from "@/lib/auth-utils";
import { getCompanyForUser } from "@/actions/company";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { TimeEntryActions } from "@/components/company/time-entry-actions";
import { formatDate, formatTime, formatDuration } from "@/lib/utils";
import { Clock } from "lucide-react";

function EvvBadge({ status }: { status: string | null }) {
  if (!status) {
    return <Badge variant="secondary">No data</Badge>;
  }
  switch (status) {
    case "verified":
      return <Badge variant="success">Verified</Badge>;
    case "flagged":
      return <Badge variant="warning">Flagged</Badge>;
    case "out_of_range":
      return <Badge variant="danger">Out of range</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default async function CompanyTimeEntriesPage() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/login");

  const entries = await db.timeEntry.findMany({
    where: { companyId: company.id },
    include: {
      user: { select: { name: true } },
      shift: { select: { title: true } },
    },
    orderBy: { clockInTime: "desc" },
    take: 100,
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case "APPROVED": return "success" as const;
      case "PENDING": return "warning" as const;
      case "REJECTED": return "danger" as const;
      case "FLAGGED": return "warning" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div>
      <TopBar title="Time Entries" subtitle="Review and approve worker time entries" />

      <div className="p-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} />
              All Time Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No time entries yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>EVV</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.user.name}</TableCell>
                      <TableCell>{formatDate(entry.clockInTime)}</TableCell>
                      <TableCell>{formatTime(entry.clockInTime)}</TableCell>
                      <TableCell>
                        {entry.clockOutTime ? formatTime(entry.clockOutTime) : "\u2014"}
                      </TableCell>
                      <TableCell>
                        {entry.duration ? formatDuration(entry.duration) : "Active"}
                      </TableCell>
                      <TableCell>{entry.shift?.title || "\u2014"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(entry.status)}>{entry.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <EvvBadge status={entry.evvStatus} />
                          {entry.distanceFromSite != null && (
                            <span className="text-xs text-gray-400 ml-1">
                              {entry.distanceFromSite}m
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.status === "PENDING" && (
                          <TimeEntryActions entryId={entry.id} />
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
