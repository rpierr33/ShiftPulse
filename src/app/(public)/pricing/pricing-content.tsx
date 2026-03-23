"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingCard } from "@/components/shared/pricing-card";
import { cn } from "@/lib/utils";
import {
  getTierHighlights,
  FREE_TIER_HIGHLIGHTS,
  TIER_PRICES,
  TIER_NAMES,
  TIER_DESCRIPTIONS,
} from "@/lib/subscription";
import { Check, Users, Heart, UserPlus } from "lucide-react";

const faqs = [
  {
    q: "Can I change my plan later?",
    a: "Yes, upgrade or downgrade anytime. Changes take effect immediately and we prorate your billing.",
  },
  {
    q: "Is there a free trial?",
    a: "Professional plan includes a 14-day free trial. No credit card required to start.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit cards via Stripe. We also support ACH bank transfers for Enterprise plans.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, no long-term contracts. Cancel anytime and keep access until the end of your billing period.",
  },
  {
    q: "Do you offer discounts for annual billing?",
    a: "Yes, save 20% with annual plans. The discount is applied automatically when you switch to yearly billing.",
  },
  {
    q: "What happens when I downgrade?",
    a: "You keep access to your current tier's features until the end of the current billing period, then transition to the lower tier.",
  },
];

const tiers = ["BASIC", "PROFESSIONAL", "ENTERPRISE"] as const;

export function PricingPageContent() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const highlights = getTierHighlights();

  const yearlyMultiplier = 0.8; // 20% discount

  return (
    <div className="text-white">
      {/* Hero */}
      <section className="pt-20 pb-4 text-center px-4">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
          Simple, transparent{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
            pricing
          </span>
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mt-5 leading-relaxed">
          Choose the plan that fits your healthcare organization. No hidden fees,
          no surprises. Upgrade or downgrade anytime.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="flex items-center justify-center gap-3 mt-10">
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              !isYearly ? "text-white" : "text-slate-500"
            )}
          >
            Monthly
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={cn(
              "relative w-14 h-7 rounded-full transition-colors duration-300",
              isYearly ? "bg-blue-600" : "bg-slate-700"
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300",
                isYearly ? "translate-x-7" : "translate-x-0.5"
              )}
            />
          </button>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              isYearly ? "text-white" : "text-slate-500"
            )}
          >
            Yearly
          </span>
          {isYearly && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
              Save 20%
            </span>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Free Tier */}
        <div className="mb-8 max-w-3xl mx-auto">
          <div className="rounded-2xl bg-white/[0.06] border border-white/[0.1] backdrop-blur-sm p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg">
                    <Heart size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Free</h3>
                  <span className="text-3xl font-extrabold text-emerald-400">$0</span>
                  <span className="text-slate-500 text-sm">forever</span>
                </div>
                <p className="text-slate-400 text-sm">For workers, families, and companies getting started</p>
              </div>
              <Link href="/signup">
                <Button size="lg" className="bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl font-semibold">
                  Get Started
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
            <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {FREE_TIER_HIGHLIGHTS.map((feature, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Paid Tiers — for companies */}
        <p className="text-center text-sm text-slate-500 mb-6">Paid plans for healthcare organizations</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 lg:gap-6 items-start">
          {tiers.map((tier) => {
            const monthlyPrice = TIER_PRICES[tier];
            const yearlyTotal = parseFloat(
              (monthlyPrice * 12 * yearlyMultiplier).toFixed(2)
            );

            const ctaLabels = {
              BASIC: "Get Started",
              PROFESSIONAL: "Start Free Trial",
              ENTERPRISE: "Contact Sales",
            };

            return (
              <PricingCard
                key={tier}
                tier={tier}
                name={TIER_NAMES[tier]}
                price={monthlyPrice}
                yearlyPrice={yearlyTotal}
                description={TIER_DESCRIPTIONS[tier]}
                features={highlights[tier]}
                isPopular={tier === "PROFESSIONAL"}
                isYearly={isYearly}
                ctaLabel={ctaLabels[tier]}
                variant="dark"
                onSelect={() => {
                  if (tier === "ENTERPRISE") {
                    window.location.href = "mailto:sales@carecircle.com";
                  } else {
                    window.location.href = "/signup?role=COMPANY";
                  }
                }}
              />
            );
          })}
        </div>

        {/* Revenue note */}
        <p className="text-center text-xs text-slate-600 mt-8 max-w-xl mx-auto">
          Workers and families use CareCircle for free. A small service fee applies to bookings made through the platform.
        </p>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.03] transition-colors"
              >
                <span className="font-medium text-slate-200">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={cn(
                    "text-slate-500 transition-transform duration-200 shrink-0 ml-4",
                    openFaq === i && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  openFaq === i ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <p className="px-6 pb-4 text-sm text-slate-400 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="border-t border-white/5 py-20 text-center px-4">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Ready to streamline your workforce?
        </h2>
        <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
          Join healthcare providers across Florida who trust CareCircle to manage
          their nursing teams.
        </p>
        <Link href="/signup">
          <Button
            size="xl"
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
          >
            Get Started Free
            <ArrowRight size={18} />
          </Button>
        </Link>
      </section>
    </div>
  );
}
