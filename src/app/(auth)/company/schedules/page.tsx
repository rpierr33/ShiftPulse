import { requireRole } from "@/lib/auth-utils";
import { getCompanyForUser } from "@/actions/company";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import { CreateScheduleForm } from "@/components/company/create-schedule-form";
import { ScheduleActions } from "@/components/company/schedule-actions";

export default async function CompanySchedulesPage() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/login");

  const schedules = await db.schedule.findMany({
    where: { companyId: company.id, deletedAt: null },
    include: { _count: { select: { assignments: true } } },
    orderBy: { startDate: "desc" },
  });

  return (
    <div>
      <TopBar title="Schedules" />

      <div className="p-4 lg:p-6 space-y-6">
        <CreateScheduleForm companyId={company.id} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays size={18} />
              All Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No schedules created yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Assignments</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.name}</TableCell>
                      <TableCell>
                        {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                      </TableCell>
                      <TableCell>{schedule._count.assignments}</TableCell>
                      <TableCell>
                        <Badge variant={schedule.isPublished ? "success" : "secondary"}>
                          {schedule.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ScheduleActions scheduleId={schedule.id} isPublished={schedule.isPublished} />
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
