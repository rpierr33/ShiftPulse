"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PLACE_OF_SERVICE_CODES } from "@/types";
import {
  createCMS1500Form,
  updateCMS1500Form,
  exportCMS1500ToPDF,
  type CMS1500FormData,
} from "@/actions/claims";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  FileDown,
  ArrowLeft,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

type ServiceLine = {
  dateFrom: string;
  dateTo: string;
  placeOfService: string;
  cpt: string;
  modifier: string;
  diagnosisPointer: string;
  charges: number;
  units: number;
  npi: string;
};

const EMPTY_SERVICE_LINE: ServiceLine = {
  dateFrom: "",
  dateTo: "",
  placeOfService: "12",
  cpt: "",
  modifier: "",
  diagnosisPointer: "",
  charges: 0,
  units: 1,
  npi: "",
};

const INSURANCE_TYPES = [
  { value: "medicare", label: "Medicare" },
  { value: "medicaid", label: "Medicaid" },
  { value: "tricare", label: "Tricare" },
  { value: "champva", label: "CHAMPVA" },
  { value: "group", label: "Group Health Plan" },
  { value: "feca", label: "FECA BLK Lung" },
  { value: "other", label: "Other" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "self", label: "Self" },
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "other", label: "Other" },
];

const SEX_OPTIONS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

const TAX_ID_TYPE_OPTIONS = [
  { value: "EIN", label: "EIN" },
  { value: "SSN", label: "SSN" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
].map((s) => ({ value: s, label: s }));

const POS_OPTIONS = PLACE_OF_SERVICE_CODES.map((p) => ({
  value: p.code,
  label: `${p.code} - ${p.label}`,
}));

const DIAG_LABELS = "ABCDEFGHIJKL".split("");

// ─── Props ──────────────────────────────────────────────────────

interface CMS1500FormProps {
  companyId: string;
  initialData?: {
    id: string;
    [key: string]: unknown;
  };
}

// ─── Section wrapper ────────────────────────────────────────────

function Section({
  title,
  boxLabel,
  children,
  defaultOpen = true,
}: {
  title: string;
  boxLabel: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          <span className="text-xs text-gray-500">({boxLabel})</span>
        </div>
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function CMS1500FormEditor({ companyId, initialData }: CMS1500FormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isEditing = Boolean(initialData?.id);

  // Form state
  const [insuranceType, setInsuranceType] = useState((initialData?.insuranceType as string) ?? "");
  const [insuredId, setInsuredId] = useState((initialData?.insuredId as string) ?? "");

  // Patient
  const [patientLastName, setPatientLastName] = useState((initialData?.patientLastName as string) ?? "");
  const [patientFirstName, setPatientFirstName] = useState((initialData?.patientFirstName as string) ?? "");
  const [patientMiddle, setPatientMiddle] = useState((initialData?.patientMiddle as string) ?? "");
  const [patientDob, setPatientDob] = useState(
    initialData?.patientDob ? new Date(initialData.patientDob as string).toISOString().split("T")[0] : ""
  );
  const [patientSex, setPatientSex] = useState((initialData?.patientSex as string) ?? "");
  const [patientAddress, setPatientAddress] = useState((initialData?.patientAddress as string) ?? "");
  const [patientCity, setPatientCity] = useState((initialData?.patientCity as string) ?? "");
  const [patientState, setPatientState] = useState((initialData?.patientState as string) ?? "");
  const [patientZip, setPatientZip] = useState((initialData?.patientZip as string) ?? "");
  const [patientPhone, setPatientPhone] = useState((initialData?.patientPhone as string) ?? "");
  const [patientRelationship, setPatientRelationship] = useState((initialData?.patientRelationship as string) ?? "");

  // Insured
  const [insuredName, setInsuredName] = useState((initialData?.insuredName as string) ?? "");
  const [insuredAddress, setInsuredAddress] = useState((initialData?.insuredAddress as string) ?? "");
  const [insuredCity, setInsuredCity] = useState((initialData?.insuredCity as string) ?? "");
  const [insuredState, setInsuredState] = useState((initialData?.insuredState as string) ?? "");
  const [insuredZip, setInsuredZip] = useState((initialData?.insuredZip as string) ?? "");
  const [insuredPhone, setInsuredPhone] = useState((initialData?.insuredPhone as string) ?? "");
  const [insuredDob, setInsuredDob] = useState(
    initialData?.insuredDob ? new Date(initialData.insuredDob as string).toISOString().split("T")[0] : ""
  );
  const [insuredSex, setInsuredSex] = useState((initialData?.insuredSex as string) ?? "");

  // Other insured / Group
  const [otherInsuredName, setOtherInsuredName] = useState((initialData?.otherInsuredName as string) ?? "");
  const [otherInsuredPolicy, setOtherInsuredPolicy] = useState((initialData?.otherInsuredPolicy as string) ?? "");
  const [groupNumber, setGroupNumber] = useState((initialData?.groupNumber as string) ?? "");
  const [insurancePlanName, setInsurancePlanName] = useState((initialData?.insurancePlanName as string) ?? "");

  // Clinical
  const [currentIllnessDate, setCurrentIllnessDate] = useState(
    initialData?.currentIllnessDate
      ? new Date(initialData.currentIllnessDate as string).toISOString().split("T")[0]
      : ""
  );
  const [referringProviderName, setReferringProviderName] = useState((initialData?.referringProviderName as string) ?? "");
  const [referringProviderNpi, setReferringProviderNpi] = useState((initialData?.referringProviderNpi as string) ?? "");
  const [additionalInfo, setAdditionalInfo] = useState((initialData?.additionalInfo as string) ?? "");

  // Diagnosis codes (up to 12)
  const [diagnosisCodes, setDiagnosisCodes] = useState<string[]>(
    (initialData?.diagnosisCodes as string[]) ?? [""]
  );

  // Service lines
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>(
    (initialData?.serviceLines as ServiceLine[]) ?? [{ ...EMPTY_SERVICE_LINE }]
  );

  // Billing
  const [federalTaxId, setFederalTaxId] = useState((initialData?.federalTaxId as string) ?? "");
  const [federalTaxIdType, setFederalTaxIdType] = useState((initialData?.federalTaxIdType as string) ?? "EIN");
  const [patientAccountNumber, setPatientAccountNumber] = useState((initialData?.patientAccountNumber as string) ?? "");
  const [acceptAssignment, setAcceptAssignment] = useState(
    initialData?.acceptAssignment !== undefined ? Boolean(initialData.acceptAssignment) : true
  );
  const [amountPaid, setAmountPaid] = useState(
    initialData?.amountPaid != null ? parseFloat(String(initialData.amountPaid)) : 0
  );
  const [providerSignatureDate, setProviderSignatureDate] = useState(
    initialData?.providerSignatureDate
      ? new Date(initialData.providerSignatureDate as string).toISOString().split("T")[0]
      : ""
  );
  const [facilityName, setFacilityName] = useState((initialData?.facilityName as string) ?? "");
  const [facilityAddress, setFacilityAddress] = useState((initialData?.facilityAddress as string) ?? "");
  const [facilityNpi, setFacilityNpi] = useState((initialData?.facilityNpi as string) ?? "");
  const [billingProviderName, setBillingProviderName] = useState((initialData?.billingProviderName as string) ?? "");
  const [billingProviderAddress, setBillingProviderAddress] = useState((initialData?.billingProviderAddress as string) ?? "");
  const [billingProviderNpi, setBillingProviderNpi] = useState((initialData?.billingProviderNpi as string) ?? "");
  const [billingProviderPhone, setBillingProviderPhone] = useState((initialData?.billingProviderPhone as string) ?? "");
  const [billingProviderTaxId, setBillingProviderTaxId] = useState((initialData?.billingProviderTaxId as string) ?? "");

  // ─── Computed ───────────────────────────────────────────────

  const totalCharges = serviceLines.reduce(
    (sum, line) => sum + parseFloat(String(line.charges || 0)),
    0
  );

  // ─── Service line helpers ───────────────────────────────────

  const addServiceLine = useCallback(() => {
    setServiceLines((prev) => [...prev, { ...EMPTY_SERVICE_LINE }]);
  }, []);

  const removeServiceLine = useCallback((index: number) => {
    setServiceLines((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateServiceLine = useCallback(
    (index: number, field: keyof ServiceLine, value: string | number) => {
      setServiceLines((prev) =>
        prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
      );
    },
    []
  );

  // ─── Diagnosis helpers ──────────────────────────────────────

  function addDiagnosisCode() {
    if (diagnosisCodes.length >= 12) return;
    setDiagnosisCodes((prev) => [...prev, ""]);
  }

  function removeDiagnosisCode(index: number) {
    setDiagnosisCodes((prev) => prev.filter((_, i) => i !== index));
  }

  function updateDiagnosisCode(index: number, value: string) {
    setDiagnosisCodes((prev) => prev.map((c, i) => (i === index ? value : c)));
  }

  // ─── Build form data ───────────────────────────────────────

  function buildFormData(): CMS1500FormData {
    return {
      insuranceType,
      insuredId,
      patientLastName,
      patientFirstName,
      patientMiddle,
      patientDob: patientDob || undefined,
      patientSex,
      insuredName,
      patientAddress,
      patientCity,
      patientState,
      patientZip,
      patientPhone,
      patientRelationship,
      insuredAddress,
      insuredCity,
      insuredState,
      insuredZip,
      insuredPhone,
      otherInsuredName,
      otherInsuredPolicy,
      groupNumber,
      insuredDob: insuredDob || undefined,
      insuredSex,
      insurancePlanName,
      currentIllnessDate: currentIllnessDate || undefined,
      referringProviderName,
      referringProviderNpi,
      additionalInfo,
      diagnosisCodes: diagnosisCodes.filter(Boolean),
      serviceLines: serviceLines.filter((l) => l.cpt),
      federalTaxId,
      federalTaxIdType,
      patientAccountNumber,
      acceptAssignment,
      totalCharges,
      amountPaid,
      providerSignatureDate: providerSignatureDate || undefined,
      facilityName,
      facilityAddress,
      facilityNpi,
      billingProviderName,
      billingProviderAddress,
      billingProviderNpi,
      billingProviderPhone,
      billingProviderTaxId,
    };
  }

  // ─── Actions ────────────────────────────────────────────────

  function handleSaveDraft() {
    setError("");
    setSuccessMsg("");
    startTransition(async () => {
      try {
        const formData = { ...buildFormData(), status: "draft" };
        if (isEditing && initialData?.id) {
          await updateCMS1500Form(initialData.id, formData);
        } else {
          await createCMS1500Form(companyId, formData);
        }
        setSuccessMsg("Draft saved successfully");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  function handleMarkCompleted() {
    setError("");
    setSuccessMsg("");
    startTransition(async () => {
      try {
        const formData = { ...buildFormData(), status: "completed" };
        if (isEditing && initialData?.id) {
          await updateCMS1500Form(initialData.id, formData);
        } else {
          await createCMS1500Form(companyId, formData);
        }
        setSuccessMsg("Form marked as completed");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  function handleExportPDF() {
    if (!isEditing || !initialData?.id) {
      setError("Please save the form first before exporting");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        const html = await exportCMS1500ToPDF(initialData.id);
        // Open in new window for printing
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(html);
          win.document.close();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to export");
      }
    });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/company/claims")}>
            <ArrowLeft size={16} />
            Back
          </Button>
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Edit CMS-1500 Form" : "New CMS-1500 Form"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft} loading={isPending}>
            <Save size={16} />
            Save Draft
          </Button>
          <Button variant="success" onClick={handleMarkCompleted} loading={isPending}>
            <CheckCircle2 size={16} />
            Complete
          </Button>
          {isEditing && (
            <Button variant="secondary" onClick={handleExportPDF} loading={isPending}>
              <FileDown size={16} />
              Export PDF
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</div>
      )}
      {successMsg && (
        <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm p-3">{successMsg}</div>
      )}

      {/* Section 1: Insurance Information (Boxes 1, 1a, 9, 11) */}
      <Section title="Insurance Information" boxLabel="Boxes 1, 1a, 9, 11, 11c">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="1. Insurance Type"
            options={INSURANCE_TYPES}
            placeholder="Select insurance type..."
            value={insuranceType}
            onChange={(e) => setInsuranceType(e.target.value)}
          />
          <Input
            label="1a. Insured's I.D. Number"
            value={insuredId}
            onChange={(e) => setInsuredId(e.target.value)}
            placeholder="Insurance ID"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="9. Other Insured's Name"
            value={otherInsuredName}
            onChange={(e) => setOtherInsuredName(e.target.value)}
            placeholder="Last, First, Middle"
          />
          <Input
            label="9a. Other Insured's Policy/Group Number"
            value={otherInsuredPolicy}
            onChange={(e) => setOtherInsuredPolicy(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="11. Insured's Group Number"
            value={groupNumber}
            onChange={(e) => setGroupNumber(e.target.value)}
          />
          <Input
            label="11c. Insurance Plan Name"
            value={insurancePlanName}
            onChange={(e) => setInsurancePlanName(e.target.value)}
          />
        </div>
      </Section>

      {/* Section 2: Patient Information (Boxes 2, 3, 5, 6) */}
      <Section title="Patient Information" boxLabel="Boxes 2, 3, 5, 6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="2. Patient Last Name"
            value={patientLastName}
            onChange={(e) => setPatientLastName(e.target.value)}
          />
          <Input
            label="First Name"
            value={patientFirstName}
            onChange={(e) => setPatientFirstName(e.target.value)}
          />
          <Input
            label="Middle"
            value={patientMiddle}
            onChange={(e) => setPatientMiddle(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="3. Patient Date of Birth"
            type="date"
            value={patientDob}
            onChange={(e) => setPatientDob(e.target.value)}
          />
          <Select
            label="Sex"
            options={SEX_OPTIONS}
            placeholder="Select..."
            value={patientSex}
            onChange={(e) => setPatientSex(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="5. Patient Address"
            value={patientAddress}
            onChange={(e) => setPatientAddress(e.target.value)}
          />
          <Input
            label="City"
            value={patientCity}
            onChange={(e) => setPatientCity(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="State"
            options={US_STATES}
            placeholder="Select..."
            value={patientState}
            onChange={(e) => setPatientState(e.target.value)}
          />
          <Input
            label="ZIP Code"
            value={patientZip}
            onChange={(e) => setPatientZip(e.target.value)}
          />
          <Input
            label="Phone"
            type="tel"
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
          />
        </div>
        <Select
          label="6. Patient Relationship to Insured"
          options={RELATIONSHIP_OPTIONS}
          placeholder="Select..."
          value={patientRelationship}
          onChange={(e) => setPatientRelationship(e.target.value)}
        />
      </Section>

      {/* Section 3: Insured Information (Boxes 4, 7, 11a) */}
      <Section title="Insured Information" boxLabel="Boxes 4, 7, 11a">
        <Input
          label="4. Insured's Name"
          value={insuredName}
          onChange={(e) => setInsuredName(e.target.value)}
          placeholder="Last, First, Middle"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="7. Insured's Address"
            value={insuredAddress}
            onChange={(e) => setInsuredAddress(e.target.value)}
          />
          <Input
            label="City"
            value={insuredCity}
            onChange={(e) => setInsuredCity(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="State"
            options={US_STATES}
            placeholder="Select..."
            value={insuredState}
            onChange={(e) => setInsuredState(e.target.value)}
          />
          <Input
            label="ZIP Code"
            value={insuredZip}
            onChange={(e) => setInsuredZip(e.target.value)}
          />
          <Input
            label="Phone"
            type="tel"
            value={insuredPhone}
            onChange={(e) => setInsuredPhone(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="11a. Insured's Date of Birth"
            type="date"
            value={insuredDob}
            onChange={(e) => setInsuredDob(e.target.value)}
          />
          <Select
            label="Sex"
            options={SEX_OPTIONS}
            placeholder="Select..."
            value={insuredSex}
            onChange={(e) => setInsuredSex(e.target.value)}
          />
        </div>
      </Section>

      {/* Section 4: Clinical Information (Boxes 14, 17, 19, 21) */}
      <Section title="Clinical Information" boxLabel="Boxes 14, 17, 19, 21">
        <Input
          label="14. Date of Current Illness/Injury/Pregnancy"
          type="date"
          value={currentIllnessDate}
          onChange={(e) => setCurrentIllnessDate(e.target.value)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="17. Referring Provider Name"
            value={referringProviderName}
            onChange={(e) => setReferringProviderName(e.target.value)}
          />
          <Input
            label="17b. Referring Provider NPI"
            value={referringProviderNpi}
            onChange={(e) => setReferringProviderNpi(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            19. Additional Claim Information
          </label>
          <textarea
            className="flex w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors min-h-[60px] resize-y"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
          />
        </div>

        {/* Box 21 - Diagnosis Codes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              21. Diagnosis Codes (ICD-10) - up to 12
            </label>
            {diagnosisCodes.length < 12 && (
              <Button type="button" variant="ghost" size="sm" onClick={addDiagnosisCode}>
                <Plus size={14} />
                Add
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {diagnosisCodes.map((code, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 w-4">{DIAG_LABELS[i]}</span>
                <Input
                  value={code}
                  onChange={(e) => updateDiagnosisCode(i, e.target.value.toUpperCase())}
                  placeholder="e.g. Z00.00"
                  className="flex-1"
                />
                {diagnosisCodes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDiagnosisCode(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Section 5: Service Lines (Box 24) */}
      <Section title="Service Lines" boxLabel="Box 24">
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2 text-xs font-medium text-gray-600">Date From</th>
                <th className="text-left p-2 text-xs font-medium text-gray-600">Date To</th>
                <th className="text-left p-2 text-xs font-medium text-gray-600">POS</th>
                <th className="text-left p-2 text-xs font-medium text-gray-600">CPT/HCPCS</th>
                <th className="text-left p-2 text-xs font-medium text-gray-600">Modifier</th>
                <th className="text-left p-2 text-xs font-medium text-gray-600">Dx Pointer</th>
                <th className="text-left p-2 text-xs font-medium text-gray-600">$ Charges</th>
                <th className="text-left p-2 text-xs font-medium text-gray-600">Units</th>
                <th className="text-left p-2 text-xs font-medium text-gray-600">NPI</th>
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {serviceLines.map((line, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="p-1">
                    <input
                      type="date"
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={line.dateFrom}
                      onChange={(e) => updateServiceLine(i, "dateFrom", e.target.value)}
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="date"
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={line.dateTo}
                      onChange={(e) => updateServiceLine(i, "dateTo", e.target.value)}
                    />
                  </td>
                  <td className="p-1">
                    <select
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={line.placeOfService}
                      onChange={(e) => updateServiceLine(i, "placeOfService", e.target.value)}
                    >
                      {POS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.value}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1">
                    <input
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={line.cpt}
                      onChange={(e) => updateServiceLine(i, "cpt", e.target.value)}
                      placeholder="99213"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-16"
                      value={line.modifier}
                      onChange={(e) => updateServiceLine(i, "modifier", e.target.value)}
                    />
                  </td>
                  <td className="p-1">
                    <input
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-16"
                      value={line.diagnosisPointer}
                      onChange={(e) => updateServiceLine(i, "diagnosisPointer", e.target.value.toUpperCase())}
                      placeholder="A"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-20"
                      value={line.charges || ""}
                      onChange={(e) =>
                        updateServiceLine(i, "charges", parseFloat(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-16"
                      value={line.units || ""}
                      onChange={(e) =>
                        updateServiceLine(i, "units", parseFloat(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td className="p-1">
                    <input
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={line.npi}
                      onChange={(e) => updateServiceLine(i, "npi", e.target.value)}
                      placeholder="NPI"
                    />
                  </td>
                  <td className="p-1">
                    {serviceLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeServiceLine(i)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="outline" size="sm" onClick={addServiceLine}>
            <Plus size={14} />
            Add Service Line
          </Button>
          <div className="text-sm font-semibold text-gray-900">
            Total Charges: ${totalCharges.toFixed(2)}
          </div>
        </div>
      </Section>

      {/* Section 6: Billing Information (Boxes 25-33) */}
      <Section title="Billing Information" boxLabel="Boxes 25-33">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="25. Federal Tax I.D. Number"
            value={federalTaxId}
            onChange={(e) => setFederalTaxId(e.target.value)}
          />
          <Select
            label="Tax ID Type"
            options={TAX_ID_TYPE_OPTIONS}
            value={federalTaxIdType}
            onChange={(e) => setFederalTaxIdType(e.target.value)}
          />
          <Input
            label="26. Patient's Account No."
            value={patientAccountNumber}
            onChange={(e) => setPatientAccountNumber(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptAssignment}
              onChange={(e) => setAcceptAssignment(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            27. Accept Assignment
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              28. Total Charges
            </label>
            <div className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold">
              ${totalCharges.toFixed(2)}
            </div>
          </div>
          <Input
            label="29. Amount Paid"
            type="number"
            step="0.01"
            min="0"
            value={amountPaid || ""}
            onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
          />
          <Input
            label="31. Provider Signature Date"
            type="date"
            value={providerSignatureDate}
            onChange={(e) => setProviderSignatureDate(e.target.value)}
          />
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">32. Service Facility Location</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Facility Name"
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
            />
            <Input
              label="Facility Address"
              value={facilityAddress}
              onChange={(e) => setFacilityAddress(e.target.value)}
            />
            <Input
              label="Facility NPI"
              value={facilityNpi}
              onChange={(e) => setFacilityNpi(e.target.value)}
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">33. Billing Provider</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Billing Provider Name"
              value={billingProviderName}
              onChange={(e) => setBillingProviderName(e.target.value)}
            />
            <Input
              label="Address"
              value={billingProviderAddress}
              onChange={(e) => setBillingProviderAddress(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Input
              label="NPI"
              value={billingProviderNpi}
              onChange={(e) => setBillingProviderNpi(e.target.value)}
            />
            <Input
              label="Phone"
              type="tel"
              value={billingProviderPhone}
              onChange={(e) => setBillingProviderPhone(e.target.value)}
            />
            <Input
              label="Tax ID"
              value={billingProviderTaxId}
              onChange={(e) => setBillingProviderTaxId(e.target.value)}
            />
          </div>
        </div>
      </Section>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between py-4 border-t border-gray-200">
        <Button variant="ghost" onClick={() => router.push("/company/claims")}>
          <ArrowLeft size={16} />
          Back to Claims
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft} loading={isPending}>
            <Save size={16} />
            Save Draft
          </Button>
          <Button variant="success" onClick={handleMarkCompleted} loading={isPending}>
            <CheckCircle2 size={16} />
            Mark as Completed
          </Button>
          {isEditing && (
            <Button variant="secondary" onClick={handleExportPDF} loading={isPending}>
              <FileDown size={16} />
              Export PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
