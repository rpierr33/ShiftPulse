import type { UserRole, SubscriptionTier, ProviderType, WorkerType, CredentialStatus } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  timezone: string;
};

export type DashboardMetric = {
  label: string;
  value: number | string;
  change?: number;
  color?: string;
  icon?: string;
};

export type ClockStatus = {
  isClockedIn: boolean;
  currentEntryId?: string;
  clockInTime?: Date;
  shiftTitle?: string;
  companyName?: string;
};

export type WeeklyHours = {
  day: string;
  hours: number;
  date: string;
};

export type VisitStatus = {
  label: string;
  count: number;
  color: string;
};

// ─── Provider & Worker Types ─────────────────────────────────────

export const PROVIDER_TYPE_LABELS: Record<ProviderType, string> = {
  HOME_HEALTH_AGENCY: "Home Health Agency",
  NURSE_REGISTRY: "Nurse Registry / Staffing Agency",
  HOSPICE_PROVIDER: "Hospice Provider",
  SKILLED_NURSING_FACILITY: "Skilled Nursing Facility (SNF)",
  ASSISTED_LIVING_FACILITY: "Assisted Living Facility (ALF)",
  ADULT_DAY_CARE: "Adult Day Care Center",
  REHABILITATION_CENTER: "Rehabilitation Center",
  PRIVATE_DUTY_NURSING: "Private Duty Nursing Agency",
  GROUP_HOME: "Group Home / Residential Care",
  PHYSICIAN_PRACTICE: "Physician Practice / Clinic",
  HOME_CARE_NON_MEDICAL: "Home Care (Non-Medical)",
  MEMORY_CARE_FACILITY: "Memory Care Facility",
  CONTINUING_CARE_COMMUNITY: "Continuing Care Retirement Community",
  OTHER: "Other",
};

export const WORKER_TYPE_LABELS: Record<WorkerType, string> = {
  RN: "Registered Nurse (RN)",
  LPN: "Licensed Practical Nurse (LPN)",
  CNA: "Certified Nursing Assistant (CNA)",
  HHA: "Home Health Aide (HHA)",
  ARNP: "Advanced Practice Nurse (ARNP/NP)",
  MEDICAL_ASSISTANT: "Medical Assistant (MA)",
  PHYSICAL_THERAPIST: "Physical Therapist (PT)",
  PT_ASSISTANT: "Physical Therapist Assistant (PTA)",
  OCCUPATIONAL_THERAPIST: "Occupational Therapist (OT)",
  OT_ASSISTANT: "Occupational Therapy Assistant (OTA)",
  SPEECH_LANGUAGE_PATHOLOGIST: "Speech-Language Pathologist (SLP)",
  RESPIRATORY_THERAPIST: "Respiratory Therapist (RT)",
  LICENSED_CLINICAL_SOCIAL_WORKER: "Licensed Clinical Social Worker (LCSW)",
  COMPANION_SITTER: "Companion / Sitter (Non-Medical)",
  PERSONAL_CARE_ATTENDANT: "Personal Care Attendant (PCA)",
  BABYSITTER_CHILDCARE: "Babysitter / Childcare Provider",
  OTHER: "Other",
};

export const WORKER_TYPE_SHORT: Record<WorkerType, string> = {
  RN: "RN",
  LPN: "LPN",
  CNA: "CNA",
  HHA: "HHA",
  ARNP: "ARNP",
  MEDICAL_ASSISTANT: "MA",
  PHYSICAL_THERAPIST: "PT",
  PT_ASSISTANT: "PTA",
  OCCUPATIONAL_THERAPIST: "OT",
  OT_ASSISTANT: "OTA",
  SPEECH_LANGUAGE_PATHOLOGIST: "SLP",
  RESPIRATORY_THERAPIST: "RT",
  LICENSED_CLINICAL_SOCIAL_WORKER: "LCSW",
  COMPANION_SITTER: "Companion",
  PERSONAL_CARE_ATTENDANT: "PCA",
  BABYSITTER_CHILDCARE: "Childcare",
  OTHER: "Other",
};

// ─── Credential Types ────────────────────────────────────────────

export const CREDENTIAL_TYPES = [
  { value: "RN_LICENSE", label: "RN License" },
  { value: "LPN_LICENSE", label: "LPN License" },
  { value: "CNA_CERTIFICATION", label: "CNA Certification" },
  { value: "HHA_CERTIFICATION", label: "HHA Certification" },
  { value: "ARNP_LICENSE", label: "ARNP License" },
  { value: "CPR_BLS", label: "CPR / BLS Certification" },
  { value: "ACLS", label: "ACLS Certification" },
  { value: "PALS", label: "PALS Certification" },
  { value: "TB_TEST", label: "TB Test (PPD/QuantiFERON)" },
  { value: "BACKGROUND_CHECK", label: "Background Check (Level 2)" },
  { value: "DRUG_SCREENING", label: "Drug Screening" },
  { value: "PHYSICAL_EXAM", label: "Physical Examination" },
  { value: "HEPATITIS_B", label: "Hepatitis B Vaccination" },
  { value: "FLU_VACCINE", label: "Flu Vaccination" },
  { value: "COVID_VACCINE", label: "COVID-19 Vaccination" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
  { value: "AUTO_INSURANCE", label: "Auto Insurance" },
  { value: "LIABILITY_INSURANCE", label: "Professional Liability Insurance" },
  { value: "SPECIALTY_CERT", label: "Specialty Certification" },
  { value: "CEU_CREDITS", label: "Continuing Education Credits" },
  { value: "OTHER", label: "Other" },
] as const;

export const CREDENTIAL_STATUS_LABELS: Record<CredentialStatus, string> = {
  PENDING: "Pending Review",
  VERIFIED: "Verified",
  EXPIRED: "Expired",
  REJECTED: "Rejected",
};

export const CREDENTIAL_STATUS_COLORS: Record<CredentialStatus, { text: string; bg: string }> = {
  PENDING: { text: "text-amber-600", bg: "bg-amber-50" },
  VERIFIED: { text: "text-emerald-600", bg: "bg-emerald-50" },
  EXPIRED: { text: "text-red-600", bg: "bg-red-50" },
  REJECTED: { text: "text-red-600", bg: "bg-red-50" },
};

// ─── Subscription ────────────────────────────────────────────────

export const SUBSCRIPTION_TIER_LABELS: Record<SubscriptionTier, string> = {
  BASIC: "Basic",
  PROFESSIONAL: "Professional",
  ENTERPRISE: "Enterprise",
};

// ─── Service Types (for CMS-1500) ───────────────────────────────

export const SERVICE_TYPES = [
  { value: "skilled_nursing", label: "Skilled Nursing Visit" },
  { value: "home_health_aide", label: "Home Health Aide Visit" },
  { value: "physical_therapy", label: "Physical Therapy" },
  { value: "occupational_therapy", label: "Occupational Therapy" },
  { value: "speech_therapy", label: "Speech Therapy" },
  { value: "medical_social_services", label: "Medical Social Services" },
  { value: "personal_care", label: "Personal Care" },
  { value: "companion_care", label: "Companion Care" },
  { value: "respite_care", label: "Respite Care" },
  { value: "hospice_visit", label: "Hospice Visit" },
  { value: "wound_care", label: "Wound Care" },
  { value: "medication_management", label: "Medication Management" },
  { value: "iv_therapy", label: "IV Therapy" },
  { value: "assessment", label: "Assessment / Evaluation" },
  { value: "other", label: "Other" },
] as const;

// ─── Common Place of Service Codes ──────────────────────────────

export const PLACE_OF_SERVICE_CODES = [
  { code: "12", label: "Home" },
  { code: "13", label: "Assisted Living Facility" },
  { code: "14", label: "Group Home" },
  { code: "31", label: "Skilled Nursing Facility" },
  { code: "32", label: "Nursing Facility" },
  { code: "33", label: "Custodial Care Facility" },
  { code: "34", label: "Hospice" },
  { code: "11", label: "Office" },
  { code: "99", label: "Other" },
] as const;
