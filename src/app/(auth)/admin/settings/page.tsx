import { requireRole } from "@/lib/auth-utils";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Shield } from "lucide-react";

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");

  return (
    <div>
      <TopBar title="Platform Settings" />

      <div className="p-4 lg:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={18} />
              Platform Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-500">Platform Name</label>
                <p className="font-medium">ShiftPulse</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Version</label>
                <p className="font-medium">1.0.0 MVP</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Default Timezone</label>
                <p className="font-medium">America/New_York</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Registration</label>
                <p className="font-medium">Open (Worker + Company)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings size={18} />
              Feature Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "EVV Tracking", enabled: false, description: "Electronic Visit Verification (Phase 2)" },
                { name: "Geofencing", enabled: false, description: "GPS-based clock-in verification (Phase 2)" },
                { name: "Payroll Export", enabled: false, description: "CSV/ADP payroll export (Phase 2)" },
                { name: "Push Notifications", enabled: false, description: "Real-time push notifications (Phase 2)" },
              ].map((feature) => (
                <div key={feature.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{feature.name}</p>
                    <p className="text-xs text-gray-500">{feature.description}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    feature.enabled ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                  }`}>
                    {feature.enabled ? "Enabled" : "Phase 2"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
