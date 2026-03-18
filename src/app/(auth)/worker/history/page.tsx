import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatTime, formatDate, formatDuration } from "@/lib/utils";
import { History } from "lucide-react";
import { ManualEntryForm } from "@/components/worker/manual-entry-form";

export default async function WorkerHistoryPage() {
  const user = await requireRole("WORKER");

  const entries = await db.timeEntry.findMany({
    where: { userId: user.id },
    include: {
      company: { select: { name: true } },
      shift: { select: { title: true } },
    },
    orderBy: { clockInTime: "desc" },
    take: 50,
  });

  // Get companies that allow manual entry
  const memberships = await db.companyMembership.findMany({
    where: { userId: user.id, status: "APPROVED" },
    include: { company: { select: { id: true, name: true, allowManualEntry: true } } },
  });
  const manualEntryCompanies = memberships
    .filter((m) => m.company.allowManualEntry)
    .map((m) => ({ id: m.company.id, name: m.company.name }));

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
      <TopBar title="Time History" />

      <div className="p-4 lg:p-6 space-y-6">
        {manualEntryCompanies.length > 0 && (
          <ManualEntryForm companies={manualEntryCompanies} />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History size={18} />
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
                    <TableHead>Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {formatDate(entry.clockInTime)}
                      </TableCell>
                      <TableCell>{entry.company.name}</TableCell>
                      <TableCell>{entry.shift?.title || "—"}</TableCell>
                      <TableCell>{formatTime(entry.clockInTime)}</TableCell>
                      <TableCell>
                        {entry.clockOutTime ? formatTime(entry.clockOutTime) : "—"}
                      </TableCell>
                      <TableCell>
                        {entry.duration ? formatDuration(entry.duration) : "Active"}
                      </TableCell>
                      <TableCell>
                        {entry.isManualEntry ? (
                          <Badge variant="secondary">Manual</Badge>
                        ) : (
                          <span className="text-xs text-gray-400">Clock</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(entry.status)}>
                          {entry.status}
                        </Badge>
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
