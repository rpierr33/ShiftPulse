"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Validation ─────────────────────────────────────────────────

const locationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// ─── Server Actions ─────────────────────────────────────────────

/**
 * Get all active locations for a company.
 */
export async function getLocations(companyId: string) {
  await getSessionUser();

  const locations = await db.location.findMany({
    where: { companyId, isActive: true },
    include: {
      _count: {
        select: { shifts: true },
      },
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return locations;
}

/**
 * Create a new location for a company.
 */
export async function createLocation(
  companyId: string,
  data: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
  }
) {
  const user = await getSessionUser();

  const parsed = locationSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Check if this is the first location — make it default
  const existingCount = await db.location.count({
    where: { companyId, isActive: true },
  });

  const location = await db.location.create({
    data: {
      companyId,
      name: parsed.data.name,
      address: parsed.data.address,
      city: parsed.data.city,
      state: parsed.data.state,
      zipCode: parsed.data.zipCode,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      isDefault: existingCount === 0,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId,
      action: "SETTINGS_CHANGED",
      entityType: "Location",
      entityId: location.id,
      after: { name: parsed.data.name, action: "created" },
    },
  });

  revalidatePath("/company/locations");
  return { success: true, locationId: location.id };
}

/**
 * Update an existing location.
 */
export async function updateLocation(
  locationId: string,
  data: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
  }
) {
  const user = await getSessionUser();

  const existing = await db.location.findUnique({
    where: { id: locationId },
  });
  if (!existing) return { error: "Location not found" };

  const location = await db.location.update({
    where: { id: locationId },
    data,
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: existing.companyId,
      action: "SETTINGS_CHANGED",
      entityType: "Location",
      entityId: location.id,
      before: {
        name: existing.name,
        address: existing.address,
        city: existing.city,
        state: existing.state,
        zipCode: existing.zipCode,
      },
      after: data,
    },
  });

  revalidatePath("/company/locations");
  return { success: true };
}

/**
 * Soft-delete a location by setting isActive to false.
 */
export async function deleteLocation(locationId: string) {
  const user = await getSessionUser();

  const existing = await db.location.findUnique({
    where: { id: locationId },
  });
  if (!existing) return { error: "Location not found" };

  if (existing.isDefault) {
    return { error: "Cannot delete the default location. Set another location as default first." };
  }

  await db.location.update({
    where: { id: locationId },
    data: { isActive: false },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: existing.companyId,
      action: "SETTINGS_CHANGED",
      entityType: "Location",
      entityId: locationId,
      after: { name: existing.name, action: "deleted" },
    },
  });

  revalidatePath("/company/locations");
  return { success: true };
}

/**
 * Set a location as the default for the company.
 */
export async function setDefaultLocation(locationId: string) {
  const user = await getSessionUser();

  const location = await db.location.findUnique({
    where: { id: locationId },
  });
  if (!location) return { error: "Location not found" };

  // Unset current default(s) for this company
  await db.location.updateMany({
    where: { companyId: location.companyId, isDefault: true },
    data: { isDefault: false },
  });

  // Set the new default
  await db.location.update({
    where: { id: locationId },
    data: { isDefault: true },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: location.companyId,
      action: "SETTINGS_CHANGED",
      entityType: "Location",
      entityId: locationId,
      after: { name: location.name, action: "set_as_default" },
    },
  });

  revalidatePath("/company/locations");
  return { success: true };
}
