import { requireRole } from "@/lib/auth-utils";
import { getCompanyForUser } from "@/actions/company";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { getServiceLogs, getCMS1500Forms } from "@/actions/claims";
import { db } from "@/lib/db";
import { ClaimsClient } from "./claims-client";

export default async function ClaimsPage() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/login");

  // Fetch data in parallel
  const [serviceLogs, cms1500Forms, recentTimeEntries] = await Promise.all([
    getServiceLogs(company.id),
    getCMS1500Forms(company.id),
    db.timeEntry.findMany({
      where: {
        companyId: company.id,
        status: "APPROVED",
        clockOutTime: { not: null },
      },
      include: {
        user: { select: { id: true, name: true } },
        shift: { select: { title: true } },
      },
      orderBy: { clockInTime: "desc" },
      take: 50,
    }),
  ]);

  // Map time entries for the service log form
  const timeEntryOptions = recentTimeEntries.map((te) => ({
    id: te.id,
    workerName: te.user.name,
    date: te.clockInTime.toISOString().split("T")[0],
    shiftTitle: te.shift?.title ?? null,
  }));

  // Serialize dates for client components
  const serializedLogs = serviceLogs.map((log) => ({
    id: log.id,
    serviceDate: log.serviceDate.toISOString(),
    serviceType: log.serviceType,
    procedureCodes: log.procedureCodes,
    diagnosisCodes: log.diagnosisCodes,
    units: log.units,
    notes: log.notes,
    status: log.status,
    workerName: log.worker.name,
    workerId: log.worker.id,
    timeEntryId: log.timeEntryId,
    shiftTitle: log.timeEntry.shift?.title ?? null,
    createdAt: log.createdAt.toISOString(),
  }));

  const serializedForms = cms1500Forms.map((form) => ({
    id: form.id,
    patientFirstName: form.patientFirstName,
    patientLastName: form.patientLastName,
    insuranceType: form.insuranceType,
    totalCharges: form.totalCharges,
    status: form.status,
    createdAt: form.createdAt.toISOString(),
    serviceLogId: form.serviceLogId,
  }));

  return (
    <div>
      <TopBar title="Claims & Service Documentation" subtitle="Manage service logs and CMS-1500 claim forms" />

      <div className="p-4 lg:p-6">
        <ClaimsClient
          companyId={company.id}
          serviceLogs={serializedLogs}
          cms1500Forms={serializedForms}
          timeEntries={timeEntryOptions}
        />
      </div>
    </div>
  );
}
