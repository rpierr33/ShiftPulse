"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import type { DayOfWeek } from "@prisma/client";

export async function getAvailability(workerProfileId: string) {
  const slots = await db.availabilitySlot.findMany({
    where: { workerProfileId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return slots;
}

export async function setAvailability(
  slots: { dayOfWeek: DayOfWeek; startTime: string; endTime: string }[]
) {
  const user = await getSessionUser();

  const profile = await db.workerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return { error: "Worker profile not found" };

  // Delete all existing recurring slots, then create new ones
  await db.availabilitySlot.deleteMany({
    where: { workerProfileId: profile.id, isRecurring: true },
  });

  if (slots.length > 0) {
    await db.availabilitySlot.createMany({
      data: slots.map((slot) => ({
        workerProfileId: profile.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isRecurring: true,
        isUnavailable: false,
      })),
    });
  }

  revalidatePath("/worker/profile");
  return { success: true };
}

export async function addDateOverride(
  date: string,
  isUnavailable: boolean,
  startTime?: string,
  endTime?: string
) {
  const user = await getSessionUser();

  const profile = await db.workerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return { error: "Worker profile not found" };

  const specificDate = new Date(date);
  const dayIndex = specificDate.getUTCDay();
  const days: DayOfWeek[] = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const dayOfWeek = days[dayIndex];

  await db.availabilitySlot.create({
    data: {
      workerProfileId: profile.id,
      dayOfWeek,
      startTime: startTime || "00:00",
      endTime: endTime || "23:59",
      isRecurring: false,
      specificDate,
      isUnavailable,
    },
  });

  revalidatePath("/worker/profile");
  return { success: true };
}

export async function removeSlot(slotId: string) {
  const user = await getSessionUser();

  const profile = await db.workerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return { error: "Worker profile not found" };

  const slot = await db.availabilitySlot.findUnique({
    where: { id: slotId },
  });
  if (!slot || slot.workerProfileId !== profile.id) {
    return { error: "Slot not found" };
  }

  await db.availabilitySlot.delete({ where: { id: slotId } });

  revalidatePath("/worker/profile");
  return { success: true };
}

export async function getWorkerAvailabilityForCompany(companyId: string) {
  const memberships = await db.companyMembership.findMany({
    where: { companyId, status: "APPROVED" },
    include: {
      user: {
        select: {
          name: true,
          workerProfile: {
            select: {
              id: true,
              availabilitySlots: {
                where: { isRecurring: true },
                orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
              },
            },
          },
        },
      },
    },
  });

  return memberships.map((m) => ({
    userId: m.userId,
    userName: m.user.name,
    workerProfileId: m.user.workerProfile?.id ?? null,
    slots: m.user.workerProfile?.availabilitySlots ?? [],
  }));
}
