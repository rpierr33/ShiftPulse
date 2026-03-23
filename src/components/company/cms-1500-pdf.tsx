"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

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

interface CMS1500PDFProps {
  form: {
    insuranceType?: string | null;
    insuredId?: string | null;
    patientLastName?: string | null;
    patientFirstName?: string | null;
    patientMiddle?: string | null;
    patientDob?: Date | string | null;
    patientSex?: string | null;
    insuredName?: string | null;
    patientAddress?: string | null;
    patientCity?: string | null;
    patientState?: string | null;
    patientZip?: string | null;
    patientPhone?: string | null;
    patientRelationship?: string | null;
    insuredAddress?: string | null;
    insuredCity?: string | null;
    insuredState?: string | null;
    insuredZip?: string | null;
    insuredPhone?: string | null;
    otherInsuredName?: string | null;
    otherInsuredPolicy?: string | null;
    groupNumber?: string | null;
    insuredDob?: Date | string | null;
    insuredSex?: string | null;
    insurancePlanName?: string | null;
    currentIllnessDate?: Date | string | null;
    referringProviderName?: string | null;
    referringProviderNpi?: string | null;
    additionalInfo?: string | null;
    diagnosisCodes?: string[];
    serviceLines?: unknown;
    federalTaxId?: string | null;
    federalTaxIdType?: string | null;
    patientAccountNumber?: string | null;
    acceptAssignment?: boolean;
    totalCharges?: number | null;
    amountPaid?: number | null;
    providerSignatureDate?: Date | string | null;
    facilityName?: string | null;
    facilityAddress?: string | null;
    facilityNpi?: string | null;
    billingProviderName?: string | null;
    billingProviderAddress?: string | null;
    billingProviderNpi?: string | null;
    billingProviderPhone?: string | null;
    billingProviderTaxId?: string | null;
  };
}

// ─── Helpers ────────────────────────────────────────────────────

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function v(val: string | null | undefined): string {
  return val ?? "";
}

const DIAG_LABELS = "ABCDEFGHIJKL".split("");

// ─── Component ──────────────────────────────────────────────────

export function CMS1500PDF({ form }: CMS1500PDFProps) {
  const lines = (Array.isArray(form.serviceLines) ? form.serviceLines : []) as ServiceLine[];
  const diagCodes = form.diagnosisCodes ?? [];
  const totalCharges =
    form.totalCharges != null ? parseFloat(String(form.totalCharges)).toFixed(2) : "0.00";
  const amountPaid =
    form.amountPaid != null ? parseFloat(String(form.amountPaid)).toFixed(2) : "0.00";

  return (
    <div>
      {/* Print Button */}
      <div className="print:hidden mb-4 flex justify-end">
        <Button onClick={() => window.print()}>
          <Printer size={16} />
          Print Form
        </Button>
      </div>

      {/* CMS-1500 Form */}
      <div className="cms-form border-2 border-red-700 p-2 bg-white max-w-[8.5in] mx-auto font-mono text-[10px] leading-tight print:border-2 print:p-2">
        {/* Title */}
        <div className="text-center border-b-2 border-red-700 pb-1 mb-1">
          <div className="text-[14px] font-bold text-red-700 tracking-wide">
            HEALTH INSURANCE CLAIM FORM
          </div>
          <div className="text-[8px] text-red-600">
            APPROVED BY NATIONAL UNIFORM CLAIM COMMITTEE (NUCC) 02/12
          </div>
        </div>

        {/* Row: Box 1 & 1a */}
        <div className="grid grid-cols-2 border-b border-red-700">
          <Cell label="1. MEDICARE / MEDICAID / TRICARE / CHAMPVA / GROUP / FECA / OTHER">
            {v(form.insuranceType)?.toUpperCase()}
          </Cell>
          <Cell label="1a. INSURED'S I.D. NUMBER">{v(form.insuredId)}</Cell>
        </div>

        {/* Row: Box 2 & 3 */}
        <div className="grid grid-cols-[1fr_120px_80px] border-b border-red-700">
          <Cell label="2. PATIENT'S NAME (Last Name, First Name, Middle Initial)">
            {v(form.patientLastName)}, {v(form.patientFirstName)} {v(form.patientMiddle)}
          </Cell>
          <Cell label="3. PATIENT'S BIRTH DATE">{fmtDate(form.patientDob)}</Cell>
          <Cell label="SEX">{v(form.patientSex)?.toUpperCase()}</Cell>
        </div>

        {/* Row: Box 4 & 6 */}
        <div className="grid grid-cols-2 border-b border-red-700">
          <Cell label="4. INSURED'S NAME">{v(form.insuredName)}</Cell>
          <Cell label="6. PATIENT RELATIONSHIP TO INSURED">
            {v(form.patientRelationship)?.toUpperCase()}
          </Cell>
        </div>

        {/* Row: Box 5 & 7 */}
        <div className="grid grid-cols-2 border-b border-red-700">
          <Cell label="5. PATIENT'S ADDRESS (No., Street)">
            <div>{v(form.patientAddress)}</div>
            <div>
              {v(form.patientCity)}, {v(form.patientState)} {v(form.patientZip)}
            </div>
            <div>PHONE: {v(form.patientPhone)}</div>
          </Cell>
          <Cell label="7. INSURED'S ADDRESS (No., Street)">
            <div>{v(form.insuredAddress)}</div>
            <div>
              {v(form.insuredCity)}, {v(form.insuredState)} {v(form.insuredZip)}
            </div>
            <div>PHONE: {v(form.insuredPhone)}</div>
          </Cell>
        </div>

        {/* Row: Box 9 & 11 */}
        <div className="grid grid-cols-2 border-b border-red-700">
          <Cell label="9. OTHER INSURED'S NAME">
            <div>{v(form.otherInsuredName)}</div>
            <div className="text-[8px] text-red-600 mt-0.5">POLICY OR GROUP NUMBER</div>
            <div>{v(form.otherInsuredPolicy)}</div>
          </Cell>
          <div className="border-l border-red-700">
            <Cell label="11. INSURED'S POLICY GROUP OR FECA NUMBER">
              {v(form.groupNumber)}
            </Cell>
            <div className="border-t border-red-700 px-1 py-0.5">
              <div className="text-[7px] text-red-600">11a. INSURED&apos;S DATE OF BIRTH / SEX</div>
              <div>
                {fmtDate(form.insuredDob)} {v(form.insuredSex)?.toUpperCase()}
              </div>
            </div>
            <div className="border-t border-red-700 px-1 py-0.5">
              <div className="text-[7px] text-red-600">11c. INSURANCE PLAN NAME OR PROGRAM NAME</div>
              <div>{v(form.insurancePlanName)}</div>
            </div>
          </div>
        </div>

        {/* Row: Box 14, 17, 19 */}
        <div className="grid grid-cols-3 border-b border-red-700">
          <Cell label="14. DATE OF CURRENT ILLNESS, INJURY, OR PREGNANCY">
            {fmtDate(form.currentIllnessDate)}
          </Cell>
          <Cell label="17. NAME OF REFERRING PROVIDER OR OTHER SOURCE">
            <div>{v(form.referringProviderName)}</div>
            <div className="text-[8px]">NPI: {v(form.referringProviderNpi)}</div>
          </Cell>
          <Cell label="19. ADDITIONAL CLAIM INFORMATION">{v(form.additionalInfo)}</Cell>
        </div>

        {/* Box 21 - Diagnosis */}
        <div className="border-b border-red-700 px-1 py-0.5">
          <div className="text-[7px] text-red-600 font-bold">
            21. DIAGNOSIS OR NATURE OF ILLNESS OR INJURY. Relate A-L to service line below (24E)
          </div>
          <div className="grid grid-cols-4 gap-x-2 gap-y-0.5 mt-0.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-[8px] font-bold text-red-700 w-3">{DIAG_LABELS[i]}.</span>
                <span className="border-b border-gray-300 flex-1 min-h-[12px] text-[9px]">
                  {diagCodes[i] ?? ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Box 24 - Service Lines */}
        <div className="border-b border-red-700">
          <div className="text-[7px] text-red-600 font-bold px-1">24.</div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[7px] text-red-700">
                <th className="border border-red-700 px-0.5 py-0.5 text-left">A. DATE(S) OF SERVICE From</th>
                <th className="border border-red-700 px-0.5 py-0.5 text-left">To</th>
                <th className="border border-red-700 px-0.5 py-0.5 text-left">B. POS</th>
                <th className="border border-red-700 px-0.5 py-0.5 text-left">D. PROCEDURES/SERVICES</th>
                <th className="border border-red-700 px-0.5 py-0.5 text-left">MOD</th>
                <th className="border border-red-700 px-0.5 py-0.5 text-left">E. DX PTR</th>
                <th className="border border-red-700 px-0.5 py-0.5 text-right">F. $ CHARGES</th>
                <th className="border border-red-700 px-0.5 py-0.5 text-right">G. UNITS</th>
                <th className="border border-red-700 px-0.5 py-0.5 text-left">J. RENDERING NPI</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.max(6, lines.length) }).map((_, i) => {
                const line = lines[i];
                return (
                  <tr key={i} className="text-[9px]">
                    <td className="border border-red-700 px-0.5 py-0.5">{line?.dateFrom ?? ""}</td>
                    <td className="border border-red-700 px-0.5 py-0.5">{line?.dateTo ?? ""}</td>
                    <td className="border border-red-700 px-0.5 py-0.5">
                      {line?.placeOfService ?? ""}
                    </td>
                    <td className="border border-red-700 px-0.5 py-0.5">{line?.cpt ?? ""}</td>
                    <td className="border border-red-700 px-0.5 py-0.5">{line?.modifier ?? ""}</td>
                    <td className="border border-red-700 px-0.5 py-0.5">
                      {line?.diagnosisPointer ?? ""}
                    </td>
                    <td className="border border-red-700 px-0.5 py-0.5 text-right">
                      {line ? `$${parseFloat(String(line.charges)).toFixed(2)}` : ""}
                    </td>
                    <td className="border border-red-700 px-0.5 py-0.5 text-right">
                      {line?.units ?? ""}
                    </td>
                    <td className="border border-red-700 px-0.5 py-0.5">{line?.npi ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Row: Box 25, 26, 27, 28 */}
        <div className="grid grid-cols-4 border-b border-red-700">
          <Cell label={`25. FEDERAL TAX I.D. NUMBER (${v(form.federalTaxIdType) || "EIN"})`}>
            {v(form.federalTaxId)}
          </Cell>
          <Cell label="26. PATIENT'S ACCOUNT NO.">{v(form.patientAccountNumber)}</Cell>
          <Cell label="27. ACCEPT ASSIGNMENT?">{form.acceptAssignment ? "YES" : "NO"}</Cell>
          <Cell label="28. TOTAL CHARGE">$ {totalCharges}</Cell>
        </div>

        {/* Row: Box 29, 31 */}
        <div className="grid grid-cols-3 border-b border-red-700">
          <Cell label="29. AMOUNT PAID">$ {amountPaid}</Cell>
          <Cell label="31. SIGNATURE OF PHYSICIAN OR SUPPLIER">
            <div className="text-[8px]">Date: {fmtDate(form.providerSignatureDate)}</div>
          </Cell>
          <Cell label="30. Rsvd for NUCC Use">&nbsp;</Cell>
        </div>

        {/* Row: Box 32 */}
        <div className="grid grid-cols-1 border-b border-red-700">
          <Cell label="32. SERVICE FACILITY LOCATION INFORMATION">
            <div>{v(form.facilityName)}</div>
            <div>{v(form.facilityAddress)}</div>
            <div>NPI: {v(form.facilityNpi)}</div>
          </Cell>
        </div>

        {/* Row: Box 33 */}
        <div className="grid grid-cols-1">
          <Cell label="33. BILLING PROVIDER INFO & PH #">
            <div>
              {v(form.billingProviderName)} | {v(form.billingProviderAddress)}
            </div>
            <div>
              NPI: {v(form.billingProviderNpi)} | Phone: {v(form.billingProviderPhone)} | Tax ID:{" "}
              {v(form.billingProviderTaxId)}
            </div>
          </Cell>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .cms-form,
          .cms-form * {
            visibility: visible;
          }
          .cms-form {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Cell sub-component ─────────────────────────────────────────

function Cell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-l border-red-700 first:border-l-0 px-1 py-0.5 min-h-[24px]">
      <div className="text-[7px] text-red-600 leading-none mb-0.5 uppercase">{label}</div>
      <div className="text-[9px] font-mono">{children}</div>
    </div>
  );
}
