"use client";

import { useState, useEffect, useTransition } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getClientProfile, updateClientProfile } from "@/actions/client";
import { User, MapPin, Heart } from "lucide-react";

const RELATIONSHIP_OPTIONS = [
  { value: "self", label: "Self" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "spouse", label: "Spouse" },
  { value: "other", label: "Other" },
];

const SCHEDULE_OPTIONS = [
  { value: "mornings", label: "Mornings" },
  { value: "afternoons", label: "Afternoons" },
  { value: "evenings", label: "Evenings" },
  { value: "overnight", label: "Overnight" },
  { value: "flexible", label: "Flexible" },
];

const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" }, { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" }, { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" }, { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" }, { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
];

export default function ClientProfilePage() {
  const [userName, setUserName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [careRecipientName, setCareRecipientName] = useState("");
  const [careNeeds, setCareNeeds] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [preferredSchedule, setPreferredSchedule] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await getClientProfile();
      if (data.user) {
        setUserName(data.user.name);
        setPhone(data.user.phone ?? "");
      }
      if (data.profile) {
        setRelationship(data.profile.relationship ?? "");
        setCareRecipientName(data.profile.careRecipientName ?? "");
        setCareNeeds(data.profile.careNeeds ?? "");
        setAddress(data.profile.address ?? "");
        setCity(data.profile.city ?? "");
        setState(data.profile.state ?? "");
        setZipCode(data.profile.zipCode ?? "");
        setPreferredSchedule(data.profile.preferredSchedule ?? "");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMessage("");

    startTransition(async () => {
      const result = await updateClientProfile({
        relationship: relationship || undefined,
        careRecipientName: careRecipientName || undefined,
        careNeeds: careNeeds || undefined,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
        preferredSchedule: preferredSchedule || undefined,
      });

      if (result.success) {
        setSuccessMessage("Profile updated successfully");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    });
  }

  if (loading) {
    return (
      <div>
        <TopBar title="Profile" />
        <div className="p-4 lg:p-6">
          <div className="animate-pulse space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="h-5 bg-gray-200 rounded w-1/4" />
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Profile" subtitle="Manage your care preferences" />

      <div className="p-4 lg:p-6">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          {/* Personal info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={18} />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                id="name"
                label="Full Name"
                value={userName}
                disabled
                placeholder="Your full name"
              />
              <Input
                id="phone"
                label="Phone"
                value={phone}
                disabled
                placeholder="Phone number"
              />
            </CardContent>
          </Card>

          {/* Care recipient */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart size={18} />
                Care Recipient
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                id="relationship"
                label="Relationship to Care Recipient"
                options={RELATIONSHIP_OPTIONS}
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Select relationship"
              />
              <Input
                id="careRecipientName"
                label="Care Recipient Name"
                value={careRecipientName}
                onChange={(e) => setCareRecipientName(e.target.value)}
                placeholder="Name of person receiving care"
              />
              <div className="w-full">
                <label
                  htmlFor="careNeeds"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Care Needs
                </label>
                <textarea
                  id="careNeeds"
                  value={careNeeds}
                  onChange={(e) => setCareNeeds(e.target.value)}
                  placeholder="Describe the care needs, medical conditions, or special requirements..."
                  rows={4}
                  className="flex w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                />
              </div>
              <Select
                id="preferredSchedule"
                label="Preferred Schedule"
                options={SCHEDULE_OPTIONS}
                value={preferredSchedule}
                onChange={(e) => setPreferredSchedule(e.target.value)}
                placeholder="Select preferred schedule"
              />
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin size={18} />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                id="address"
                label="Street Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  id="city"
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                />
                <Select
                  id="state"
                  label="State"
                  options={US_STATES}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Select state"
                />
                <Input
                  id="zipCode"
                  label="ZIP Code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="12345"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <Button type="submit" loading={isPending}>
              Save Profile
            </Button>
            {successMessage && (
              <span className="text-sm text-emerald-600 font-medium">
                {successMessage}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
