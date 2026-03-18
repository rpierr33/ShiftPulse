"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateCompanySettings } from "@/actions/company";
import { Settings, Save, MapPin } from "lucide-react";

interface SettingsFormProps {
  companyId: string;
  company: {
    name: string;
    joinCode: string;
    timezone: string;
    autoApproveWorkers: boolean;
    allowManualEntry: boolean;
    allowBackdatedEntry: boolean;
    requireShiftSelection: boolean;
    enableGeofencing: boolean;
    geofenceRadiusMeters: number;
    latitude: number | null;
    longitude: number | null;
  };
  settings: {
    overtimeThreshold: number;
    overtimeMultiplier: number;
    roundingIncrement: number;
    autoApproveTimeEntries: boolean;
    breakDurationMinutes: number;
    autoDeductBreak: boolean;
    maxClockInEarlyMinutes: number;
    maxClockOutLateMinutes: number;
    enableEvv: boolean;
  } | null;
}

export function SettingsForm({ companyId, company, settings }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await updateCompanySettings(companyId, formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
          Settings saved successfully!
        </div>
      )}

      {/* Company info (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={18} />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Company Name</label>
              <p className="font-medium">{company.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Join Code</label>
              <p className="font-mono font-bold text-lg text-blue-700">{company.joinCode}</p>
            </div>
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                id="timezone"
                name="timezone"
                defaultValue={company.timezone}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="America/Anchorage">Alaska (AKT)</option>
                <option value="Pacific/Honolulu">Hawaii (HT)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company policies */}
      <Card>
        <CardHeader>
          <CardTitle>Company Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="autoApproveWorkers"
                defaultChecked={company.autoApproveWorkers}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium">Auto-approve Workers</p>
                <p className="text-xs text-gray-500">Workers join without manual approval</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="allowManualEntry"
                defaultChecked={company.allowManualEntry}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium">Allow Manual Entry</p>
                <p className="text-xs text-gray-500">Workers can submit manual time entries</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="allowBackdatedEntry"
                defaultChecked={company.allowBackdatedEntry}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium">Allow Backdated Entry</p>
                <p className="text-xs text-gray-500">Workers can enter time for past dates</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="requireShiftSelection"
                defaultChecked={company.requireShiftSelection}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium">Require Shift Selection</p>
                <p className="text-xs text-gray-500">Workers must select a shift when clocking in</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* EVV / Geofencing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin size={18} />
            EVV / Geofencing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="enableEvv"
                defaultChecked={settings?.enableEvv ?? false}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium">Enable EVV</p>
                <p className="text-xs text-gray-500">Electronic Visit Verification for compliance</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="enableGeofencing"
                defaultChecked={company.enableGeofencing}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium">Enable Geofencing</p>
                <p className="text-xs text-gray-500">Verify worker location on clock-in/out</p>
              </div>
            </label>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Input
              id="geofenceRadiusMeters"
              name="geofenceRadiusMeters"
              type="number"
              label="Geofence Radius (meters)"
              defaultValue={company.geofenceRadiusMeters}
              min={50}
              max={5000}
              step={10}
            />
            <Input
              id="companyLatitude"
              name="companyLatitude"
              type="number"
              label="Company Latitude"
              defaultValue={company.latitude ?? ""}
              step="any"
              placeholder="e.g. 40.7128"
            />
            <Input
              id="companyLongitude"
              name="companyLongitude"
              type="number"
              label="Company Longitude"
              defaultValue={company.longitude ?? ""}
              step="any"
              placeholder="e.g. -74.0060"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Set the company coordinates to the primary work site. Individual shifts can override with their own coordinates.
          </p>
          {company.enableGeofencing && !company.latitude && !company.longitude && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2">
              Geofencing is enabled but no coordinates are set. Please enter latitude and longitude for verification to work.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Timekeeping settings */}
      <Card>
        <CardHeader>
          <CardTitle>Timekeeping Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              id="overtimeThreshold"
              name="overtimeThreshold"
              type="number"
              label="Overtime Threshold (hours/week)"
              defaultValue={settings?.overtimeThreshold ?? 40}
              min={0}
              step={0.5}
            />
            <Input
              id="overtimeMultiplier"
              name="overtimeMultiplier"
              type="number"
              label="Overtime Multiplier"
              defaultValue={settings?.overtimeMultiplier ?? 1.5}
              min={1}
              step={0.1}
            />
            <Input
              id="roundingIncrement"
              name="roundingIncrement"
              type="number"
              label="Rounding Increment (minutes)"
              defaultValue={settings?.roundingIncrement ?? 15}
              min={1}
            />
            <Input
              id="breakDurationMinutes"
              name="breakDurationMinutes"
              type="number"
              label="Break Duration (minutes)"
              defaultValue={settings?.breakDurationMinutes ?? 30}
              min={0}
            />
            <Input
              id="maxClockInEarlyMinutes"
              name="maxClockInEarlyMinutes"
              type="number"
              label="Max Early Clock-in (minutes)"
              defaultValue={settings?.maxClockInEarlyMinutes ?? 15}
              min={0}
            />
            <Input
              id="maxClockOutLateMinutes"
              name="maxClockOutLateMinutes"
              type="number"
              label="Max Late Clock-out (minutes)"
              defaultValue={settings?.maxClockOutLateMinutes ?? 15}
              min={0}
            />
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="autoApproveTimeEntries"
                defaultChecked={settings?.autoApproveTimeEntries ?? false}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium">Auto-approve Time Entries</p>
                <p className="text-xs text-gray-500">Skip manual approval workflow</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="autoDeductBreak"
                defaultChecked={settings?.autoDeductBreak ?? false}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium">Auto-deduct Break</p>
                <p className="text-xs text-gray-500">Automatically subtract break time</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={loading} className="gap-2">
          <Save size={16} />
          Save Settings
        </Button>
      </div>
    </form>
  );
}
