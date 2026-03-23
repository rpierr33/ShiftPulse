"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-utils";
import { TIER_PRICES } from "@/lib/subscription";
import type { SubscriptionTier } from "@prisma/client";
import { getCompanyForUser } from "@/actions/company";

// ─── Get Current Company Subscription ────────────────────────────

export async function getSubscriptionStatus() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) {
    return { success: false as const, error: "No company found" };
  }

  const subscription = await db.subscription.findUnique({
    where: { companyId: company.id },
  });

  if (!subscription) {
    return {
      success: true as const,
      data: {
        tier: "BASIC" as SubscriptionTier,
        status: "active",
        price: TIER_PRICES.BASIC,
        cancelAtPeriodEnd: false,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        trialEndsAt: null,
        companyId: company.id,
      },
    };
  }

  return {
    success: true as const,
    data: {
      ...subscription,
      price: TIER_PRICES[subscription.tier],
    },
  };
}

// ─── Create / Update Subscription ────────────────────────────────

export async function createSubscription(
  tier: "BASIC" | "PROFESSIONAL" | "ENTERPRISE"
) {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) {
    return { success: false as const, error: "No company found" };
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const existing = await db.subscription.findUnique({
    where: { companyId: company.id },
  });

  const previousTier = existing?.tier ?? "BASIC";

  const subscription = await db.subscription.upsert({
    where: { companyId: company.id },
    create: {
      companyId: company.id,
      tier,
      status: tier === "PROFESSIONAL" ? "trialing" : "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      trialEndsAt:
        tier === "PROFESSIONAL"
          ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
          : null,
      cancelAtPeriodEnd: false,
    },
    update: {
      tier,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
    },
  });

  // Create audit log entry
  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: company.id,
      action: "SUBSCRIPTION_CHANGED",
      entityType: "Subscription",
      entityId: subscription.id,
      before: { tier: previousTier },
      after: { tier },
      metadata: { price: TIER_PRICES[tier] },
    },
  });

  return { success: true as const, data: subscription };
}

// ─── Cancel Subscription ─────────────────────────────────────────

export async function cancelSubscription() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) {
    return { success: false as const, error: "No company found" };
  }

  const subscription = await db.subscription.findUnique({
    where: { companyId: company.id },
  });

  if (!subscription) {
    return { success: false as const, error: "No active subscription" };
  }

  await db.subscription.update({
    where: { companyId: company.id },
    data: { cancelAtPeriodEnd: true },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: company.id,
      action: "SUBSCRIPTION_CHANGED",
      entityType: "Subscription",
      entityId: subscription.id,
      before: { cancelAtPeriodEnd: false },
      after: { cancelAtPeriodEnd: true },
      metadata: { action: "cancel" },
    },
  });

  return { success: true as const };
}

// ─── Reactivate Subscription ─────────────────────────────────────

export async function reactivateSubscription() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) {
    return { success: false as const, error: "No company found" };
  }

  const subscription = await db.subscription.findUnique({
    where: { companyId: company.id },
  });

  if (!subscription) {
    return { success: false as const, error: "No subscription found" };
  }

  await db.subscription.update({
    where: { companyId: company.id },
    data: { cancelAtPeriodEnd: false },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: company.id,
      action: "SUBSCRIPTION_CHANGED",
      entityType: "Subscription",
      entityId: subscription.id,
      before: { cancelAtPeriodEnd: true },
      after: { cancelAtPeriodEnd: false },
      metadata: { action: "reactivate" },
    },
  });

  return { success: true as const };
}

// ─── Admin: Subscription Stats ───────────────────────────────────

export async function getAdminSubscriptionStats() {
  await requireRole("ADMIN");

  const [basicCount, proCount, entCount, allSubscriptions] = await Promise.all([
    db.subscription.count({ where: { tier: "BASIC", status: { in: ["active", "trialing"] } } }),
    db.subscription.count({ where: { tier: "PROFESSIONAL", status: { in: ["active", "trialing"] } } }),
    db.subscription.count({ where: { tier: "ENTERPRISE", status: { in: ["active", "trialing"] } } }),
    db.subscription.findMany({
      where: { status: { in: ["active", "trialing"] } },
      include: {
        company: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const mrr =
    basicCount * TIER_PRICES.BASIC +
    proCount * TIER_PRICES.PROFESSIONAL +
    entCount * TIER_PRICES.ENTERPRISE;

  return {
    success: true as const,
    data: {
      totalSubscribers: basicCount + proCount + entCount,
      mrr: parseFloat(mrr.toFixed(2)),
      byTier: {
        BASIC: basicCount,
        PROFESSIONAL: proCount,
        ENTERPRISE: entCount,
      },
      subscriptions: allSubscriptions,
    },
  };
}
