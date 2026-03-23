"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepProgress } from "@/components/onboarding/step-progress";
import { PROVIDER_TYPE_LABELS } from "@/types";
import {
  completeProviderStep1,
  completeProviderStep2,
  completeProviderStep3,
  completeProviderStep4,
  skipOnboarding,
} from "@/actions/onboarding";
import type { ProviderType } from "@prisma/client";
import {
  Building2,
  Home,
  HeartPulse,
  Bed,
  Users,
  Baby,
  Dumbbell,
  Stethoscope,
  Building,
  BriefcaseMedical,
  HandHelping,
  Brain,
  TreePine,
  HelpCircle,
  Activity,
  MapPin,
  Eye,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Check,
  X,
  Plus,
  Sparkles,
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────

const PROVIDER_TYPE_ICONS: Record<ProviderType, React.ReactNode> = {
  HOME_HEALTH_AGENCY: <Home className="h-5 w-5" />,
  NURSE_REGISTRY: <Users className="h-5 w-5" />,
  HOSPICE_PROVIDER: <HeartPulse className="h-5 w-5" />,
  SKILLED_NURSING_FACILITY: <Bed className="h-5 w-5" />,
  ASSISTED_LIVING_FACILITY: <Building2 className="h-5 w-5" />,
  ADULT_DAY_CARE: <Baby className="h-5 w-5" />,
  REHABILITATION_CENTER: <Dumbbell className="h-5 w-5" />,
  PRIVATE_DUTY_NURSING: <Stethoscope className="h-5 w-5" />,
  GROUP_HOME: <Building className="h-5 w-5" />,
  PHYSICIAN_PRACTICE: <BriefcaseMedical className="h-5 w-5" />,
  HOME_CARE_NON_MEDICAL: <HandHelping className="h-5 w-5" />,
  MEMORY_CARE_FACILITY: <Brain className="h-5 w-5" />,
  CONTINUING_CARE_COMMUNITY: <TreePine className="h-5 w-5" />,
  OTHER: <HelpCircle className="h-5 w-5" />,
};

const SERVICE_OPTIONS = [
  "Skilled Nursing",
  "Home Health Aide",
  "Physical Therapy",
  "Occupational Therapy",
  "Speech Therapy",
  "Personal Care",
  "Companion Care",
  "Respite Care",
  "Hospice Care",
  "Wound Care",
  "IV Therapy",
  "Medication Management",
  "Post-Surgical Care",
  "Dementia Care",
  "Pediatric Care",
  "Geriatric Care",
  "Mental Health Services",
  "Medical Social Services",
  "Assessment & Evaluation",
  "Case Management",
];

const STEP_LABELS = ["About", "Location", "Services", "Review"];

// ─── Types ──────────────────────────────────────────────────────

interface ProviderOnboardingProps {
  userId: string;
  existingData: {
    providerType?: ProviderType | null;
    description?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    phone?: string | null;
    website?: string | null;
    npiNumber?: string | null;
    servicesOffered?: string[];
    serviceAreas?: string[];
    isMarketplaceVisible?: boolean;
  } | null;
}

// ─── Component ──────────────────────────────────────────────────

export function ProviderOnboarding({ existingData }: ProviderOnboardingProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1 state
  const [providerType, setProviderType] = useState<ProviderType | null>(
    existingData?.providerType ?? null
  );
  const [description, setDescription] = useState(existingData?.description ?? "");

  // Step 2 state
  const [address, setAddress] = useState(existingData?.address ?? "");
  const [city, setCity] = useState(existingData?.city ?? "");
  const [state, setState] = useState(existingData?.state ?? "FL");
  const [zipCode, setZipCode] = useState(existingData?.zipCode ?? "");
  const [phone, setPhone] = useState(existingData?.phone ?? "");
  const [website, setWebsite] = useState(existingData?.website ?? "");
  const [npiNumber, setNpiNumber] = useState(existingData?.npiNumber ?? "");

  // Step 3 state
  const [servicesOffered, setServicesOffered] = useState<string[]>(
    existingData?.servicesOffered ?? []
  );
  const [serviceAreas, setServiceAreas] = useState<string[]>(
    existingData?.serviceAreas ?? []
  );
  const [newServiceArea, setNewServiceArea] = useState("");

  // Step 4 state
  const [marketplaceVisible, setMarketplaceVisible] = useState(
    existingData?.isMarketplaceVisible ?? true
  );

  // Track completed steps
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    const completed: number[] = [];
    if (existingData?.providerType && existingData.description) completed.push(1);
    if (existingData?.city && existingData.state && existingData.zipCode) completed.push(2);
    if (existingData?.servicesOffered && existingData.servicesOffered.length > 0) completed.push(3);
    return completed;
  });

  function validateStep(step: number): boolean {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!providerType) newErrors.providerType = "Please select your provider type";
      if (!description.trim()) newErrors.description = "Please provide a description";
    } else if (step === 2) {
      if (!address.trim()) newErrors.address = "Address is required";
      if (!city.trim()) newErrors.city = "City is required";
      if (!state.trim()) newErrors.state = "State is required";
      if (!zipCode.trim()) newErrors.zipCode = "ZIP code is required";
      if (!phone.trim()) newErrors.phone = "Phone number is required";
    } else if (step === 3) {
      if (servicesOffered.length === 0) newErrors.services = "Select at least one service";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (!validateStep(currentStep)) return;

    startTransition(async () => {
      let result: { success?: boolean; error?: string } = {};

      if (currentStep === 1) {
        result = await completeProviderStep1({
          providerType: providerType!,
          description,
        });
      } else if (currentStep === 2) {
        result = await completeProviderStep2({
          address,
          city,
          state,
          zipCode,
          phone,
          website: website || undefined,
          npiNumber: npiNumber || undefined,
        });
      } else if (currentStep === 3) {
        result = await completeProviderStep3({
          servicesOffered,
          serviceAreas,
        });
      }

      if (result.error) {
        setErrors({ general: result.error });
        return;
      }

      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }
      setCurrentStep((prev) => prev + 1);
    });
  }

  function handleBack() {
    setErrors({});
    setCurrentStep((prev) => prev - 1);
  }

  function handleComplete() {
    startTransition(async () => {
      if (marketplaceVisible) {
        await completeProviderStep4();
      } else {
        await skipOnboarding();
      }
      router.push("/company/dashboard");
    });
  }

  function handleSkip() {
    startTransition(async () => {
      await skipOnboarding();
      router.push("/company/dashboard");
    });
  }

  function toggleService(service: string) {
    setServicesOffered((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  }

  function addServiceArea() {
    const trimmed = newServiceArea.trim();
    if (trimmed && !serviceAreas.includes(trimmed)) {
      setServiceAreas((prev) => [...prev, trimmed]);
      setNewServiceArea("");
    }
  }

  function removeServiceArea(area: string) {
    setServiceAreas((prev) => prev.filter((a) => a !== area));
  }

  // ─── Render Steps ─────────────────────────────────────────────

  function renderStep1() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">What type of provider are you?</h2>
          <p className="mt-1 text-gray-500">
            Select the category that best describes your organization.
          </p>
        </div>

        {errors.providerType && (
          <p className="text-sm text-red-600">{errors.providerType}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(Object.entries(PROVIDER_TYPE_LABELS) as [ProviderType, string][]).map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setProviderType(value)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all duration-200 hover:shadow-md",
                  providerType === value
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    providerType === value
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {PROVIDER_TYPE_ICONS[value]}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium leading-tight",
                    providerType === value ? "text-blue-700" : "text-gray-700"
                  )}
                >
                  {label}
                </span>
              </button>
            )
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Tell workers about your organization, your mission, and the type of care you provide..."
            className={cn(
              "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none",
              errors.description && "border-red-400 focus:ring-red-500/20 focus:border-red-500"
            )}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Where are you located?</h2>
          <p className="mt-1 text-gray-500">
            This helps workers find opportunities near them.
          </p>
        </div>

        <Input
          label="Street Address"
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 123 Healthcare Blvd"
          error={errors.address}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="City"
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Miami"
            error={errors.city}
          />
          <Input
            label="State"
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="e.g. FL"
            error={errors.state}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="ZIP Code"
            id="zipCode"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="e.g. 33101"
            error={errors.zipCode}
          />
          <Input
            label="Phone Number"
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(305) 555-0100"
            error={errors.phone}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Website (optional)"
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://www.example.com"
          />
          <Input
            label="NPI Number (optional)"
            id="npiNumber"
            value={npiNumber}
            onChange={(e) => setNpiNumber(e.target.value)}
            placeholder="e.g. 1234567890"
          />
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">What services do you offer?</h2>
          <p className="mt-1 text-gray-500">
            Select the services your organization provides and the areas you serve.
          </p>
        </div>

        {errors.services && (
          <p className="text-sm text-red-600">{errors.services}</p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Services Offered <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_OPTIONS.map((service) => (
              <button
                key={service}
                type="button"
                onClick={() => toggleService(service)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 border",
                  servicesOffered.includes(service)
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                {servicesOffered.includes(service) && (
                  <Check className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" />
                )}
                {service}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Service Areas
          </label>
          <p className="text-xs text-gray-400 mb-3">
            Add cities or ZIP codes where you provide services.
          </p>

          <div className="flex gap-2 mb-3">
            <Input
              id="serviceArea"
              value={newServiceArea}
              onChange={(e) => setNewServiceArea(e.target.value)}
              placeholder="e.g. Miami or 33101"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addServiceArea();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addServiceArea}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {serviceAreas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {serviceAreas.map((area) => (
                <span
                  key={area}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
                >
                  <MapPin className="h-3 w-3 text-gray-400" />
                  {area}
                  <button
                    type="button"
                    onClick={() => removeServiceArea(area)}
                    className="ml-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Review & Go Live</h2>
          <p className="mt-1 text-gray-500">
            Review your organization profile before publishing to the marketplace.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="space-y-4">
          <SummaryCard
            icon={<Building2 className="h-5 w-5" />}
            title="Organization"
            onEdit={() => setCurrentStep(1)}
          >
            {providerType ? (
              <div className="space-y-1">
                <p className="text-sm text-gray-900 font-medium">
                  {PROVIDER_TYPE_LABELS[providerType]}
                </p>
                {description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Not completed</p>
            )}
          </SummaryCard>

          <SummaryCard
            icon={<MapPin className="h-5 w-5" />}
            title="Location & Contact"
            onEdit={() => setCurrentStep(2)}
          >
            {city ? (
              <div className="space-y-1">
                {address && <p className="text-sm text-gray-900">{address}</p>}
                <p className="text-sm text-gray-600">{city}, {state} {zipCode}</p>
                {phone && <p className="text-sm text-gray-500">{phone}</p>}
                {website && <p className="text-sm text-blue-600">{website}</p>}
                {npiNumber && <p className="text-sm text-gray-500">NPI: {npiNumber}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Not completed</p>
            )}
          </SummaryCard>

          <SummaryCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Services & Areas"
            onEdit={() => setCurrentStep(3)}
          >
            {servicesOffered.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {servicesOffered.map((s) => (
                    <span key={s} className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
                      {s}
                    </span>
                  ))}
                </div>
                {serviceAreas.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Service Areas:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {serviceAreas.map((a) => (
                        <span key={a} className="rounded-full bg-gray-100 text-gray-600 px-2.5 py-0.5 text-xs">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Not completed</p>
            )}
          </SummaryCard>
        </div>

        {/* Marketplace toggle */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">List on the marketplace</p>
                <p className="text-xs text-gray-500">Workers will be able to find and apply to your organization</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMarketplaceVisible(!marketplaceVisible)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
                marketplaceVisible ? "bg-blue-600" : "bg-gray-200"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200",
                  marketplaceVisible ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CareCircle</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <StepProgress
            steps={STEP_LABELS}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* Step Card */}
        <div className="rounded-2xl bg-white shadow-lg p-8">
          {errors.general && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <div>
              {currentStep > 1 && (
                <Button variant="ghost" onClick={handleBack} disabled={isPending}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {currentStep < 4 ? (
                <Button onClick={handleNext} loading={isPending}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleComplete} loading={isPending} size="lg">
                  Complete Setup
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Skip link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isPending}
            className="text-sm text-gray-400 hover:text-gray-500 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Summary Card Sub-component ─────────────────────────────────

function SummaryCard({
  icon,
  title,
  onEdit,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-gray-500">{icon}</div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}
