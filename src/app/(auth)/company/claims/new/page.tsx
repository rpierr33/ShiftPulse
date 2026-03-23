import { requireRole } from "@/lib/auth-utils";
import { getCompanyForUser } from "@/actions/company";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { CMS1500FormEditor } from "@/components/company/cms-1500-form";

export default async function NewCMS1500Page() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/login");

  return (
    <div>
      <TopBar title="New CMS-1500 Form" subtitle="Create a new health insurance claim form" />
      <div className="p-4 lg:p-6">
        <CMS1500FormEditor companyId={company.id} />
      </div>
    </div>
  );
}
