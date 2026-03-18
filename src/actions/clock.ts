"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { computeDurationMinutes } from "@/lib/utils";
import { checkGeofence } from "@/lib/geofence";
import { revalidatePath } from "next/cache";

interface LocationData {
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
}

/**
 * Resolve the geofence reference point. Prefer the shift location; fall back
 * to the company location.
 */
function resolveGeofenceSite(
  shift: { latitude: number | null; longitude: number | null } | null,
  company: { latitude: number | null; longitude: number | null }
): { lat: number; lng: number } | null {
  if (shift?.latitude != null && shift?.longitude != null) {
    return { lat: shift.latitude, lng: shift.longitude };
  }
  if (company.latitude != null && company.longitude != null) {
    return { lat: company.latitude, lng: company.longitude };
  }
  return null;
}

export async function clockIn(
  companyId: string,
  shiftId?: string,
  notes?: string,
  location?: LocationData
) {
  const user = await getSessionUser();

  // Verify membership
  const membership = await db.companyMembership.findFirst({
    where: { userId: user.id, companyId, status: "APPROVED" },
  });
  if (!membership) {
    return { error: "You are not a member of this company" };
  }

  // Check company settings
  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company) return { error: "Company not found" };

  if (company.requireShiftSelection && !shiftId) {
    return { error: "You must select a shift before clocking in" };
  }

  // Block duplicate active clock-ins
  const activeEntry = await db.timeEntry.findFirst({
    where: { userId: user.id, companyId, clockOutTime: null },
  });
  if (activeEntry) {
    return { error: "You already have an active clock-in" };
  }

  // Resolve shift for geofence check
  let shift: { latitude: number | null; longitude: number | null } | null = null;
  if (shiftId) {
    shift = await db.shift.findUnique({
      where: { id: shiftId },
      select: { latitude: true, longitude: true },
    });
  }

  // --- EVV / Geofencing ---
  let evvStatus: string | null = null;
  let distanceFromSite: number | null = null;
  const hasCoords = location?.latitude != null && location?.longitude != null;

  if (company.enableGeofencing && hasCoords) {
    const site = resolveGeofenceSite(shift, company);
    if (site) {
      const result = checkGeofence(
        location!.latitude!,
        location!.longitude!,
        site.lat,
        site.lng,
        company.geofenceRadiusMeters
      );
      evvStatus = result.isWithinRange ? "verified" : "flagged";
      distanceFromSite = result.distance;
    }
  }

  const now = new Date();

  // Create clock event
  await db.clockEvent.create({
    data: {
      userId: user.id,
      companyId,
      shiftId: shiftId || null,
      type: "CLOCK_IN",
      timestamp: now,
      serverTime: now,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      accuracy: location?.accuracy ?? null,
      notes,
    },
  });

  // Create time entry
  const entry = await db.timeEntry.create({
    data: {
      userId: user.id,
      companyId,
      shiftId: shiftId || null,
      clockInTime: now,
      status: "PENDING",
      evvStatus,
      clockInLat: location?.latitude ?? null,
      clockInLng: location?.longitude ?? null,
      distanceFromSite,
    },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId,
      action: "CLOCK_IN",
      entityType: "TimeEntry",
      entityId: entry.id,
      after: {
        clockInTime: now.toISOString(),
        shiftId,
        evvStatus,
        distanceFromSite,
      },
    },
  });

  revalidatePath("/worker");
  return { success: true, entryId: entry.id };
}

export async function clockOut(
  companyId: string,
  notes?: string,
  location?: LocationData
) {
  const user = await getSessionUser();

  // Find active time entry
  const activeEntry = await db.timeEntry.findFirst({
    where: { userId: user.id, companyId, clockOutTime: null },
    include: {
      shift: { select: { latitude: true, longitude: true } },
      company: { select: { enableGeofencing: true, geofenceRadiusMeters: true, latitude: true, longitude: true } },
    },
  });
  if (!activeEntry) {
    return { error: "No active clock-in found" };
  }

  const now = new Date();
  const duration = computeDurationMinutes(new Date(activeEntry.clockInTime), now);

  // --- EVV / Geofencing on clock-out ---
  let evvStatus = activeEntry.evvStatus;
  let distanceFromSite = activeEntry.distanceFromSite;
  const hasCoords = location?.latitude != null && location?.longitude != null;

  if (activeEntry.company.enableGeofencing && hasCoords) {
    const site = resolveGeofenceSite(activeEntry.shift, activeEntry.company);
    if (site) {
      const result = checkGeofence(
        location!.latitude!,
        location!.longitude!,
        site.lat,
        site.lng,
        activeEntry.company.geofenceRadiusMeters
      );
      // If clock-out is out of range, flag the entry (even if clock-in was verified)
      if (!result.isWithinRange) {
        evvStatus = "flagged";
      }
      distanceFromSite = result.distance;
    }
  }

  // Create clock event
  await db.clockEvent.create({
    data: {
      userId: user.id,
      companyId,
      shiftId: activeEntry.shiftId,
      type: "CLOCK_OUT",
      timestamp: now,
      serverTime: now,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      accuracy: location?.accuracy ?? null,
      notes,
    },
  });

  // Update time entry
  await db.timeEntry.update({
    where: { id: activeEntry.id },
    data: {
      clockOutTime: now,
      clockOutNote: notes,
      duration,
      evvStatus,
      clockOutLat: location?.latitude ?? null,
      clockOutLng: location?.longitude ?? null,
      distanceFromSite,
    },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId,
      action: "CLOCK_OUT",
      entityType: "TimeEntry",
      entityId: activeEntry.id,
      after: {
        clockOutTime: now.toISOString(),
        duration,
        evvStatus,
        distanceFromSite,
      },
    },
  });

  revalidatePath("/worker");
  return { success: true, duration };
}

export async function createManualTimeEntry(
  companyId: string,
  date: string,
  clockInTime: string,
  clockOutTime: string,
  notes?: string
) {
  const user = await getSessionUser();

  // Verify membership
  const membership = await db.companyMembership.findFirst({
    where: { userId: user.id, companyId, status: "APPROVED" },
  });
  if (!membership) return { error: "You are not a member of this company" };

  // Check company allows manual entry
  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company) return { error: "Company not found" };
  if (!company.allowManualEntry) return { error: "This company does not allow manual time entries" };

  const clockIn = new Date(`${date}T${clockInTime}`);
  const clockOut = new Date(`${date}T${clockOutTime}`);

  if (clockOut <= clockIn) return { error: "Clock out must be after clock in" };

  const duration = computeDurationMinutes(clockIn, clockOut);

  const entry = await db.timeEntry.create({
    data: {
      userId: user.id,
      companyId,
      clockInTime: clockIn,
      clockOutTime: clockOut,
      clockInNote: notes,
      duration,
      isManualEntry: true,
      status: "PENDING",
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId,
      action: "TIME_ENTRY_CREATED",
      entityType: "TimeEntry",
      entityId: entry.id,
      after: { date, clockInTime, clockOutTime, isManualEntry: true },
    },
  });

  revalidatePath("/worker/history");
  return { success: true };
}

export async function getClockStatus(userId: string) {
  const activeEntry = await db.timeEntry.findFirst({
    where: { userId, clockOutTime: null },
    include: {
      company: { select: { name: true } },
      shift: { select: { title: true } },
    },
  });

  if (!activeEntry) {
    return { isClockedIn: false };
  }

  return {
    isClockedIn: true,
    currentEntryId: activeEntry.id,
    clockInTime: activeEntry.clockInTime,
    companyId: activeEntry.companyId,
    companyName: activeEntry.company.name,
    shiftTitle: activeEntry.shift?.title,
  };
}
