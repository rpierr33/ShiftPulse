import { requireRole } from "@/lib/auth-utils";
import { getAllCompanies } from "@/actions/admin";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Building2 } from "lucide-react";
import { CompanyActions } from "@/components/admin/company-actions";
import { Pagination } from "@/components/admin/pagination";

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireRole("ADMIN");
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10));
  const { companies, total, pages } = await getAllCompanies(page);

  return (
    <div>
      <TopBar title="Companies" subtitle={`${total} total`} />

      <div className="p-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 size={18} />
              All Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Join Code</TableHead>
                  <TableHead>Workers</TableHead>
                  <TableHead>Shifts</TableHead>
                  <TableHead>Time Entries</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                        {c.joinCode}
                      </code>
                    </TableCell>
                    <TableCell>{c._count.memberships}</TableCell>
                    <TableCell>{c._count.shifts}</TableCell>
                    <TableCell>{c._count.timeEntries}</TableCell>
                    <TableCell>
                      <Badge variant={c.isActive ? "success" : "danger"}>
                        {c.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(c.createdAt)}</TableCell>
                    <TableCell>
                      <CompanyActions companyId={c.id} isActive={c.isActive} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={page} totalPages={pages} basePath="/admin/companies" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
