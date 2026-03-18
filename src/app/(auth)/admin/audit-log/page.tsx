import { requireRole } from "@/lib/auth-utils";
import { getAuditLogs } from "@/actions/admin";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate, formatTime } from "@/lib/utils";
import { FileText } from "lucide-react";
import { Pagination } from "@/components/admin/pagination";

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireRole("ADMIN");
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10));
  const { logs, total, pages } = await getAuditLogs(page);

  return (
    <div>
      <TopBar title="Audit Log" subtitle={`${total} total entries`} />

      <div className="p-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={18} />
              All Audit Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No audit entries yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Company</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-sm">{formatDate(log.createdAt)}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          {formatTime(log.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{log.actor.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">
                          {log.entityType} ({log.entityId.slice(0, 8)}...)
                        </span>
                      </TableCell>
                      <TableCell>{log.company?.name || "\u2014"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Pagination currentPage={page} totalPages={pages} basePath="/admin/audit-log" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
