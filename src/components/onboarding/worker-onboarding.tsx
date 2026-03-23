"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepProgress } from "@/components/onboarding/step-progress";
import { WORKER_TYPE_LABELS } from "@/types";
import {
  completeWorkerStep1,
  completeWorkerStep2,
  completeWorkerStep3,
  completeWorkerStep4,
  completeWorkerStep5,
  skipOnboarding,
} from "@/actions/onboarding";
import type { WorkerType, DayOfWeek } from "@prisma/client";
import {
  Stethoscope,
  Heart,
  UserCheck,
  HandHelping,
  BriefcaseMedical,
  Syringe,
  Activity,
  Brain,
  Accessibility,
  Ear,
  Wind,
  Users,
  PersonStanding,
  HelpCircle,
  MapPin,
  Clock,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Eye,
  Check,
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────

const WORKER_TYPE_ICONS: Record<WorkerType, React.ReactNode> = {
  RN: <Stethoscope className="h-5 w-5" />,
  LPN: <Heart className="h-5 w-5" />,
  CNA: <UserCheck className="h-5 w-5" />,
  HHA: <HandHelping className="h-5 w-5" />,
  ARNP: <BriefcaseMedical className="h-5 w-5" />,
  MEDICAL_ASSISTANT: <Syringe className="h-5 w-5" />,
  PHYSICAL_THERAPIST: <Activity className="h-5 w-5" />,
  PT_ASSISTANT: <Activity className="h-5 w-5" />,
  OCCUPATIONAL_THERAPIST: <Brain className="h-5 w-5" />,
  OT_ASSISTANT: <Brain className="h-5 w-5" />,
  SPEECH_LANGUAGE_PATHOLOGIST: <Ear className="h-5 w-5" />,
  RESPIRATORY_THERAPIST: <Wind className="h-5 w-5" />,
  LICENSED_CLINICAL_SOCIAL_WORKER: <Users className="h-5 w-5" />,
  COMPANION_SITTER: <Accessibility className="h-5 w-5" />,
  PERSONAL_CARE_ATTENDANT: <PersonStanding className="h-5 w-5" />,
  BABYSITTER_CHILDCARE: <Heart className="h-5 w-5" />,
  OTHER: <HelpCircle className="h-5 w-5" />,
};

const SPECIALTIES = [
  "Wound Care",
  "Pediatrics",
  "Geriatrics",
  "IV Therapy",
  "Diabetes Care",
  "Ventilator Care",
  "Medication Management",
  "Fall Prevention",
  "Dementia Care",
  "Post-Surgical Care",
  "Hospice Care",
  "Mental Health",
  "Cardiac Care",
  "Rehabilitation",
  "Palliative Care",
  "Telemetry",
  "Orthopedics",
  "Oncology",
  "Home Health",
  "Case Management",
];

const DAYS_OF_WEEK: { value: DayOfWeek; label: string; short: string }[] = [
  { value: "MONDAY", label: "Monday", short: "Mon" },
  { value: "TUESDAY", label: "Tuesday", short: "Tue" },
  { value: "WEDNESDAY", label: "Wednesday", short: "Wed" },
  { value: "THURSDAY", label: "Thursday", short: "Thu" },
  { value: "FRIDAY", label: "Friday", short: "Fri" },
  { value: "SATURDAY", label: "Saturday", short: "Sat" },
  { value: "SUNDAY", label: "Sunday", short: "Sun" },
];

const STEP_LABELS = ["Profile", "Location", "Skills", "Availability", "Review"];

// ─── Types ──────────────────────────────────────────────────────

interface WorkerOnboardingProps {
  userId: string;
  existingData: {
    workerType?: WorkerType | null;
    yearsExperience?: number | null;
    bio?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    serviceRadiusMiles?: number | null;
    phone?: string | null;
    specialties?: string[];
    hourlyRate?: number | null;
    availabilitySlots?: { dayOfWeek: DayOfWeek; startTime: string; endTime: string }[];
    isMarketplaceVisible?: boolean;
    profileCompleteness?: number;
  } | null;
}

type AvailabilityEntry = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

// ─── Component ──────────────────────────────────────────────────

export function WorkerOnboarding({ existingData }: WorkerOnboardingProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1 state
  const [workerType, setWorkerType] = useState<WorkerType | null>(
    existingData?.workerType ?? null
  );
  const [yearsExperience, setYearsExperience] = useState<number>(
    existingData?.yearsExperience ?? 0
  );
  const [bio, setBio] = useState(existingData?.bio ?? "");

  // Step 2 state
  const [city, setCity] = useState(existingData?.city ?? "");
  const [state, setState] = useState(existingData?.state ?? "FL");
  const [zipCode, setZipCode] = useState(existingData?.zipCode ?? "");
  const [serviceRadius, setServiceRadius] = useState<number>(
    existingData?.serviceRadiusMiles ?? 25
  );
  const [phone, setPhone] = useState(existingData?.phone ?? "");

  // Step 3 state
  const [specialties, setSpecialties] = useState<string[]>(
    existingData?.specialties ?? []
  );
  const [hourlyRate, setHourlyRate] = useState<string>(
    existingData?.hourlyRate != null ? String(existingData.hourlyRate) : ""
  );

  // Step 4 state
  const [availability, setAvailability] = useState<Record<DayOfWeek, AvailabilityEntry>>(() => {
    const defaults: Record<DayOfWeek, AvailabilityEntry> = {
      MONDAY: { enabled: false, startTime: "08:00", endTime: "17:00" },
      TUESDAY: { enabled: false, startTime: "08:00", endTime: "17:00" },
      WEDNESDAY: { enabled: false, startTime: "08:00", endTime: "17:00" },
      THURSDAY: { enabled: false, startTime: "08:00", endTime: "17:00" },
      FRIDAY: { enabled: false, startTime: "08:00", endTime: "17:00" },
      SATURDAY: { enabled: false, startTime: "08:00", endTime: "17:00" },
      SUNDAY: { enabled: false, startTime: "08:00", endTime: "17:00" },
    };
    if (existingData?.availabilitySlots) {
      for (const slot of existingData.availabilitySlots) {
        defaults[slot.dayOfWeek] = {
          enabled: true,
          startTime: slot.startTime,
          endTime: slot.endTime,
        };
      }
    }
    return defaults;
  });

  // Step 5 state
  const [marketplaceVisible, setMarketplaceVisible] = useState(
    existingData?.isMarketplaceVisible ?? true
  );

  // Track completed steps
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    const completed: number[] = [];
    if (existingData?.workerType && existingData.yearsExperience !== null) completed.push(1);
    if (existingData?.city && existingData.state && existingData.zipCode) completed.push(2);
    if (existingData?.specialties && existingData.specialties.length > 0) completed.push(3);
    if (existingData?.availabilitySlots && existingData.availabilitySlots.length > 0) completed.push(4);
    return completed;
  });

  function validateStep(step: number): boolean {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!workerType) newErrors.workerType = "Please select your worker type";
      if (!bio.trim()) newErrors.bio = "Please write a short bio";
    } else if (step === 2) {
      if (!city.trim()) newErrors.city = "City is required";
      if (!state.trim()) newErrors.state = "State is required";
      if (!zipCode.trim()) newErrors.zipCode = "ZIP code is required";
      if (!phone.trim()) newErrors.phone = "Phone number is required";
    } else if (step === 3) {
      if (specialties.length === 0) newErrors.specialties = "Select at least one specialty";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (!validateStep(currentStep)) return;

    startTransition(async () => {
      let result: { success?: boolean; error?: string } = {};

      if (currentStep === 1) {
        result = await completeWorkerStep1({
          workerType: workerType!,
          yearsExperience,
          bio,
        });
      } else if (currentStep === 2) {
        result = await completeWorkerStep2({
          city,
          state,
          zipCode,
          serviceRadiusMiles: serviceRadius,
          phone,
        });
      } else if (currentStep === 3) {
        result = await completeWorkerStep3({
          specialties,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        });
      } else if (currentStep === 4) {
        const slots = Object.entries(availability)
          .filter(([, entry]) => entry.enabled)
          .map(([day, entry]) => ({
            dayOfWeek: day as DayOfWeek,
            startTime: entry.startTime,
            endTime: entry.endTime,
          }));
        result = await completeWorkerStep4({ availability: slots });
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
        await completeWorkerStep5();
      } else {
        // Mark onboarding done but not marketplace visible
        await skipOnboarding();
      }
      router.push("/worker/dashboard");
    });
  }

  function handleSkip() {
    startTransition(async () => {
      await skipOnboarding();
      router.push("/worker/dashboard");
    });
  }

  function toggleSpecialty(specialty: string) {
    setSpecialties((prev) =>
      prev.includes(specialty) ? prev.filter((s) => s !== specialty) : [...prev, specialty]
    );
  }

  function toggleDay(day: DayOfWeek) {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  }

  function updateDayTime(day: DayOfWeek, field: "startTime" | "endTime", value: string) {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  // ─── Render Steps ─────────────────────────────────────────────

  function renderStep1() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">What type of healthcare worker are you?</h2>
          <p className="mt-1 text-gray-500">
            Select the role that best describes your profession.
          </p>
        </div>

        {errors.workerType && (
          <p className="text-sm text-red-600">{errors.workerType}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(Object.entries(WORKER_TYPE_LABELS) as [WorkerType, string][]).map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setWorkerType(value)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all duration-200 hover:shadow-md",
                  workerType === value
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    workerType === value
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {WORKER_TYPE_ICONS[value]}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium leading-tight",
                    workerType === value ? "text-blue-700" : "text-gray-700"
                  )}
                >
                  {label}
                </span>
              </button>
            )
          )}
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Years of Experience
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={40}
                value={yearsExperience}
                onChange={(e) => setYearsExperience(parseInt(e.target.value, 10))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-lg font-semibold text-gray-900 w-16 text-center">
                {yearsExperience} {yearsExperience === 1 ? "yr" : "yrs"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Short Bio <span className="text-red-500">*</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell providers about yourself, your experience, and what makes you a great healthcare professional..."
              className={cn(
                "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none",
                errors.bio && "border-red-400 focus:ring-red-500/20 focus:border-red-500"
              )}
            />
            {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
          </div>
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
            This helps providers find you in their area.
          </p>
        </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Service Radius
          </label>
          <div className="flex items-center gap-4">
            <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={serviceRadius}
              onChange={(e) => setServiceRadius(parseInt(e.target.value, 10))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-lg font-semibold text-gray-900 w-24 text-center">
              {serviceRadius} miles
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            How far are you willing to travel for work?
          </p>
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">What are your skills?</h2>
          <p className="mt-1 text-gray-500">
            Select your specialties to improve your visibility in the marketplace.
          </p>
        </div>

        {errors.specialties && (
          <p className="text-sm text-red-600">{errors.specialties}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => toggleSpecialty(specialty)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 border",
                specialties.includes(specialty)
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              {specialties.includes(specialty) && (
                <Check className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" />
              )}
              {specialty}
            </button>
          ))}
        </div>

        <div className="pt-2">
          <Input
            label="Hourly Rate (optional)"
            id="hourlyRate"
            type="number"
            min={0}
            step={0.5}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="e.g. 35.00"
          />
          <p className="mt-1 text-xs text-gray-400">
            Setting a rate helps providers know your expectations upfront.
          </p>
        </div>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">When are you available?</h2>
          <p className="mt-1 text-gray-500">
            Set your typical weekly availability. You can always adjust this later.
          </p>
        </div>

        <div className="space-y-3">
          {DAYS_OF_WEEK.map(({ value, label, short }) => {
            const entry = availability[value];
            return (
              <div
                key={value}
                className={cn(
                  "flex items-center gap-4 rounded-xl border-2 p-4 transition-all duration-200",
                  entry.enabled
                    ? "border-blue-200 bg-blue-50/50"
                    : "border-gray-200 bg-white"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleDay(value)}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-all",
                    entry.enabled
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {short.charAt(0)}
                </button>

                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      entry.enabled ? "text-gray-900" : "text-gray-400"
                    )}
                  >
                    {label}
                  </span>
                </div>

                {entry.enabled && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={entry.startTime}
                      onChange={(e) => updateDayTime(value, "startTime", e.target.value)}
                      className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <span className="text-gray-400 text-sm">to</span>
                    <input
                      type="time"
                      value={entry.endTime}
                      onChange={(e) => updateDayTime(value, "endTime", e.target.value)}
                      className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                )}

                {!entry.enabled && (
                  <span className="text-xs text-gray-400">Unavailable</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderStep5() {
    const enabledDays = Object.entries(availability).filter(([, e]) => e.enabled);
    const completeness = calculateLocalCompleteness();

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Review & Go Live</h2>
          <p className="mt-1 text-gray-500">
            Review your profile before publishing to the marketplace.
          </p>
        </div>

        {/* Completeness */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Profile Completeness</span>
            <span className="text-sm font-bold text-blue-600">{completeness}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                completeness >= 80 ? "bg-emerald-500" : completeness >= 50 ? "bg-blue-500" : "bg-amber-500"
              )}
              style={{ width: `${completeness}%` }}
            />
          </div>
          {completeness < 100 && (
            <p className="mt-2 text-xs text-gray-400">
              Complete more fields to increase your marketplace visibility.
            </p>
          )}
        </div>

        {/* Summary Cards */}
        <div className="space-y-4">
          <SummaryCard
            icon={<Stethoscope className="h-5 w-5" />}
            title="Profile"
            onEdit={() => setCurrentStep(1)}
          >
            {workerType ? (
              <div className="space-y-1">
                <p className="text-sm text-gray-900 font-medium">{WORKER_TYPE_LABELS[workerType]}</p>
                <p className="text-sm text-gray-500">{yearsExperience} years experience</p>
                {bio && <p className="text-sm text-gray-500 line-clamp-2">{bio}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Not completed</p>
            )}
          </SummaryCard>

          <SummaryCard
            icon={<MapPin className="h-5 w-5" />}
            title="Location"
            onEdit={() => setCurrentStep(2)}
          >
            {city ? (
              <div className="space-y-1">
                <p className="text-sm text-gray-900">{city}, {state} {zipCode}</p>
                <p className="text-sm text-gray-500">{serviceRadius} mile radius</p>
                {phone && <p className="text-sm text-gray-500">{phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Not completed</p>
            )}
          </SummaryCard>

          <SummaryCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Skills"
            onEdit={() => setCurrentStep(3)}
          >
            {specialties.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {specialties.map((s) => (
                    <span key={s} className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
                      {s}
                    </span>
                  ))}
                </div>
                {hourlyRate && (
                  <p className="text-sm text-gray-500">${parseFloat(hourlyRate).toFixed(2)}/hr</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Not completed</p>
            )}
          </SummaryCard>

          <SummaryCard
            icon={<Clock className="h-5 w-5" />}
            title="Availability"
            onEdit={() => setCurrentStep(4)}
          >
            {enabledDays.length > 0 ? (
              <div className="space-y-1">
                {enabledDays.map(([day, entry]) => {
                  const dayInfo = DAYS_OF_WEEK.find((d) => d.value === day);
                  return (
                    <p key={day} className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">{dayInfo?.label}</span>{" "}
                      {entry.startTime} - {entry.endTime}
                    </p>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Not set</p>
            )}
          </SummaryCard>
        </div>

        {/* Marketplace toggle */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">List me on the marketplace</p>
                <p className="text-xs text-gray-500">Providers will be able to find and contact you</p>
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

  function calculateLocalCompleteness(): number {
    const fields = [
      workerType !== null,
      yearsExperience > 0,
      bio.trim().length > 0,
      city.trim().length > 0,
      state.trim().length > 0,
      zipCode.trim().length > 0,
      serviceRadius > 0,
      specialties.length > 0,
      hourlyRate.length > 0,
      Object.values(availability).some((e) => e.enabled),
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
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
          {currentStep === 5 && renderStep5()}

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
              {currentStep < 5 ? (
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
