"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { getSessionUser } from "@/lib/auth-utils";
import { calculateWorkerScore, calculateProviderScore } from "@/lib/scoring";
import { revalidatePath } from "next/cache";
import type { WorkerType, ProviderType } from "@prisma/client";

// ─── Types ──────────────────────────────────────────────────────

type WorkerFilters = {
  workerType?: WorkerType[];
  specialties?: string[];
  city?: string;
  state?: string;
  zipCode?: string;
  minScore?: number;
  credentialsVerified?: boolean;
  sortBy?: "score" | "rating" | "experience";
  page?: number;
  limit?: number;
};

type ProviderFilters = {
  providerType?: ProviderType[];
  city?: string;
  state?: string;
  servicesOffered?: string[];
  minScore?: number;
  sortBy?: "score" | "rating" | "workers";
  page?: number;
  limit?: number;
};

// ─── Search Workers ─────────────────────────────────────────────

export async function searchWorkers(filters: WorkerFilters = {}) {
  const {
    workerType,
    specialties,
    city,
    state,
    zipCode,
    minScore,
    credentialsVerified: _credentialsVerified,
    sortBy = "score",
    page = 1,
    limit = 24,
  } = filters;

  const skip = (page - 1) * limit;

  // Build dynamic where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    isMarketplaceVisible: true,
    isValidated: true,
    user: { isActive: true, deletedAt: null },
  };

  if (workerType && workerType.length > 0) {
    where.workerType = { in: workerType };
  }

  if (specialties && specialties.length > 0) {
    where.specialties = { hasSome: specialties };
  }

  if (city) {
    where.city = { contains: city, mode: "insensitive" };
  }

  if (state) {
    where.state = { equals: state, mode: "insensitive" };
  }

  if (zipCode) {
    where.zipCode = zipCode;
  }

  if (minScore !== undefined && minScore > 0) {
    where.profileCompleteness = { gte: minScore };
  }

  const workers = await db.workerProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          reviewsReceived: {
            select: { rating: true },
          },
        },
      },
      credentials: {
        select: {
          id: true,
          type: true,
          status: true,
          expiryDate: true,
        },
      },
      availabilitySlots: {
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
    },
    skip,
    take: limit,
    orderBy:
      sortBy === "experience"
        ? { yearsExperience: "desc" }
        : { profileCompleteness: "desc" },
  });

  // Compute derived data for each worker
  const results = workers.map((w) => {
    const reviews = w.user.reviewsReceived;
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : null;

    const verifiedCredentials = w.credentials.filter(
      (c) => c.status === "VERIFIED"
    );

    // Calculate a live score
    const score = calculateWorkerScore({
      profileComplete: w.profileCompleteness >= 80,
      workerTypeSet: w.workerType !== null,
      hasVerifiedCredentials: verifiedCredentials.length,
      totalCredentials: w.credentials.length,
      yearsExperience: w.yearsExperience,
      hasAvailability: w.availabilitySlots.length > 0,
      averageRating,
      totalReviews,
      shiftsCompleted: 0, // Would need assignment query in production
      noShowCount: 0,
      onTimePercentage: null,
      hasSpecialties: w.specialties.length > 0,
      hasBio: !!w.bio,
      hasPhoto: !!w.user.avatarUrl,
    });

    return {
      id: w.id,
      userId: w.user.id,
      name: w.user.name,
      avatarUrl: w.user.avatarUrl,
      workerType: w.workerType,
      specialties: w.specialties,
      bio: w.bio,
      yearsExperience: w.yearsExperience,
      city: w.city,
      state: w.state,
      hourlyRate: w.hourlyRate,
      score,
      averageRating: averageRating ? parseFloat(averageRating.toFixed(1)) : null,
      totalReviews,
      verifiedCredentialsCount: verifiedCredentials.length,
      totalCredentials: w.credentials.length,
      isAvailable: w.isAvailable,
      isFeatured: w.isFeatured,
    };
  });

  // Sort featured workers first, then by score or rating
  if (sortBy === "score") {
    results.sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return b.score - a.score;
    });
  } else if (sortBy === "rating") {
    results.sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return (b.averageRating ?? 0) - (a.averageRating ?? 0);
    });
  }

  // If we filter by minScore after calculation (more accurate than profileCompleteness)
  const filtered =
    minScore && minScore > 0
      ? results.filter((r) => r.score >= minScore)
      : results;

  // Get total for pagination
  const total = await db.workerProfile.count({ where });

  return { workers: filtered, total, page, limit };
}

// ─── Search Providers ───────────────────────────────────────────

export async function searchProviders(filters: ProviderFilters = {}) {
  const {
    providerType,
    city,
    state,
    servicesOffered,
    minScore,
    sortBy = "score",
    page = 1,
    limit = 24,
  } = filters;

  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    isMarketplaceVisible: true,
    isActive: true,
    deletedAt: null,
  };

  if (providerType && providerType.length > 0) {
    where.providerType = { in: providerType };
  }

  if (city) {
    where.city = { contains: city, mode: "insensitive" };
  }

  if (state) {
    where.state = { equals: state, mode: "insensitive" };
  }

  if (servicesOffered && servicesOffered.length > 0) {
    where.servicesOffered = { hasSome: servicesOffered };
  }

  const companies = await db.company.findMany({
    where,
    include: {
      reviews: {
        select: { rating: true },
      },
      memberships: {
        where: { status: "APPROVED", deletedAt: null },
        select: { id: true },
      },
      _count: {
        select: {
          shifts: { where: { status: "COMPLETED" } },
        },
      },
    },
    skip,
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  const results = companies.map((c) => {
    const totalReviews = c.reviews.length;
    const averageRating =
      totalReviews > 0
        ? c.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : null;

    const yearsActive = Math.max(
      1,
      Math.floor(
        (Date.now() - c.createdAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      )
    );

    const score = calculateProviderScore({
      profileComplete: !!(c.name && c.city && c.state),
      hasDescription: !!c.description,
      hasLogo: !!c.logoUrl,
      hasNpi: false, // NPI is on CompanyProfile, not Company
      hasWebsite: false,
      yearsActive,
      averageRating,
      totalReviews,
      totalWorkersEmployed: c.memberships.length,
      avgPayRate: null,
      shiftsCompleted: c._count.shifts,
      onTimePayment: false,
      servicesOfferedCount: c.servicesOffered.length,
      responseRate: null,
    });

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      providerType: c.providerType,
      description: c.description,
      logoUrl: c.logoUrl,
      servicesOffered: c.servicesOffered,
      serviceAreas: c.serviceAreas,
      city: c.city,
      state: c.state,
      score,
      averageRating: averageRating ? parseFloat(averageRating.toFixed(1)) : null,
      totalReviews,
      activeWorkers: c.memberships.length,
      shiftsCompleted: c._count.shifts,
    };
  });

  // Sort
  if (sortBy === "score") {
    results.sort((a, b) => b.score - a.score);
  } else if (sortBy === "rating") {
    results.sort(
      (a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0)
    );
  } else if (sortBy === "workers") {
    results.sort((a, b) => b.activeWorkers - a.activeWorkers);
  }

  const filtered =
    minScore && minScore > 0
      ? results.filter((r) => r.score >= minScore)
      : results;

  const total = await db.company.count({ where });

  return { providers: filtered, total, page, limit };
}

// ─── Worker Marketplace Profile ─────────────────────────────────

export async function getWorkerMarketplaceProfile(userId: string) {
  const profile = await db.workerProfile.findFirst({
    where: {
      userId,
      isMarketplaceVisible: true,
      user: { isActive: true, deletedAt: null },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
          reviewsReceived: {
            include: {
              reviewer: {
                select: { name: true, avatarUrl: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      },
      credentials: {
        where: { status: { in: ["VERIFIED", "PENDING"] } },
        select: {
          id: true,
          type: true,
          name: true,
          status: true,
          expiryDate: true,
        },
        orderBy: { status: "asc" },
      },
      availabilitySlots: {
        where: { isUnavailable: false },
        select: {
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          isRecurring: true,
        },
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });

  if (!profile) return null;

  const reviews = profile.user.reviewsReceived;
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : null;

  const verifiedCredentials = profile.credentials.filter(
    (c) => c.status === "VERIFIED"
  );

  // Count completed assignments
  const completedAssignments = await db.assignment.count({
    where: {
      workerProfileId: profile.id,
      status: "COMPLETED",
    },
  });

  const score = calculateWorkerScore({
    profileComplete: profile.profileCompleteness >= 80,
    workerTypeSet: profile.workerType !== null,
    hasVerifiedCredentials: verifiedCredentials.length,
    totalCredentials: profile.credentials.length,
    yearsExperience: profile.yearsExperience,
    hasAvailability: profile.availabilitySlots.length > 0,
    averageRating,
    totalReviews,
    shiftsCompleted: completedAssignments,
    noShowCount: 0,
    onTimePercentage: null,
    hasSpecialties: profile.specialties.length > 0,
    hasBio: !!profile.bio,
    hasPhoto: !!profile.user.avatarUrl,
  });

  return {
    id: profile.id,
    userId: profile.user.id,
    name: profile.user.name,
    avatarUrl: profile.user.avatarUrl,
    memberSince: profile.user.createdAt,
    workerType: profile.workerType,
    specialties: profile.specialties,
    certifications: profile.certifications,
    bio: profile.bio,
    hourlyRate: profile.hourlyRate,
    yearsExperience: profile.yearsExperience,
    city: profile.city,
    state: profile.state,
    serviceRadiusMiles: profile.serviceRadiusMiles,
    isAvailable: profile.isAvailable,
    score,
    averageRating: averageRating ? parseFloat(averageRating.toFixed(1)) : null,
    totalReviews,
    shiftsCompleted: completedAssignments,
    verifiedCredentialsCount: verifiedCredentials.length,
    credentials: profile.credentials.map((c) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      status: c.status,
      expiryDate: c.expiryDate,
    })),
    availability: profile.availabilitySlots,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      content: r.content,
      isVerified: r.isVerified,
      createdAt: r.createdAt,
      reviewerName: r.reviewer.name,
      reviewerAvatar: r.reviewer.avatarUrl,
    })),
  };
}

// ─── Provider Marketplace Profile ───────────────────────────────

export async function getProviderMarketplaceProfile(companyId: string) {
  const company = await db.company.findFirst({
    where: {
      id: companyId,
      isMarketplaceVisible: true,
      isActive: true,
      deletedAt: null,
    },
    include: {
      reviews: {
        include: {
          reviewer: {
            select: { name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      memberships: {
        where: { status: "APPROVED", deletedAt: null },
        select: { id: true },
      },
      _count: {
        select: {
          shifts: { where: { status: "COMPLETED" } },
        },
      },
    },
  });

  if (!company) return null;

  const totalReviews = company.reviews.length;
  const averageRating =
    totalReviews > 0
      ? company.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : null;

  const yearsActive = Math.max(
    1,
    Math.floor(
      (Date.now() - company.createdAt.getTime()) /
        (365.25 * 24 * 60 * 60 * 1000)
    )
  );

  const score = calculateProviderScore({
    profileComplete: !!(company.name && company.city && company.state),
    hasDescription: !!company.description,
    hasLogo: !!company.logoUrl,
    hasNpi: false,
    hasWebsite: false,
    yearsActive,
    averageRating,
    totalReviews,
    totalWorkersEmployed: company.memberships.length,
    avgPayRate: null,
    shiftsCompleted: company._count.shifts,
    onTimePayment: false,
    servicesOfferedCount: company.servicesOffered.length,
    responseRate: null,
  });

  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    providerType: company.providerType,
    description: company.description,
    logoUrl: company.logoUrl,
    servicesOffered: company.servicesOffered,
    serviceAreas: company.serviceAreas,
    city: company.city,
    state: company.state,
    createdAt: company.createdAt,
    score,
    averageRating: averageRating ? parseFloat(averageRating.toFixed(1)) : null,
    totalReviews,
    activeWorkers: company.memberships.length,
    shiftsCompleted: company._count.shifts,
    yearsActive,
    reviews: company.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      content: r.content,
      isVerified: r.isVerified,
      createdAt: r.createdAt,
      reviewerName: r.reviewer.name,
      reviewerAvatar: r.reviewer.avatarUrl,
    })),
  };
}

// ─── Submit Review ──────────────────────────────────────────────

export async function submitReview(data: {
  targetUserId?: string;
  targetCompanyId?: string;
  rating: number;
  title?: string;
  content?: string;
}) {
  const user = await getSessionUser();

  if (!data.targetUserId && !data.targetCompanyId) {
    return { error: "Must specify a target user or company" };
  }

  if (data.rating < 1 || data.rating > 5) {
    return { error: "Rating must be between 1 and 5" };
  }

  // Verify the reviewer has worked with the target
  if (data.targetCompanyId) {
    const membership = await db.companyMembership.findFirst({
      where: {
        userId: user.id,
        companyId: data.targetCompanyId,
        status: "APPROVED",
      },
    });
    if (!membership) {
      return { error: "You must have worked with this company to leave a review" };
    }
  }

  if (data.targetUserId) {
    // Check if reviewer's company has the target worker as a member
    const reviewerMemberships = await db.companyMembership.findMany({
      where: { userId: user.id, status: "APPROVED" },
      select: { companyId: true },
    });

    const workerMembership = await db.companyMembership.findFirst({
      where: {
        userId: data.targetUserId,
        companyId: { in: reviewerMemberships.map((m) => m.companyId) },
        status: "APPROVED",
      },
    });

    if (!workerMembership) {
      return { error: "You must have worked with this person to leave a review" };
    }
  }

  // Check for duplicate review
  const existing = await db.review.findFirst({
    where: {
      reviewerId: user.id,
      ...(data.targetUserId ? { targetUserId: data.targetUserId } : {}),
      ...(data.targetCompanyId
        ? { targetCompanyId: data.targetCompanyId }
        : {}),
    },
  });

  if (existing) {
    return { error: "You have already reviewed this entity" };
  }

  const review = await db.review.create({
    data: {
      reviewerId: user.id,
      targetUserId: data.targetUserId ?? null,
      targetCompanyId: data.targetCompanyId ?? null,
      rating: data.rating,
      title: data.title ?? null,
      content: data.content ?? null,
      isVerified: true, // They passed the working-together check
    },
  });

  revalidatePath("/marketplace");
  return { success: true, reviewId: review.id };
}

// ─── Request Connection ─────────────────────────────────────────

export async function requestConnection(companyId: string) {
  const user = await getSessionUser();

  // Check if already a member or has pending request
  const existing = await db.companyMembership.findUnique({
    where: {
      userId_companyId: { userId: user.id, companyId },
    },
  });

  if (existing) {
    if (existing.status === "APPROVED") {
      return { error: "You are already a member of this company" };
    }
    if (existing.status === "PENDING") {
      return { error: "You already have a pending request" };
    }
    if (existing.status === "REJECTED" || existing.status === "SUSPENDED") {
      return { error: "Your previous request was declined" };
    }
  }

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { autoApproveWorkers: true, name: true },
  });

  if (!company) {
    return { error: "Company not found" };
  }

  const membership = await db.companyMembership.create({
    data: {
      userId: user.id,
      companyId,
      status: company.autoApproveWorkers ? "APPROVED" : "PENDING",
      joinedAt: company.autoApproveWorkers ? new Date() : null,
    },
  });

  revalidatePath("/marketplace");
  revalidatePath("/worker/profile");

  return {
    success: true,
    status: membership.status,
    companyName: company.name,
  };
}

// ─── Calculate & Update Worker Score ────────────────────────────

export async function calculateAndUpdateWorkerScore(workerProfileId: string) {
  const profile = await db.workerProfile.findUnique({
    where: { id: workerProfileId },
    include: {
      user: {
        select: {
          avatarUrl: true,
          reviewsReceived: { select: { rating: true } },
        },
      },
      credentials: { select: { status: true } },
      availabilitySlots: { select: { id: true } },
    },
  });

  if (!profile) return { error: "Profile not found" };

  const reviews = profile.user.reviewsReceived;
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : null;

  const verifiedCount = profile.credentials.filter(
    (c) => c.status === "VERIFIED"
  ).length;

  const completedAssignments = await db.assignment.count({
    where: { workerProfileId: profile.id, status: "COMPLETED" },
  });

  const noShows = await db.assignment.count({
    where: { workerProfileId: profile.id, status: "NO_SHOW" },
  });

  const score = calculateWorkerScore({
    profileComplete: profile.profileCompleteness >= 80,
    workerTypeSet: profile.workerType !== null,
    hasVerifiedCredentials: verifiedCount,
    totalCredentials: profile.credentials.length,
    yearsExperience: profile.yearsExperience,
    hasAvailability: profile.availabilitySlots.length > 0,
    averageRating,
    totalReviews,
    shiftsCompleted: completedAssignments,
    noShowCount: noShows,
    onTimePercentage: null,
    hasSpecialties: profile.specialties.length > 0,
    hasBio: !!profile.bio,
    hasPhoto: !!profile.user.avatarUrl,
  });

  await db.workerProfile.update({
    where: { id: workerProfileId },
    data: { profileCompleteness: score },
  });

  return { success: true, score };
}

// ─── Calculate & Update Provider Score ──────────────────────────

export async function calculateAndUpdateProviderScore(companyId: string) {
  const company = await db.company.findUnique({
    where: { id: companyId },
    include: {
      reviews: { select: { rating: true } },
      memberships: {
        where: { status: "APPROVED", deletedAt: null },
        select: { id: true },
      },
      _count: {
        select: { shifts: { where: { status: "COMPLETED" } } },
      },
    },
  });

  if (!company) return { error: "Company not found" };

  const totalReviews = company.reviews.length;
  const averageRating =
    totalReviews > 0
      ? company.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : null;

  const yearsActive = Math.max(
    1,
    Math.floor(
      (Date.now() - company.createdAt.getTime()) /
        (365.25 * 24 * 60 * 60 * 1000)
    )
  );

  const score = calculateProviderScore({
    profileComplete: !!(company.name && company.city && company.state),
    hasDescription: !!company.description,
    hasLogo: !!company.logoUrl,
    hasNpi: false,
    hasWebsite: false,
    yearsActive,
    averageRating,
    totalReviews,
    totalWorkersEmployed: company.memberships.length,
    avgPayRate: null,
    shiftsCompleted: company._count.shifts,
    onTimePayment: false,
    servicesOfferedCount: company.servicesOffered.length,
    responseRate: null,
  });

  // Store score in description metadata or a future field
  // For now, we return the computed score
  return { success: true, score };
}

// ─── Toggle Marketplace Visibility ──────────────────────────────

export async function toggleMarketplaceVisibility(
  type: "worker" | "company"
) {
  const user = await getSessionUser();

  if (type === "worker") {
    const profile = await db.workerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!profile) return { error: "Worker profile not found" };

    const updated = await db.workerProfile.update({
      where: { id: profile.id },
      data: { isMarketplaceVisible: !profile.isMarketplaceVisible },
    });

    revalidatePath("/worker/score");
    revalidatePath("/marketplace");
    return { success: true, isVisible: updated.isMarketplaceVisible };
  }

  if (type === "company") {
    // Find the company the user owns (they must be an admin/owner membership or company role user)
    const membership = await db.companyMembership.findFirst({
      where: { userId: user.id, role: "admin", status: "APPROVED" },
      select: { companyId: true },
    });

    if (!membership) return { error: "No company found" };

    const company = await db.company.findUnique({
      where: { id: membership.companyId },
    });
    if (!company) return { error: "Company not found" };

    const updated = await db.company.update({
      where: { id: company.id },
      data: { isMarketplaceVisible: !company.isMarketplaceVisible },
    });

    revalidatePath("/marketplace");
    return { success: true, isVisible: updated.isMarketplaceVisible };
  }

  return { error: "Invalid type" };
}

// ─── Get Worker Score Breakdown (for authenticated score page) ──

export async function getWorkerScoreBreakdown() {
  const session = await auth();
  if (!session?.user) return null;

  const user = session.user as { id: string };

  const profile = await db.workerProfile.findUnique({
    where: { userId: user.id },
    include: {
      user: {
        select: {
          avatarUrl: true,
          reviewsReceived: { select: { rating: true } },
        },
      },
      credentials: { select: { status: true, type: true } },
      availabilitySlots: { select: { id: true } },
    },
  });

  if (!profile) return null;

  const reviews = profile.user.reviewsReceived;
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : null;

  const verifiedCount = profile.credentials.filter(
    (c) => c.status === "VERIFIED"
  ).length;

  const completedAssignments = await db.assignment.count({
    where: { workerProfileId: profile.id, status: "COMPLETED" },
  });

  const noShows = await db.assignment.count({
    where: { workerProfileId: profile.id, status: "NO_SHOW" },
  });

  const factors = {
    profileComplete: profile.profileCompleteness >= 80,
    workerTypeSet: profile.workerType !== null,
    hasVerifiedCredentials: verifiedCount,
    totalCredentials: profile.credentials.length,
    yearsExperience: profile.yearsExperience,
    hasAvailability: profile.availabilitySlots.length > 0,
    averageRating,
    totalReviews,
    shiftsCompleted: completedAssignments,
    noShowCount: noShows,
    onTimePercentage: null as number | null,
    hasSpecialties: profile.specialties.length > 0,
    hasBio: !!profile.bio,
    hasPhoto: !!profile.user.avatarUrl,
  };

  const score = calculateWorkerScore(factors);

  // Build tips
  const tips: string[] = [];
  if (!factors.hasBio) tips.push("Add a professional bio to gain up to +4 points");
  if (!factors.hasPhoto) tips.push("Upload a profile photo to gain +3 points");
  if (!factors.workerTypeSet) tips.push("Set your worker type to gain +3 points");
  if (!factors.hasSpecialties) tips.push("Add your specialties to gain +3 points");
  if (!factors.hasAvailability) tips.push("Set your availability schedule to gain +2 points");
  if (factors.totalCredentials === 0) tips.push("Upload your credentials to gain up to +25 points");
  if (factors.totalCredentials > 0 && verifiedCount < factors.totalCredentials) {
    tips.push("Get your pending credentials verified to improve your score");
  }
  if (factors.totalReviews === 0) tips.push("Complete assignments and earn reviews to boost your score");

  return {
    score,
    factors,
    isMarketplaceVisible: profile.isMarketplaceVisible,
    tips,
    credentialTypes: profile.credentials.map((c) => c.type),
  };
}
