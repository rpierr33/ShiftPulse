"use client";

import Link from "next/link";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Feature } from "@/lib/subscription";
import { FEATURE_LABELS, FEATURE_TIER_REQUIREMENT, TIER_NAMES, TIER_PRICES } from "@/lib/subscription";

interface FeatureGateProps {
  feature: Feature;
  currentTier: "BASIC" | "PROFESSIONAL" | "ENTERPRISE";
  children: React.ReactNode;
}

export function FeatureGate({ feature, currentTier, children }: FeatureGateProps) {
  const requiredTier = FEATURE_TIER_REQUIREMENT[feature];
  const tierLevel = { BASIC: 1, PROFESSIONAL: 2, ENTERPRISE: 3 };

  if (tierLevel[currentTier] >= tierLevel[requiredTier]) {
    return <>{children}</>;
  }

  return <UpgradePrompt feature={feature} requiredTier={requiredTier} />;
}

interface UpgradePromptProps {
  feature: Feature;
  requiredTier: "BASIC" | "PROFESSIONAL" | "ENTERPRISE";
}

export function UpgradePrompt({ feature, requiredTier }: UpgradePromptProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="text-blue-500" size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Upgrade to {TIER_NAMES[requiredTier]}
        </h2>
        <p className="text-gray-500 mb-2">
          <span className="font-medium text-gray-700">{FEATURE_LABELS[feature]}</span> is available
          on the {TIER_NAMES[requiredTier]} plan.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Starting at ${TIER_PRICES[requiredTier]}/month
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/pricing">
            <Button variant="outline">
              View Plans
            </Button>
          </Link>
          <Link href="/company/billing">
            <Button>
              <Sparkles size={16} />
              Upgrade Now
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Inline badge for nav items or buttons that indicate tier requirement
export function TierBadge({ tier }: { tier: "PROFESSIONAL" | "ENTERPRISE" }) {
  const colors = tier === "PROFESSIONAL"
    ? "bg-blue-50 text-blue-600 border-blue-100"
    : "bg-purple-50 text-purple-600 border-purple-100";

  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${colors} uppercase`}>
      {tier === "PROFESSIONAL" ? "Pro" : "Ent"}
    </span>
  );
}
