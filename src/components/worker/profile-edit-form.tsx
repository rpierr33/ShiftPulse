"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateWorkerProfile } from "@/actions/worker";

const US_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Detroit",
  "America/Indiana/Indianapolis",
  "America/Kentucky/Louisville",
  "America/Boise",
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
];

interface ProfileEditFormProps {
  user: {
    name: string;
    email: string;
    phone: string | null;
    timezone: string;
  };
  profile: {
    licenseNumber: string | null;
    licenseState: string | null;
    licenseExpiry: Date | null;
    specialties: string[];
    bio: string | null;
    hourlyRate: number | null;
  } | null;
}

export function ProfileEditForm({ user, profile }: ProfileEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [timezone, setTimezone] = useState(user.timezone);
  const [licenseNumber, setLicenseNumber] = useState(profile?.licenseNumber || "");
  const [licenseState, setLicenseState] = useState(profile?.licenseState || "");
  const [licenseExpiry, setLicenseExpiry] = useState(
    profile?.licenseExpiry ? new Date(profile.licenseExpiry).toISOString().split("T")[0] : ""
  );
  const [specialties, setSpecialties] = useState(profile?.specialties.join(", ") || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [hourlyRate, setHourlyRate] = useState(profile?.hourlyRate?.toString() || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("phone", phone);
    formData.set("timezone", timezone);
    formData.set("licenseNumber", licenseNumber);
    formData.set("licenseState", licenseState);
    formData.set("licenseExpiry", licenseExpiry);
    formData.set("specialties", specialties);
    formData.set("bio", bio);
    formData.set("hourlyRate", hourlyRate);

    const result = await updateWorkerProfile(formData);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully" });
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email"
          value={user.email}
          disabled
        />
        <Input
          label="Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
        />
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {US_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* License Information */}
      <div className="pt-4 border-t">
        <h3 className="text-sm font-medium text-gray-700 mb-3">License Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="License Number"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="RN12345678"
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License State
            </label>
            <select
              value={licenseState}
              onChange={(e) => setLicenseState(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select state</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="License Expiry"
            type="date"
            value={licenseExpiry}
            onChange={(e) => setLicenseExpiry(e.target.value)}
          />
        </div>
      </div>

      {/* Professional Details */}
      <div className="pt-4 border-t">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Professional Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Specialties"
            value={specialties}
            onChange={(e) => setSpecialties(e.target.value)}
            placeholder="ICU, ER, Med-Surg"
          />
          <Input
            label="Hourly Rate ($)"
            type="number"
            min="0"
            step="0.01"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="45.00"
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Tell companies about your experience..."
            className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button type="submit" loading={loading}>
          Save Changes
        </Button>
        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
