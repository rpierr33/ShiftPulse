"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PricingCard } from "@/components/shared/pricing-card";
import {
  createSubscription,
  cancelSubscription,
  reactivateSubscription,
} from "@/actions/billing";
import {
  getTierHighlights,
  TIER_PRICES,
  TIER_NAMES,
  TIER_DESCRIPTIONS,
} from "@/lib/subscription";
import type { SubscriptionTier } from "@prisma/client";

const tiers: SubscriptionTier[] = ["BASIC", "PROFESSIONAL", "ENTERPRISE"];

interface BillingActionsProps {
  currentTier: SubscriptionTier;
  cancelAtPeriodEnd: boolean;
  status?: string;
  showCancelOnly?: boolean;
}

function getTierLevel(tier: SubscriptionTier): number {
  const levels: Record<SubscriptionTier, number> = {
    BASIC: 1,
    PROFESSIONAL: 2,
    ENTERPRISE: 3,
  };
  return levels[tier];
}

export function BillingActions({
  currentTier,
  cancelAtPeriodEnd,
  showCancelOnly = false,
}: BillingActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const highlights = getTierHighlights();

  async function handleSelectTier(tier: SubscriptionTier) {
    setError("");
    startTransition(async () => {
      const result = await createSubscription(tier);
      if (!result.success) {
        setError(result.error ?? "Failed to update subscription");
      } else {
        router.refresh();
      }
    });
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel your subscription? You will keep access until the end of your billing period.")) {
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await cancelSubscription();
      if (!result.success) {
        setError(result.error ?? "Failed to cancel subscription");
      } else {
        router.refresh();
      }
    });
  }

  async function handleReactivate() {
    setError("");
    startTransition(async () => {
      const result = await reactivateSubscription();
      if (!result.success) {
        setError(result.error ?? "Failed to reactivate subscription");
      } else {
        router.refresh();
      }
    });
  }

  if (showCancelOnly) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-600">
            Cancel your subscription. You will retain access to your current
            plan until the end of the billing period.
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={handleCancel}
          loading={isPending}
        >
          Cancel Subscription
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
          {error}
        </div>
      )}

      {cancelAtPeriodEnd && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <p className="text-sm text-amber-800 flex-1">
            Your subscription is set to cancel at the end of the billing period.
            Reactivate to keep your current plan.
          </p>
          <Button
            variant="warning"
            onClick={handleReactivate}
            loading={isPending}
          >
            Reactivate
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {tiers.map((tier) => {
          const isCurrentPlan = tier === currentTier;
          const currentLevel = getTierLevel(currentTier);
          const tierLevel = getTierLevel(tier);
          const isUpgrade = tierLevel > currentLevel;
          const isDowngrade = tierLevel < currentLevel;

          let ctaLabel: string | undefined;
          if (isCurrentPlan) {
            ctaLabel = "Current Plan";
          } else if (isUpgrade) {
            ctaLabel = "Upgrade";
          } else if (isDowngrade) {
            ctaLabel = "Downgrade";
          }

          return (
            <PricingCard
              key={tier}
              tier={tier}
              name={TIER_NAMES[tier]}
              price={TIER_PRICES[tier]}
              description={TIER_DESCRIPTIONS[tier]}
              features={highlights[tier]}
              isCurrentPlan={isCurrentPlan}
              isPopular={tier === "PROFESSIONAL"}
              ctaLabel={ctaLabel}
              variant="light"
              onSelect={
                isCurrentPlan ? undefined : () => handleSelectTier(tier)
              }
            />
          );
        })}
      </div>
    </div>
  );
}
