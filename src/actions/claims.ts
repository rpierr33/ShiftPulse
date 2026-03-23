"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

// ─── Helpers ────────────────────────────────────────────────────

async function getCompanyId(): Promise<string> {
  const user = await requireRole("COMPANY");
  const membership = await db.companyMembership.findFirst({
    where: { userId: user.id, status: "APPROVED", role: "admin" },
    select: { companyId: true },
  });
  if (!membership) throw new Error("No company found for this user");
  return membership.companyId;
}

// ─── Service Logs ───────────────────────────────────────────────

export async function getServiceLogs(
  companyId: string,
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    workerId?: string;
    status?: string;
  }
) {
  await requireRole("COMPANY");

  const where: Record<string, unknown> = { companyId };

  if (filters?.workerId) {
    where.workerId = filters.workerId;
  }
  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.serviceDate = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  return db.serviceLog.findMany({
    where,
    include: {
      worker: { select: { id: true, name: true } },
      timeEntry: {
        select: {
          id: true,
          clockInTime: true,
          clockOutTime: true,
          shift: { select: { title: true } },
        },
      },
    },
    orderBy: { serviceDate: "desc" },
    take: 200,
  });
}

export async function createServiceLog(data: {
  timeEntryId: string;
  serviceDate: string;
  serviceType: string;
  procedureCodes: string[];
  diagnosisCodes: string[];
  units: number;
  notes?: string;
}) {
  const companyId = await getCompanyId();

  // Verify time entry belongs to this company
  const timeEntry = await db.timeEntry.findFirst({
    where: { id: data.timeEntryId, companyId },
    select: { userId: true },
  });
  if (!timeEntry) throw new Error("Time entry not found");

  const log = await db.serviceLog.create({
    data: {
      timeEntryId: data.timeEntryId,
      companyId,
      workerId: timeEntry.userId,
      serviceDate: new Date(data.serviceDate),
      serviceType: data.serviceType,
      procedureCodes: data.procedureCodes,
      diagnosisCodes: data.diagnosisCodes,
      units: data.units,
      notes: data.notes ?? null,
      status: "draft",
    },
  });

  revalidatePath("/company/claims");
  return log;
}

export async function updateServiceLog(
  id: string,
  data: {
    serviceType?: string;
    procedureCodes?: string[];
    diagnosisCodes?: string[];
    units?: number;
    notes?: string;
    status?: string;
  }
) {
  const companyId = await getCompanyId();

  const existing = await db.serviceLog.findFirst({
    where: { id, companyId },
  });
  if (!existing) throw new Error("Service log not found");

  const log = await db.serviceLog.update({
    where: { id },
    data: {
      ...(data.serviceType !== undefined && { serviceType: data.serviceType }),
      ...(data.procedureCodes !== undefined && { procedureCodes: data.procedureCodes }),
      ...(data.diagnosisCodes !== undefined && { diagnosisCodes: data.diagnosisCodes }),
      ...(data.units !== undefined && { units: data.units }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  revalidatePath("/company/claims");
  return log;
}

// ─── CMS-1500 Forms ─────────────────────────────────────────────

export async function getCMS1500Forms(
  companyId: string,
  filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  await requireRole("COMPANY");

  const where: Record<string, unknown> = { companyId };

  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  return db.cMS1500Form.findMany({
    where,
    include: {
      serviceLog: {
        select: { id: true, serviceDate: true, serviceType: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getCMS1500Form(id: string) {
  const companyId = await getCompanyId();

  const form = await db.cMS1500Form.findFirst({
    where: { id, companyId },
    include: {
      serviceLog: {
        include: {
          worker: { select: { name: true } },
          timeEntry: { select: { clockInTime: true, clockOutTime: true } },
        },
      },
    },
  });
  if (!form) throw new Error("CMS-1500 form not found");
  return form;
}

export type CMS1500FormData = {
  serviceLogId?: string;
  insuranceType?: string;
  insuredId?: string;
  patientLastName?: string;
  patientFirstName?: string;
  patientMiddle?: string;
  patientDob?: string;
  patientSex?: string;
  insuredName?: string;
  patientAddress?: string;
  patientCity?: string;
  patientState?: string;
  patientZip?: string;
  patientPhone?: string;
  patientRelationship?: string;
  insuredAddress?: string;
  insuredCity?: string;
  insuredState?: string;
  insuredZip?: string;
  insuredPhone?: string;
  otherInsuredName?: string;
  otherInsuredPolicy?: string;
  groupNumber?: string;
  insuredDob?: string;
  insuredSex?: string;
  insurancePlanName?: string;
  currentIllnessDate?: string;
  referringProviderName?: string;
  referringProviderNpi?: string;
  additionalInfo?: string;
  diagnosisCodes?: string[];
  serviceLines?: {
    dateFrom: string;
    dateTo: string;
    placeOfService: string;
    cpt: string;
    modifier: string;
    diagnosisPointer: string;
    charges: number;
    units: number;
    npi: string;
  }[];
  federalTaxId?: string;
  federalTaxIdType?: string;
  patientAccountNumber?: string;
  acceptAssignment?: boolean;
  totalCharges?: number;
  amountPaid?: number;
  providerSignatureDate?: string;
  facilityName?: string;
  facilityAddress?: string;
  facilityNpi?: string;
  billingProviderName?: string;
  billingProviderAddress?: string;
  billingProviderNpi?: string;
  billingProviderPhone?: string;
  billingProviderTaxId?: string;
  status?: string;
};

function buildCMS1500Data(data: CMS1500FormData) {
  return {
    ...(data.serviceLogId !== undefined && { serviceLogId: data.serviceLogId || null }),
    ...(data.insuranceType !== undefined && { insuranceType: data.insuranceType }),
    ...(data.insuredId !== undefined && { insuredId: data.insuredId }),
    ...(data.patientLastName !== undefined && { patientLastName: data.patientLastName }),
    ...(data.patientFirstName !== undefined && { patientFirstName: data.patientFirstName }),
    ...(data.patientMiddle !== undefined && { patientMiddle: data.patientMiddle }),
    ...(data.patientDob !== undefined && {
      patientDob: data.patientDob ? new Date(data.patientDob) : null,
    }),
    ...(data.patientSex !== undefined && { patientSex: data.patientSex }),
    ...(data.insuredName !== undefined && { insuredName: data.insuredName }),
    ...(data.patientAddress !== undefined && { patientAddress: data.patientAddress }),
    ...(data.patientCity !== undefined && { patientCity: data.patientCity }),
    ...(data.patientState !== undefined && { patientState: data.patientState }),
    ...(data.patientZip !== undefined && { patientZip: data.patientZip }),
    ...(data.patientPhone !== undefined && { patientPhone: data.patientPhone }),
    ...(data.patientRelationship !== undefined && { patientRelationship: data.patientRelationship }),
    ...(data.insuredAddress !== undefined && { insuredAddress: data.insuredAddress }),
    ...(data.insuredCity !== undefined && { insuredCity: data.insuredCity }),
    ...(data.insuredState !== undefined && { insuredState: data.insuredState }),
    ...(data.insuredZip !== undefined && { insuredZip: data.insuredZip }),
    ...(data.insuredPhone !== undefined && { insuredPhone: data.insuredPhone }),
    ...(data.otherInsuredName !== undefined && { otherInsuredName: data.otherInsuredName }),
    ...(data.otherInsuredPolicy !== undefined && { otherInsuredPolicy: data.otherInsuredPolicy }),
    ...(data.groupNumber !== undefined && { groupNumber: data.groupNumber }),
    ...(data.insuredDob !== undefined && {
      insuredDob: data.insuredDob ? new Date(data.insuredDob) : null,
    }),
    ...(data.insuredSex !== undefined && { insuredSex: data.insuredSex }),
    ...(data.insurancePlanName !== undefined && { insurancePlanName: data.insurancePlanName }),
    ...(data.currentIllnessDate !== undefined && {
      currentIllnessDate: data.currentIllnessDate ? new Date(data.currentIllnessDate) : null,
    }),
    ...(data.referringProviderName !== undefined && {
      referringProviderName: data.referringProviderName,
    }),
    ...(data.referringProviderNpi !== undefined && {
      referringProviderNpi: data.referringProviderNpi,
    }),
    ...(data.additionalInfo !== undefined && { additionalInfo: data.additionalInfo }),
    ...(data.diagnosisCodes !== undefined && { diagnosisCodes: data.diagnosisCodes }),
    ...(data.serviceLines !== undefined && { serviceLines: data.serviceLines }),
    ...(data.federalTaxId !== undefined && { federalTaxId: data.federalTaxId }),
    ...(data.federalTaxIdType !== undefined && { federalTaxIdType: data.federalTaxIdType }),
    ...(data.patientAccountNumber !== undefined && {
      patientAccountNumber: data.patientAccountNumber,
    }),
    ...(data.acceptAssignment !== undefined && { acceptAssignment: data.acceptAssignment }),
    ...(data.totalCharges !== undefined && { totalCharges: data.totalCharges }),
    ...(data.amountPaid !== undefined && { amountPaid: data.amountPaid }),
    ...(data.providerSignatureDate !== undefined && {
      providerSignatureDate: data.providerSignatureDate
        ? new Date(data.providerSignatureDate)
        : null,
    }),
    ...(data.facilityName !== undefined && { facilityName: data.facilityName }),
    ...(data.facilityAddress !== undefined && { facilityAddress: data.facilityAddress }),
    ...(data.facilityNpi !== undefined && { facilityNpi: data.facilityNpi }),
    ...(data.billingProviderName !== undefined && {
      billingProviderName: data.billingProviderName,
    }),
    ...(data.billingProviderAddress !== undefined && {
      billingProviderAddress: data.billingProviderAddress,
    }),
    ...(data.billingProviderNpi !== undefined && { billingProviderNpi: data.billingProviderNpi }),
    ...(data.billingProviderPhone !== undefined && {
      billingProviderPhone: data.billingProviderPhone,
    }),
    ...(data.billingProviderTaxId !== undefined && {
      billingProviderTaxId: data.billingProviderTaxId,
    }),
    ...(data.status !== undefined && { status: data.status }),
  };
}

export async function createCMS1500Form(companyId: string, data: CMS1500FormData) {
  await requireRole("COMPANY");

  // Verify company ownership
  const actualCompanyId = await getCompanyId();
  if (actualCompanyId !== companyId) throw new Error("Unauthorized");

  const form = await db.cMS1500Form.create({
    data: {
      companyId,
      ...buildCMS1500Data(data),
    },
  });

  revalidatePath("/company/claims");
  return form;
}

export async function updateCMS1500Form(id: string, data: CMS1500FormData) {
  const companyId = await getCompanyId();

  const existing = await db.cMS1500Form.findFirst({
    where: { id, companyId },
  });
  if (!existing) throw new Error("CMS-1500 form not found");

  const form = await db.cMS1500Form.update({
    where: { id },
    data: buildCMS1500Data(data),
  });

  revalidatePath("/company/claims");
  return form;
}

export async function deleteCMS1500Form(id: string) {
  const companyId = await getCompanyId();

  const existing = await db.cMS1500Form.findFirst({
    where: { id, companyId },
  });
  if (!existing) throw new Error("CMS-1500 form not found");
  if (existing.status !== "draft") throw new Error("Only draft forms can be deleted");

  await db.cMS1500Form.delete({ where: { id } });

  revalidatePath("/company/claims");
  return { success: true };
}

export async function exportCMS1500ToPDF(id: string): Promise<string> {
  const companyId = await getCompanyId();

  const form = await db.cMS1500Form.findFirst({
    where: { id, companyId },
  });
  if (!form) throw new Error("CMS-1500 form not found");

  // Parse service lines
  const serviceLines = (form.serviceLines as Array<{
    dateFrom: string;
    dateTo: string;
    placeOfService: string;
    cpt: string;
    modifier: string;
    diagnosisPointer: string;
    charges: number;
    units: number;
    npi: string;
  }>) ?? [];

  const formatDate = (d: Date | null) =>
    d ? d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "";

  const totalCharges =
    form.totalCharges != null ? parseFloat(String(form.totalCharges)).toFixed(2) : "0.00";
  const amountPaid =
    form.amountPaid != null ? parseFloat(String(form.amountPaid)).toFixed(2) : "0.00";

  const diagnosisLabels = "ABCDEFGHIJKL".split("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>CMS-1500 Claim Form</title>
<style>
  @page { size: letter; margin: 0.5in; }
  body { font-family: "Courier New", monospace; font-size: 10px; margin: 0; padding: 20px; color: #000; }
  .form-container { max-width: 8in; margin: 0 auto; border: 2px solid #c00; padding: 8px; }
  .form-title { text-align: center; font-size: 14px; font-weight: bold; color: #c00; border-bottom: 2px solid #c00; padding-bottom: 4px; margin-bottom: 8px; }
  .row { display: flex; border-bottom: 1px solid #c00; }
  .cell { border-right: 1px solid #c00; padding: 2px 4px; min-height: 20px; flex-shrink: 0; }
  .cell:last-child { border-right: none; }
  .cell-label { font-size: 7px; color: #c00; text-transform: uppercase; display: block; }
  .cell-value { font-size: 10px; font-family: "Courier New", monospace; }
  .w-full { flex: 1; }
  .w-half { width: 50%; }
  .w-third { width: 33.33%; }
  .w-quarter { width: 25%; }
  .service-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  .service-table th, .service-table td { border: 1px solid #c00; padding: 2px 3px; font-size: 8px; text-align: left; }
  .service-table th { background: #fef2f2; font-size: 7px; color: #c00; }
  .section-label { background: #fef2f2; color: #c00; font-size: 8px; font-weight: bold; padding: 2px 4px; border-bottom: 1px solid #c00; }
  @media print { body { padding: 0; } .form-container { border: 2px solid #c00; } }
</style>
</head>
<body>
<div class="form-container">
  <div class="form-title">HEALTH INSURANCE CLAIM FORM (CMS-1500)</div>

  <!-- Box 1 & 1a -->
  <div class="row">
    <div class="cell w-half">
      <span class="cell-label">1. Insurance Type</span>
      <span class="cell-value">${form.insuranceType?.toUpperCase() ?? ""}</span>
    </div>
    <div class="cell w-half">
      <span class="cell-label">1a. Insured's I.D. Number</span>
      <span class="cell-value">${form.insuredId ?? ""}</span>
    </div>
  </div>

  <!-- Box 2 & 3 -->
  <div class="row">
    <div class="cell w-half">
      <span class="cell-label">2. Patient's Name (Last, First, Middle)</span>
      <span class="cell-value">${form.patientLastName ?? ""}, ${form.patientFirstName ?? ""} ${form.patientMiddle ?? ""}</span>
    </div>
    <div class="cell w-quarter">
      <span class="cell-label">3. Patient's Birth Date</span>
      <span class="cell-value">${formatDate(form.patientDob)}</span>
    </div>
    <div class="cell w-quarter">
      <span class="cell-label">Sex</span>
      <span class="cell-value">${form.patientSex?.toUpperCase() ?? ""}</span>
    </div>
  </div>

  <!-- Box 4 -->
  <div class="row">
    <div class="cell w-half">
      <span class="cell-label">4. Insured's Name</span>
      <span class="cell-value">${form.insuredName ?? ""}</span>
    </div>
    <div class="cell w-half">
      <span class="cell-label">6. Patient Relationship to Insured</span>
      <span class="cell-value">${form.patientRelationship?.toUpperCase() ?? ""}</span>
    </div>
  </div>

  <!-- Box 5 - Patient Address -->
  <div class="row">
    <div class="cell w-half">
      <span class="cell-label">5. Patient's Address</span>
      <span class="cell-value">${form.patientAddress ?? ""}</span>
      <span class="cell-value">${form.patientCity ?? ""}, ${form.patientState ?? ""} ${form.patientZip ?? ""}</span>
      <span class="cell-value">Phone: ${form.patientPhone ?? ""}</span>
    </div>
    <div class="cell w-half">
      <span class="cell-label">7. Insured's Address</span>
      <span class="cell-value">${form.insuredAddress ?? ""}</span>
      <span class="cell-value">${form.insuredCity ?? ""}, ${form.insuredState ?? ""} ${form.insuredZip ?? ""}</span>
      <span class="cell-value">Phone: ${form.insuredPhone ?? ""}</span>
    </div>
  </div>

  <!-- Box 9, 11 -->
  <div class="row">
    <div class="cell w-half">
      <span class="cell-label">9. Other Insured's Name</span>
      <span class="cell-value">${form.otherInsuredName ?? ""}</span>
      <span class="cell-label">Policy/Group Number</span>
      <span class="cell-value">${form.otherInsuredPolicy ?? ""}</span>
    </div>
    <div class="cell w-half">
      <span class="cell-label">11. Insured's Group Number</span>
      <span class="cell-value">${form.groupNumber ?? ""}</span>
      <span class="cell-label">11a. Insured's DOB / Sex</span>
      <span class="cell-value">${formatDate(form.insuredDob)} ${form.insuredSex?.toUpperCase() ?? ""}</span>
      <span class="cell-label">11c. Insurance Plan Name</span>
      <span class="cell-value">${form.insurancePlanName ?? ""}</span>
    </div>
  </div>

  <!-- Box 14, 17, 19 -->
  <div class="row">
    <div class="cell w-third">
      <span class="cell-label">14. Date of Current Illness</span>
      <span class="cell-value">${formatDate(form.currentIllnessDate)}</span>
    </div>
    <div class="cell w-third">
      <span class="cell-label">17. Referring Provider</span>
      <span class="cell-value">${form.referringProviderName ?? ""}</span>
      <span class="cell-value">NPI: ${form.referringProviderNpi ?? ""}</span>
    </div>
    <div class="cell w-third">
      <span class="cell-label">19. Additional Claim Info</span>
      <span class="cell-value">${form.additionalInfo ?? ""}</span>
    </div>
  </div>

  <!-- Box 21 - Diagnosis -->
  <div class="section-label">21. DIAGNOSIS OR NATURE OF ILLNESS OR INJURY (ICD-10)</div>
  <div class="row" style="flex-wrap:wrap;">
    ${(form.diagnosisCodes ?? [])
      .map(
        (code: string, i: number) =>
          `<div class="cell w-quarter"><span class="cell-label">${diagnosisLabels[i] ?? ""}</span><span class="cell-value">${code}</span></div>`
      )
      .join("")}
  </div>

  <!-- Box 24 - Service Lines -->
  <div class="section-label">24. SERVICE LINES</div>
  <table class="service-table">
    <thead>
      <tr>
        <th>Date From</th><th>Date To</th><th>POS</th><th>CPT/HCPCS</th><th>Modifier</th><th>Dx Ptr</th><th>Charges</th><th>Units</th><th>NPI</th>
      </tr>
    </thead>
    <tbody>
      ${serviceLines
        .map(
          (line) =>
            `<tr><td>${line.dateFrom}</td><td>${line.dateTo}</td><td>${line.placeOfService}</td><td>${line.cpt}</td><td>${line.modifier}</td><td>${line.diagnosisPointer}</td><td>$${parseFloat(String(line.charges)).toFixed(2)}</td><td>${line.units}</td><td>${line.npi}</td></tr>`
        )
        .join("")}
    </tbody>
  </table>

  <!-- Box 25-28 -->
  <div class="row">
    <div class="cell w-quarter">
      <span class="cell-label">25. Federal Tax I.D. (${form.federalTaxIdType ?? "EIN"})</span>
      <span class="cell-value">${form.federalTaxId ?? ""}</span>
    </div>
    <div class="cell w-quarter">
      <span class="cell-label">26. Patient's Account No.</span>
      <span class="cell-value">${form.patientAccountNumber ?? ""}</span>
    </div>
    <div class="cell w-quarter">
      <span class="cell-label">27. Accept Assignment</span>
      <span class="cell-value">${form.acceptAssignment ? "YES" : "NO"}</span>
    </div>
    <div class="cell w-quarter">
      <span class="cell-label">28. Total Charge</span>
      <span class="cell-value">$ ${totalCharges}</span>
    </div>
  </div>

  <!-- Box 29, 31 -->
  <div class="row">
    <div class="cell w-third">
      <span class="cell-label">29. Amount Paid</span>
      <span class="cell-value">$ ${amountPaid}</span>
    </div>
    <div class="cell w-third">
      <span class="cell-label">31. Signature of Physician / Date</span>
      <span class="cell-value">${formatDate(form.providerSignatureDate)}</span>
    </div>
    <div class="cell w-third">&nbsp;</div>
  </div>

  <!-- Box 32 -->
  <div class="row">
    <div class="cell w-full">
      <span class="cell-label">32. Service Facility Location</span>
      <span class="cell-value">${form.facilityName ?? ""} | ${form.facilityAddress ?? ""} | NPI: ${form.facilityNpi ?? ""}</span>
    </div>
  </div>

  <!-- Box 33 -->
  <div class="row" style="border-bottom:none;">
    <div class="cell w-full">
      <span class="cell-label">33. Billing Provider Info & Ph #</span>
      <span class="cell-value">${form.billingProviderName ?? ""} | ${form.billingProviderAddress ?? ""}</span>
      <span class="cell-value">NPI: ${form.billingProviderNpi ?? ""} | Phone: ${form.billingProviderPhone ?? ""} | Tax ID: ${form.billingProviderTaxId ?? ""}</span>
    </div>
  </div>
</div>
</body>
</html>`;

  // Mark as exported
  await db.cMS1500Form.update({
    where: { id },
    data: { status: "exported" },
  });

  revalidatePath("/company/claims");
  return html;
}
