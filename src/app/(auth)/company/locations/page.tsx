import { requireRole } from "@/lib/auth-utils";
import { getCompanyForUser } from "@/actions/company";
import { getLocations } from "@/actions/locations";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { LocationsClient } from "./locations-client";

export default async function LocationsPage() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/login");

  const locations = await getLocations(company.id);

  return (
    <div>
      <TopBar title="Locations" subtitle={company.name} />

      <div className="p-4 lg:p-6 space-y-6">
        <LocationsClient companyId={company.id} initialLocations={locations} />
      </div>
    </div>
  );
}
