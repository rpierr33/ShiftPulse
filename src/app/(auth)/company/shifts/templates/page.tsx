import { requireRole } from "@/lib/auth-utils";
import { getCompanyForUser } from "@/actions/company";
import { getShiftTemplates } from "@/actions/shifts";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { ShiftTemplateForm } from "@/components/company/shift-template-form";
import { GenerateShiftsDialog } from "@/components/company/generate-shifts-dialog";
import { ShiftTemplatesList } from "@/components/company/shift-templates-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function ShiftTemplatesPage() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/login");

  const templates = await getShiftTemplates(company.id);

  return (
    <div>
      <TopBar title="Shift Templates" subtitle="Create recurring shift templates and generate shifts" />

      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/company/shifts">
            <Button variant="outline" size="sm">
              <ArrowLeft size={16} />
              Back to Shifts
            </Button>
          </Link>
        </div>

        <ShiftTemplateForm companyId={company.id} />

        <GenerateShiftsDialog companyId={company.id} templateCount={templates.length} />

        <div>
          <h2 className="text-lg font-semibold mb-4">Active Templates</h2>
          <ShiftTemplatesList templates={templates} />
        </div>
      </div>
    </div>
  );
}
