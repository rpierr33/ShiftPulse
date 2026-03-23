import { requireRole } from "@/lib/auth-utils";
import { getCompanyForUser } from "@/actions/company";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { getCMS1500Form } from "@/actions/claims";
import { CMS1500FormEditor } from "@/components/company/cms-1500-form";
import { CMS1500PDF } from "@/components/company/cms-1500-pdf";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function EditCMS1500Page({ params, searchParams }: PageProps) {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/login");

  const { id } = await params;
  const { view } = await searchParams;

  let form;
  try {
    form = await getCMS1500Form(id);
  } catch {
    redirect("/company/claims");
  }

  // Serialize for client component
  const serializedForm = {
    id: form.id,
    insuranceType: form.insuranceType,
    insuredId: form.insuredId,
    patientLastName: form.patientLastName,
    patientFirstName: form.patientFirstName,
    patientMiddle: form.patientMiddle,
    patientDob: form.patientDob?.toISOString() ?? null,
    patientSex: form.patientSex,
    insuredName: form.insuredName,
    patientAddress: form.patientAddress,
    patientCity: form.patientCity,
    patientState: form.patientState,
    patientZip: form.patientZip,
    patientPhone: form.patientPhone,
    patientRelationship: form.patientRelationship,
    insuredAddress: form.insuredAddress,
    insuredCity: form.insuredCity,
    insuredState: form.insuredState,
    insuredZip: form.insuredZip,
    insuredPhone: form.insuredPhone,
    otherInsuredName: form.otherInsuredName,
    otherInsuredPolicy: form.otherInsuredPolicy,
    groupNumber: form.groupNumber,
    insuredDob: form.insuredDob?.toISOString() ?? null,
    insuredSex: form.insuredSex,
    insurancePlanName: form.insurancePlanName,
    currentIllnessDate: form.currentIllnessDate?.toISOString() ?? null,
    referringProviderName: form.referringProviderName,
    referringProviderNpi: form.referringProviderNpi,
    additionalInfo: form.additionalInfo,
    diagnosisCodes: form.diagnosisCodes,
    serviceLines: form.serviceLines,
    federalTaxId: form.federalTaxId,
    federalTaxIdType: form.federalTaxIdType,
    patientAccountNumber: form.patientAccountNumber,
    acceptAssignment: form.acceptAssignment,
    totalCharges: form.totalCharges,
    amountPaid: form.amountPaid,
    providerSignatureDate: form.providerSignatureDate?.toISOString() ?? null,
    facilityName: form.facilityName,
    facilityAddress: form.facilityAddress,
    facilityNpi: form.facilityNpi,
    billingProviderName: form.billingProviderName,
    billingProviderAddress: form.billingProviderAddress,
    billingProviderNpi: form.billingProviderNpi,
    billingProviderPhone: form.billingProviderPhone,
    billingProviderTaxId: form.billingProviderTaxId,
    status: form.status,
  };

  if (view === "pdf") {
    return (
      <div>
        <TopBar title="CMS-1500 Preview" subtitle="Printable claim form" />
        <div className="p-4 lg:p-6">
          <CMS1500PDF form={serializedForm} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Edit CMS-1500 Form" subtitle={`Form #${form.id.slice(-6).toUpperCase()}`} />
      <div className="p-4 lg:p-6">
        <CMS1500FormEditor companyId={company.id} initialData={serializedForm} />
      </div>
    </div>
  );
}
