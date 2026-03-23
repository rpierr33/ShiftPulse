"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import type { WorkerType, ProviderType, DayOfWeek } from "@prisma/client";

// ─── Helpers ────────────────────────────────────────────────────

function calculateWorkerCompleteness(profile: {
  workerType: WorkerType | null;
  yearsExperience: number | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  serviceRadiusMiles: number | null;
  specialties: string[];
  hourlyRate: number | null;
  availabilitySlots?: { id: string }[];
}): number {
  const fields = [
    profile.workerType !== null,
    profile.yearsExperience !== null,
    profile.bio !== null && profile.bio.length > 0,
    profile.city !== null && profile.city.length > 0,
    profile.state !== null && profile.state.length > 0,
    profile.zipCode !== null && profile.zipCode.length > 0,
    profile.serviceRadiusMiles !== null,
    profile.specialties.length > 0,
    profile.hourlyRate !== null,
    (profile.availabilitySlots?.length ?? 0) > 0,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

// ─── Get Onboarding Status ──────────────────────────────────────

export async function getOnboardingStatus() {
  const user = await getSessionUser();

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      onboardingCompleted: true,
      phone: true,
    },
  });

  if (!dbUser) {
    return { error: "User not found" };
  }

  if (dbUser.role === "WORKER") {
    const profile = await db.workerProfile.findUnique({
      where: { userId: user.id },
      include: { availabilitySlots: { select: { id: true } } },
    });

    return {
      role: "WORKER" as const,
      onboardingCompleted: dbUser.onboardingCompleted,
      steps: {
        step1: !!(profile?.workerType && profile.yearsExperience !== null),
        step2: !!(profile?.city && profile.state && profile.zipCode),
        step3: !!(profile?.specialties && profile.specialties.length > 0),
        step4: !!(profile?.availabilitySlots && profile.availabilitySlots.length > 0),
        step5: !!dbUser.onboardingCompleted,
      },
      profileCompleteness: profile ? calculateWorkerCompleteness(profile) : 0,
    };
  }

  if (dbUser.role === "COMPANY") {
    const companyProfile = await db.companyProfile.findUnique({
      where: { userId: user.id },
    });

    // Find the company through membership
    const membership = await db.companyMembership.findFirst({
      where: { userId: user.id },
      select: { companyId: true },
    });

    const company = membership
      ? await db.company.findUnique({ where: { id: membership.companyId } })
      : null;

    return {
      role: "COMPANY" as const,
      onboardingCompleted: dbUser.onboardingCompleted,
      steps: {
        step1: !!(companyProfile?.providerType && companyProfile.description),
        step2: !!(companyProfile?.city && companyProfile.state && companyProfile.zipCode),
        step3: !!(company?.servicesOffered && company.servicesOffered.length > 0),
        step4: !!dbUser.onboardingCompleted,
      },
    };
  }

  return { error: "Invalid role for onboarding" };
}

// ─── Worker Steps ───────────────────────────────────────────────

export async function completeWorkerStep1(data: {
  workerType: WorkerType;
  yearsExperience: number;
  bio: string;
}) {
  const user = await getSessionUser();

  const profile = await db.workerProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      workerType: data.workerType,
      yearsExperience: data.yearsExperience,
      bio: data.bio,
    },
    update: {
      workerType: data.workerType,
      yearsExperience: data.yearsExperience,
      bio: data.bio,
    },
    include: { availabilitySlots: { select: { id: true } } },
  });

  await db.workerProfile.update({
    where: { id: profile.id },
    data: { profileCompleteness: calculateWorkerCompleteness(profile) },
  });

  return { success: true };
}

export async function completeWorkerStep2(data: {
  city: string;
  state: string;
  zipCode: string;
  serviceRadiusMiles: number;
  phone: string;
}) {
  const user = await getSessionUser();

  // Update phone on the user record
  await db.user.update({
    where: { id: user.id },
    data: { phone: data.phone },
  });

  const profile = await db.workerProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      serviceRadiusMiles: data.serviceRadiusMiles,
    },
    update: {
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      serviceRadiusMiles: data.serviceRadiusMiles,
    },
    include: { availabilitySlots: { select: { id: true } } },
  });

  await db.workerProfile.update({
    where: { id: profile.id },
    data: { profileCompleteness: calculateWorkerCompleteness(profile) },
  });

  return { success: true };
}

export async function completeWorkerStep3(data: {
  specialties: string[];
  hourlyRate?: number;
}) {
  const user = await getSessionUser();

  const profile = await db.workerProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      specialties: data.specialties,
      hourlyRate: data.hourlyRate ?? null,
    },
    update: {
      specialties: data.specialties,
      hourlyRate: data.hourlyRate ?? null,
    },
    include: { availabilitySlots: { select: { id: true } } },
  });

  await db.workerProfile.update({
    where: { id: profile.id },
    data: { profileCompleteness: calculateWorkerCompleteness(profile) },
  });

  return { success: true };
}

export async function completeWorkerStep4(data: {
  availability: { dayOfWeek: DayOfWeek; startTime: string; endTime: string }[];
}) {
  const user = await getSessionUser();

  const profile = await db.workerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return { error: "Worker profile not found. Please complete step 1 first." };
  }

  // Delete existing recurring slots and replace
  await db.availabilitySlot.deleteMany({
    where: { workerProfileId: profile.id, isRecurring: true },
  });

  if (data.availability.length > 0) {
    await db.availabilitySlot.createMany({
      data: data.availability.map((slot) => ({
        workerProfileId: profile.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isRecurring: true,
      })),
    });
  }

  // Recalculate completeness
  const updatedProfile = await db.workerProfile.findUnique({
    where: { id: profile.id },
    include: { availabilitySlots: { select: { id: true } } },
  });

  if (updatedProfile) {
    await db.workerProfile.update({
      where: { id: profile.id },
      data: { profileCompleteness: calculateWorkerCompleteness(updatedProfile) },
    });
  }

  return { success: true };
}

export async function completeWorkerStep5() {
  const user = await getSessionUser();

  await db.workerProfile.update({
    where: { userId: user.id },
    data: { isMarketplaceVisible: true },
  });

  await db.user.update({
    where: { id: user.id },
    data: { onboardingCompleted: true },
  });

  return { success: true };
}

// ─── Provider Steps ─────────────────────────────────────────────

export async function completeProviderStep1(data: {
  providerType: ProviderType;
  description: string;
}) {
  const user = await getSessionUser();

  await db.companyProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      companyName: user.name,
      providerType: data.providerType,
      description: data.description,
    },
    update: {
      providerType: data.providerType,
      description: data.description,
    },
  });

  // Also update the Company record if user has one
  const membership = await db.companyMembership.findFirst({
    where: { userId: user.id },
    select: { companyId: true },
  });

  if (membership) {
    await db.company.update({
      where: { id: membership.companyId },
      data: {
        providerType: data.providerType,
        description: data.description,
      },
    });
  }

  return { success: true };
}

export async function completeProviderStep2(data: {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  website?: string;
  npiNumber?: string;
}) {
  const user = await getSessionUser();

  await db.companyProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      companyName: user.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      phone: data.phone,
      website: data.website ?? null,
      npiNumber: data.npiNumber ?? null,
    },
    update: {
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      phone: data.phone,
      website: data.website ?? null,
      npiNumber: data.npiNumber ?? null,
    },
  });

  // Also update the Company record
  const membership = await db.companyMembership.findFirst({
    where: { userId: user.id },
    select: { companyId: true },
  });

  if (membership) {
    await db.company.update({
      where: { id: membership.companyId },
      data: {
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        phone: data.phone,
      },
    });
  }

  // Update user phone
  await db.user.update({
    where: { id: user.id },
    data: { phone: data.phone },
  });

  return { success: true };
}

export async function completeProviderStep3(data: {
  servicesOffered: string[];
  serviceAreas: string[];
}) {
  const user = await getSessionUser();

  const membership = await db.companyMembership.findFirst({
    where: { userId: user.id },
    select: { companyId: true },
  });

  if (!membership) {
    return { error: "Company not found. Please contact support." };
  }

  await db.company.update({
    where: { id: membership.companyId },
    data: {
      servicesOffered: data.servicesOffered,
      serviceAreas: data.serviceAreas,
    },
  });

  return { success: true };
}

export async function completeProviderStep4() {
  const user = await getSessionUser();

  // Set marketplace visibility on the company
  const membership = await db.companyMembership.findFirst({
    where: { userId: user.id },
    select: { companyId: true },
  });

  if (membership) {
    await db.company.update({
      where: { id: membership.companyId },
      data: { isMarketplaceVisible: true },
    });
  }

  await db.user.update({
    where: { id: user.id },
    data: { onboardingCompleted: true },
  });

  return { success: true };
}

// ─── Skip ───────────────────────────────────────────────────────

export async function skipOnboarding() {
  const user = await getSessionUser();

  await db.user.update({
    where: { id: user.id },
    data: { onboardingCompleted: true },
  });

  return { success: true };
}
