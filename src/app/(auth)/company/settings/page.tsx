import { requireRole } from "@/lib/auth-utils";
import { getCompanyForUser } from "@/actions/company";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { SettingsForm } from "@/components/company/settings-form";

export default async function CompanySettingsPage() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/login");

  const settings = await db.settings.findUnique({
    where: { companyId: company.id },
  });

  return (
    <div>
      <TopBar title="Settings" />

      <div className="p-4 lg:p-6">
        <SettingsForm
          companyId={company.id}
          company={{
            name: company.name,
            joinCode: company.joinCode,
            timezone: company.timezone,
            autoApproveWorkers: company.autoApproveWorkers,
            allowManualEntry: company.allowManualEntry,
            allowBackdatedEntry: company.allowBackdatedEntry,
            requireShiftSelection: company.requireShiftSelection,
            enableGeofencing: company.enableGeofencing,
            geofenceRadiusMeters: company.geofenceRadiusMeters,
            latitude: company.latitude,
            longitude: company.longitude,
          }}
          settings={settings ? {
            overtimeThreshold: settings.overtimeThreshold,
            overtimeMultiplier: settings.overtimeMultiplier,
            roundingIncrement: settings.roundingIncrement,
            autoApproveTimeEntries: settings.autoApproveTimeEntries,
            breakDurationMinutes: settings.breakDurationMinutes,
            autoDeductBreak: settings.autoDeductBreak,
            maxClockInEarlyMinutes: settings.maxClockInEarlyMinutes,
            maxClockOutLateMinutes: settings.maxClockOutLateMinutes,
            enableEvv: settings.enableEvv,
          } : null}
        />
      </div>
    </div>
  );
}
