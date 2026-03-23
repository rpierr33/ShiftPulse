import type { SubscriptionTier } from "@prisma/client";
import { db } from "./db";

// ─── Tier Definitions ────────────────────────────────────────────

export type Feature =
  | "marketplace_discovery"
  | "basic_scheduling"
  | "worker_profiles"
  | "messaging"
  | "join_code"
  | "time_tracking"
  | "evv_geofencing"
  | "credential_management"
  | "compliance_dashboard"
  | "shift_marketplace"
  | "reports_basic"
  | "reports_advanced"
  | "payroll_export"
  | "service_logs"
  | "cms_1500_forms"
  | "payroll_integration"
  | "auto_fill_scheduling"
  | "multi_location"
  | "florida_compliance"
  | "open_shift_marketplace"
  | "broadcast_messaging"
  | "advanced_analytics";

export const TIER_PRICES: Record<SubscriptionTier, number> = {
  BASIC: 19.99,
  PROFESSIONAL: 99.99,
  ENTERPRISE: 199.99,
};

export const TIER_NAMES: Record<SubscriptionTier, string> = {
  BASIC: "Basic",
  PROFESSIONAL: "Professional",
  ENTERPRISE: "Enterprise",
};

export const TIER_DESCRIPTIONS: Record<SubscriptionTier, string> = {
  BASIC: "Full marketplace access with scheduling and messaging",
  PROFESSIONAL: "Workforce management with compliance and reporting",
  ENTERPRISE: "Everything — claims, payroll integration, and analytics",
};

const TIER_FEATURES: Record<SubscriptionTier, Feature[]> = {
  BASIC: [
    "marketplace_discovery",
    "basic_scheduling",
    "worker_profiles",
    "messaging",
    "join_code",
    "reports_basic",
  ],
  PROFESSIONAL: [
    // All of Basic
    "marketplace_discovery",
    "basic_scheduling",
    "worker_profiles",
    "messaging",
    "join_code",
    "reports_basic",
    // Plus Professional features
    "time_tracking",
    "evv_geofencing",
    "credential_management",
    "compliance_dashboard",
    "shift_marketplace",
    "open_shift_marketplace",
    "reports_advanced",
    "payroll_export",
    "florida_compliance",
    "multi_location",
  ],
  ENTERPRISE: [
    // All of Professional
    "marketplace_discovery",
    "basic_scheduling",
    "worker_profiles",
    "messaging",
    "join_code",
    "reports_basic",
    "time_tracking",
    "evv_geofencing",
    "credential_management",
    "compliance_dashboard",
    "shift_marketplace",
    "open_shift_marketplace",
    "reports_advanced",
    "payroll_export",
    "florida_compliance",
    "multi_location",
    // Plus Enterprise features
    "service_logs",
    "cms_1500_forms",
    "payroll_integration",
    "auto_fill_scheduling",
    "broadcast_messaging",
    "advanced_analytics",
  ],
};

export const FEATURE_LABELS: Record<Feature, string> = {
  marketplace_discovery: "Marketplace Discovery",
  basic_scheduling: "Basic Scheduling",
  worker_profiles: "Worker Profiles",
  messaging: "Direct Messaging",
  join_code: "Join Code Invites",
  time_tracking: "Time Tracking & Clock In/Out",
  evv_geofencing: "EVV & Geofencing",
  credential_management: "Credential Management",
  compliance_dashboard: "Compliance Dashboard",
  shift_marketplace: "Shift Marketplace",
  reports_basic: "Basic Reports",
  reports_advanced: "Advanced Reports & Analytics",
  payroll_export: "Payroll Export (CSV)",
  service_logs: "Service Documentation",
  cms_1500_forms: "CMS-1500 Claim Forms",
  payroll_integration: "Payroll Integration",
  auto_fill_scheduling: "Auto-Fill Scheduling",
  multi_location: "Multi-Location Management",
  florida_compliance: "Florida Compliance Rules",
  open_shift_marketplace: "Open Shift Marketplace",
  broadcast_messaging: "Broadcast Messaging",
  advanced_analytics: "Advanced Analytics Dashboard",
};

export const FEATURE_TIER_REQUIREMENT: Record<Feature, SubscriptionTier> = {
  marketplace_discovery: "BASIC",
  basic_scheduling: "BASIC",
  worker_profiles: "BASIC",
  messaging: "BASIC",
  join_code: "BASIC",
  reports_basic: "BASIC",
  time_tracking: "PROFESSIONAL",
  evv_geofencing: "PROFESSIONAL",
  credential_management: "PROFESSIONAL",
  compliance_dashboard: "PROFESSIONAL",
  shift_marketplace: "PROFESSIONAL",
  open_shift_marketplace: "PROFESSIONAL",
  reports_advanced: "PROFESSIONAL",
  payroll_export: "PROFESSIONAL",
  florida_compliance: "PROFESSIONAL",
  multi_location: "PROFESSIONAL",
  service_logs: "ENTERPRISE",
  cms_1500_forms: "ENTERPRISE",
  payroll_integration: "ENTERPRISE",
  auto_fill_scheduling: "ENTERPRISE",
  broadcast_messaging: "ENTERPRISE",
  advanced_analytics: "ENTERPRISE",
};

// ─── Helpers ─────────────────────────────────────────────────────

export function tierHasFeature(tier: SubscriptionTier, feature: Feature): boolean {
  return TIER_FEATURES[tier].includes(feature);
}

export function getFeaturesForTier(tier: SubscriptionTier): Feature[] {
  return TIER_FEATURES[tier];
}

export function getRequiredTier(feature: Feature): SubscriptionTier {
  return FEATURE_TIER_REQUIREMENT[feature];
}

export function getTierLevel(tier: SubscriptionTier): number {
  const levels: Record<SubscriptionTier, number> = {
    BASIC: 1,
    PROFESSIONAL: 2,
    ENTERPRISE: 3,
  };
  return levels[tier];
}

export function isHigherTier(tier: SubscriptionTier, than: SubscriptionTier): boolean {
  return getTierLevel(tier) > getTierLevel(than);
}

// ─── Database Queries ────────────────────────────────────────────

export async function getCompanySubscription(companyId: string) {
  const subscription = await db.subscription.findUnique({
    where: { companyId },
  });

  // Default to BASIC if no subscription exists
  if (!subscription) {
    return {
      tier: "BASIC" as SubscriptionTier,
      status: "active",
      isActive: true,
    };
  }

  return {
    ...subscription,
    isActive: subscription.status === "active" || subscription.status === "trialing",
  };
}

export async function checkFeatureAccess(companyId: string, feature: Feature): Promise<{
  hasAccess: boolean;
  currentTier: SubscriptionTier;
  requiredTier: SubscriptionTier;
}> {
  const subscription = await getCompanySubscription(companyId);
  const requiredTier = getRequiredTier(feature);
  const hasAccess = tierHasFeature(subscription.tier, feature);

  return {
    hasAccess,
    currentTier: subscription.tier,
    requiredTier,
  };
}

export async function requireFeature(companyId: string, feature: Feature): Promise<void> {
  const { hasAccess, currentTier, requiredTier } = await checkFeatureAccess(companyId, feature);

  if (!hasAccess) {
    throw new Error(
      `This feature requires the ${TIER_NAMES[requiredTier]} plan. You are currently on the ${TIER_NAMES[currentTier]} plan.`
    );
  }
}

// ─── Tier Comparison Data (for pricing page) ────────────────────

export function getTierComparison() {
  const tiers: SubscriptionTier[] = ["BASIC", "PROFESSIONAL", "ENTERPRISE"];

  return tiers.map((tier) => ({
    tier,
    name: TIER_NAMES[tier],
    price: TIER_PRICES[tier],
    description: TIER_DESCRIPTIONS[tier],
    features: TIER_FEATURES[tier].map((f) => ({
      key: f,
      label: FEATURE_LABELS[f],
    })),
  }));
}

// Unique features per tier (what's new at each level)
export const FREE_TIER_HIGHLIGHTS = [
  "Create your profile & get vetted",
  "Browse the marketplace",
  "Book workers directly (families)",
  "Upload credentials & build your score",
  "Direct messaging",
  "Companies: limited marketplace view (no contact info)",
];

export function getTierHighlights() {
  return {
    BASIC: [
      "Full marketplace access with contact info",
      "Basic shift scheduling",
      "Direct messaging with workers",
      "Worker profiles & availability",
      "Join code invitations",
      "Basic reporting",
    ],
    PROFESSIONAL: [
      "Everything in Basic, plus:",
      "GPS clock in/out with EVV verification",
      "Credential management & expiry tracking",
      "Open shift marketplace posting",
      "Florida labor law compliance",
      "Advanced reports & analytics",
      "Payroll export (CSV)",
      "Multi-location management",
    ],
    ENTERPRISE: [
      "Everything in Professional, plus:",
      "CMS-1500 claim form generation",
      "Service documentation & logs",
      "Payroll integration (Gusto/Check)",
      "AI-powered auto-fill scheduling",
      "Broadcast messaging",
      "Advanced analytics dashboard",
      "Priority support",
    ],
  };
}
