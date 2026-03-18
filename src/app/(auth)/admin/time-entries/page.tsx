import { requireRole } from "@/lib/auth-utils";
import { getAllTimeEntries } from "@/actions/admin";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate, formatTime, formatDuration } from "@/lib/utils";
import { Clock } from "lucide-react";
import { Pagination } from "@/components/admin/pagination";

export default async function AdminTimeEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireRole("ADMIN");
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10));
  const { entries, total, pages } = await getAllTimeEntries(page);

  const statusVariant = (status: string) => {
    switch (status) {
      case "APPROVED": return "success" as const;
      case "PENDING": return "warning" as const;
      case "REJECTED": return "danger" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div>
      <TopBar title="Time Entries" subtitle={`${total} total`} />

      <div className="p-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} />
              All Time Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Manual</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.user.name}</TableCell>
                    <TableCell>{entry.company.name}</TableCell>
                    <TableCell>{formatDate(entry.clockInTime)}</TableCell>
                    <TableCell>{formatTime(entry.clockInTime)}</TableCell>
                    <TableCell>
                      {entry.clockOutTime ? formatTime(entry.clockOutTime) : "\u2014"}
                    </TableCell>
                    <TableCell>
                      {entry.duration ? formatDuration(entry.duration) : "Active"}
                    </TableCell>
                    <TableCell>
                      {entry.isManualEntry && (
                        <Badge variant="warning">Manual</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(entry.status)}>{entry.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={page} totalPages={pages} basePath="/admin/time-entries" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
