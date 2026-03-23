"use client";

import { cn } from "@/lib/utils";
import { Check, Crown, Zap, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingCardProps {
  tier: "BASIC" | "PROFESSIONAL" | "ENTERPRISE";
  name: string;
  price: number;
  yearlyPrice?: number;
  description: string;
  features: string[];
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  onSelect?: () => void;
  ctaLabel?: string;
  isYearly?: boolean;
  variant?: "dark" | "light";
}

const tierIcons = {
  BASIC: <Zap size={24} />,
  PROFESSIONAL: <Crown size={24} />,
  ENTERPRISE: <Building2 size={24} />,
};

const tierGradients = {
  BASIC: "from-blue-400 to-cyan-400",
  PROFESSIONAL: "from-violet-400 to-purple-500",
  ENTERPRISE: "from-amber-400 to-orange-500",
};

export function PricingCard({
  tier,
  name,
  price,
  yearlyPrice,
  description,
  features,
  isPopular = false,
  isCurrentPlan = false,
  onSelect,
  ctaLabel,
  isYearly = false,
  variant = "dark",
}: PricingCardProps) {
  const displayPrice = isYearly && yearlyPrice != null ? yearlyPrice : price;
  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl p-6 transition-all duration-300",
        isDark && [
          "bg-white/[0.06] border border-white/[0.1] backdrop-blur-sm",
          isPopular && "scale-105 border-blue-500/60 shadow-[0_0_40px_rgba(59,130,246,0.15)]",
          !isPopular && "hover:bg-white/[0.08] hover:border-white/[0.15]",
        ],
        !isDark && [
          "bg-white border border-gray-200 shadow-sm",
          isPopular && "scale-105 border-blue-500 shadow-lg ring-1 ring-blue-500/20",
          isCurrentPlan && !isPopular && "border-emerald-500 ring-1 ring-emerald-500/20",
          !isPopular && !isCurrentPlan && "hover:shadow-md hover:border-gray-300",
        ]
      )}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div
          className={cn(
            "absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold tracking-wide",
            isDark
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
              : "bg-blue-600 text-white shadow-md"
          )}
        >
          Most Popular
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && !isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold tracking-wide bg-emerald-500 text-white shadow-md">
          Current Plan
        </div>
      )}

      {/* Tier Icon */}
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br",
          tierGradients[tier],
          "text-white shadow-lg"
        )}
      >
        {tierIcons[tier]}
      </div>

      {/* Plan Name */}
      <h3
        className={cn(
          "text-xl font-bold",
          isDark ? "text-white" : "text-gray-900"
        )}
      >
        {name}
      </h3>

      {/* Description */}
      <p
        className={cn(
          "text-sm mt-1 mb-5",
          isDark ? "text-slate-400" : "text-gray-500"
        )}
      >
        {description}
      </p>

      {/* Price */}
      <div className="mb-6">
        <span
          className={cn(
            "text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r",
            tierGradients[tier]
          )}
        >
          ${displayPrice.toFixed(2)}
        </span>
        <span
          className={cn(
            "text-sm ml-1",
            isDark ? "text-slate-500" : "text-gray-400"
          )}
        >
          / {isYearly ? "year" : "month"}
        </span>
        {isYearly && yearlyPrice != null && (
          <div className={cn("text-xs mt-1", isDark ? "text-emerald-400" : "text-emerald-600")}>
            Save ${((price * 12 - yearlyPrice) ).toFixed(2)}/year
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-8">
        {features.map((feature, i) => {
          const isHeader = feature.endsWith(":");
          return (
            <li key={i} className="flex items-start gap-2.5">
              {!isHeader && (
                <Check
                  size={16}
                  className={cn(
                    "mt-0.5 shrink-0",
                    isDark ? "text-emerald-400" : "text-emerald-500"
                  )}
                />
              )}
              <span
                className={cn(
                  "text-sm leading-snug",
                  isHeader
                    ? isDark
                      ? "text-slate-300 font-semibold"
                      : "text-gray-700 font-semibold"
                    : isDark
                      ? "text-slate-300"
                      : "text-gray-600"
                )}
              >
                {feature}
              </span>
            </li>
          );
        })}
      </ul>

      {/* CTA Button */}
      {ctaLabel && (
        <Button
          onClick={onSelect}
          size="lg"
          className={cn(
            "w-full rounded-xl font-semibold",
            isPopular
              ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
              : isCurrentPlan
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : isDark
                  ? "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                  : "bg-gray-900 hover:bg-gray-800 text-white"
          )}
        >
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
