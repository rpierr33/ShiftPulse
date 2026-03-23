"use server";

import { db } from "@/lib/db";
import { getSessionUser, requireRole } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import type { DayOfWeek, WorkerType } from "@prisma/client";

// ─── Types ──────────────────────────────────────────────────────

type ClientProfileData = {
  relationship?: string;
  careRecipientName?: string;
  careNeeds?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  preferredSchedule?: string;
};

type ClientWorkerFilters = {
  serviceType?: string;
  city?: string;
  state?: string;
  workerType?: WorkerType[];
  page?: number;
  limit?: number;
};

type CreateBookingData = {
  workerProfileId: string;
  serviceType: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isRecurring?: boolean;
  recurringDays?: DayOfWeek[];
  notes?: string;
};

// ─── Get Client Profile ─────────────────────────────────────────

export async function getClientProfile() {
  const user = await requireRole("CLIENT");

  const profile = await db.clientProfile.findUnique({
    where: { userId: user.id },
  });

  const fullUser = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, phone: true },
  });

  return { profile, user: fullUser };
}

// ─── Update Client Profile ──────────────────────────────────────

export async function updateClientProfile(data: ClientProfileData) {
  const user = await requireRole("CLIENT");

  const profile = await db.clientProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...data,
    },
    update: data,
  });

  revalidatePath("/client/profile");
  revalidatePath("/client/dashboard");
  return { success: true, profile };
}

// ─── Search Workers for Client ──────────────────────────────────

export async function searchWorkersForClient(filters: ClientWorkerFilters = {}) {
  const { serviceType, city, state, workerType, page = 1, limit = 24 } = filters;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    isValidated: true,
    acceptsPrivateClients: true,
    isMarketplaceVisible: true,
    user: { isActive: true, deletedAt: null },
  };

  if (serviceType) {
    where.servicesOffered = { has: serviceType };
  }

  if (city) {
    where.city = { contains: city, mode: "insensitive" };
  }

  if (state) {
    where.state = { equals: state, mode: "insensitive" };
  }

  if (workerType && workerType.length > 0) {
    where.workerType = { in: workerType };
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
    },
    skip,
    take: limit,
    orderBy: [
      { isFeatured: "desc" },
      { profileCompleteness: "desc" },
    ],
  });

  const results = workers.map((w) => {
    const reviews = w.user.reviewsReceived;
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : null;

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
      servicesOffered: w.servicesOffered,
      preferredRates: w.preferredRates as Record<string, number> | null,
      score: w.profileCompleteness,
      averageRating: averageRating ? parseFloat(averageRating.toFixed(1)) : null,
      totalReviews,
      isFeatured: w.isFeatured,
      isAvailable: w.isAvailable,
    };
  });

  const total = await db.workerProfile.count({ where });

  return { workers: results, total, page, limit };
}

// ─── Create Booking ─────────────────────────────────────────────

export async function createBooking(data: CreateBookingData) {
  const user = await requireRole("CLIENT");

  const workerProfile = await db.workerProfile.findUnique({
    where: { id: data.workerProfileId },
    select: {
      id: true,
      acceptsPrivateClients: true,
      isValidated: true,
      preferredRates: true,
    },
  });

  if (!workerProfile) {
    return { error: "Worker not found" };
  }

  if (!workerProfile.acceptsPrivateClients) {
    return { error: "This worker does not accept private clients" };
  }

  if (!workerProfile.isValidated) {
    return { error: "This worker is not yet validated" };
  }

  // Pull hourly rate from worker's preferred rates for the service type
  let hourlyRate: number | null = null;
  const rates = workerProfile.preferredRates as Record<string, number> | null;
  if (rates && data.serviceType in rates) {
    hourlyRate = rates[data.serviceType];
  }

  const booking = await db.booking.create({
    data: {
      clientId: user.id,
      workerProfileId: data.workerProfileId,
      serviceType: data.serviceType,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
      isRecurring: data.isRecurring ?? false,
      recurringDays: data.recurringDays ?? [],
      hourlyRate,
      notes: data.notes ?? null,
      status: "pending",
    },
  });

  revalidatePath("/client/bookings");
  revalidatePath("/worker/bookings");
  return { success: true, bookingId: booking.id };
}

// ─── Get Client Bookings ────────────────────────────────────────

export async function getClientBookings() {
  const user = await requireRole("CLIENT");

  const bookings = await db.booking.findMany({
    where: { clientId: user.id },
    include: {
      workerProfile: {
        include: {
          user: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return bookings.map((b) => ({
    id: b.id,
    status: b.status,
    serviceType: b.serviceType,
    startDate: b.startDate,
    endDate: b.endDate,
    startTime: b.startTime,
    endTime: b.endTime,
    isRecurring: b.isRecurring,
    recurringDays: b.recurringDays,
    hourlyRate: b.hourlyRate,
    totalHours: b.totalHours,
    notes: b.notes,
    clientNotes: b.clientNotes,
    workerNotes: b.workerNotes,
    declineReason: b.declineReason,
    completedAt: b.completedAt,
    createdAt: b.createdAt,
    workerName: b.workerProfile.user.name,
    workerAvatar: b.workerProfile.user.avatarUrl,
    workerType: b.workerProfile.workerType,
    workerProfileId: b.workerProfileId,
  }));
}

// ─── Cancel Booking ─────────────────────────────────────────────

export async function cancelBooking(id: string) {
  const user = await requireRole("CLIENT");

  const booking = await db.booking.findFirst({
    where: { id, clientId: user.id },
  });

  if (!booking) {
    return { error: "Booking not found" };
  }

  if (booking.status !== "pending" && booking.status !== "accepted") {
    return { error: "Only pending or accepted bookings can be cancelled" };
  }

  await db.booking.update({
    where: { id },
    data: { status: "cancelled" },
  });

  revalidatePath("/client/bookings");
  revalidatePath("/client/dashboard");
  revalidatePath("/worker/bookings");
  return { success: true };
}

// ─── Worker Booking Actions ─────────────────────────────────────

export async function getWorkerBookings() {
  const user = await requireRole("WORKER");

  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!workerProfile) {
    return [];
  }

  const bookings = await db.booking.findMany({
    where: { workerProfileId: workerProfile.id },
    include: {
      client: {
        select: {
          name: true,
          avatarUrl: true,
          phone: true,
          clientProfile: {
            select: {
              careRecipientName: true,
              careNeeds: true,
              address: true,
              city: true,
              state: true,
              zipCode: true,
            },
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return bookings.map((b) => ({
    id: b.id,
    status: b.status,
    serviceType: b.serviceType,
    startDate: b.startDate,
    endDate: b.endDate,
    startTime: b.startTime,
    endTime: b.endTime,
    isRecurring: b.isRecurring,
    recurringDays: b.recurringDays,
    hourlyRate: b.hourlyRate,
    totalHours: b.totalHours,
    notes: b.notes,
    clientNotes: b.clientNotes,
    workerNotes: b.workerNotes,
    declineReason: b.declineReason,
    completedAt: b.completedAt,
    createdAt: b.createdAt,
    clientName: b.client.name,
    clientAvatar: b.client.avatarUrl,
    clientPhone: b.client.phone,
    careRecipientName: b.client.clientProfile?.careRecipientName ?? null,
    careNeeds: b.client.clientProfile?.careNeeds ?? null,
    clientAddress: b.client.clientProfile?.address ?? null,
    clientCity: b.client.clientProfile?.city ?? null,
    clientState: b.client.clientProfile?.state ?? null,
    clientZipCode: b.client.clientProfile?.zipCode ?? null,
  }));
}

export async function acceptBooking(id: string) {
  const user = await requireRole("WORKER");

  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!workerProfile) {
    return { error: "Worker profile not found" };
  }

  const booking = await db.booking.findFirst({
    where: { id, workerProfileId: workerProfile.id },
  });

  if (!booking) {
    return { error: "Booking not found" };
  }

  if (booking.status !== "pending") {
    return { error: "Only pending bookings can be accepted" };
  }

  await db.booking.update({
    where: { id },
    data: { status: "accepted" },
  });

  revalidatePath("/worker/bookings");
  revalidatePath("/client/bookings");
  revalidatePath("/client/dashboard");
  return { success: true };
}

export async function declineBooking(id: string, reason?: string) {
  const user = await requireRole("WORKER");

  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!workerProfile) {
    return { error: "Worker profile not found" };
  }

  const booking = await db.booking.findFirst({
    where: { id, workerProfileId: workerProfile.id },
  });

  if (!booking) {
    return { error: "Booking not found" };
  }

  if (booking.status !== "pending") {
    return { error: "Only pending bookings can be declined" };
  }

  await db.booking.update({
    where: { id },
    data: {
      status: "declined",
      declineReason: reason ?? null,
    },
  });

  revalidatePath("/worker/bookings");
  revalidatePath("/client/bookings");
  revalidatePath("/client/dashboard");
  return { success: true };
}

export async function completeBooking(id: string) {
  const user = await requireRole("WORKER");

  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!workerProfile) {
    return { error: "Worker profile not found" };
  }

  const booking = await db.booking.findFirst({
    where: { id, workerProfileId: workerProfile.id },
  });

  if (!booking) {
    return { error: "Booking not found" };
  }

  if (booking.status !== "accepted") {
    return { error: "Only accepted bookings can be marked as completed" };
  }

  await db.booking.update({
    where: { id },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  });

  revalidatePath("/worker/bookings");
  revalidatePath("/client/bookings");
  revalidatePath("/client/dashboard");
  return { success: true };
}
