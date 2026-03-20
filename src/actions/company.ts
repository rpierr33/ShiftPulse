"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getCompanyForUser(userId: string) {
  const membership = await db.companyMembership.findFirst({
    where: { userId, status: "APPROVED", role: { in: ["admin", "manager"] } },
    include: { company: true },
  });
  return membership?.company ?? null;
}

export async function getWorkerCompanies(userId: string) {
  const memberships = await db.companyMembership.findMany({
    where: { userId, status: "APPROVED" },
    include: { company: true },
  });
  return memberships.map((m) => m.company);
}

export async function joinCompanyByCode(code: string) {
  const user = await getSessionUser();

  const company = await db.company.findUnique({
    where: { joinCode: code.toUpperCase().trim() },
  });
  if (!company) {
    return { error: "Invalid join code" };
  }

  const existing = await db.companyMembership.findFirst({
    where: { userId: user.id, companyId: company.id },
  });
  if (existing) {
    return { error: "You already have a connection to this company" };
  }

  const status = company.autoApproveWorkers ? "APPROVED" : "PENDING";

  await db.companyMembership.create({
    data: {
      userId: user.id,
      companyId: company.id,
      status: status as "APPROVED" | "PENDING",
      joinedAt: status === "APPROVED" ? new Date() : null,
    },
  });

  revalidatePath("/worker");
  return { success: true, companyName: company.name, status };
}

export async function approveMembership(membershipId: string) {
  const user = await getSessionUser();

  const membership = await db.companyMembership.findUnique({
    where: { id: membershipId },
    include: { company: true },
  });
  if (!membership) return { error: "Membership not found" };

  // Verify caller is company admin
  const callerMembership = await db.companyMembership.findFirst({
    where: {
      userId: user.id,
      companyId: membership.companyId,
      status: "APPROVED",
      role: { in: ["admin", "manager"] },
    },
  });
  if (!callerMembership) return { error: "Not authorized" };

  await db.companyMembership.update({
    where: { id: membershipId },
    data: { status: "APPROVED", joinedAt: new Date() },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: membership.companyId,
      action: "MEMBERSHIP_APPROVED",
      entityType: "CompanyMembership",
      entityId: membershipId,
      after: { userId: membership.userId },
    },
  });

  revalidatePath("/company");
  return { success: true };
}

export async function rejectMembership(membershipId: string) {
  const user = await getSessionUser();

  const membership = await db.companyMembership.findUnique({
    where: { id: membershipId },
  });
  if (!membership) return { error: "Membership not found" };

  const callerMembership = await db.companyMembership.findFirst({
    where: {
      userId: user.id,
      companyId: membership.companyId,
      status: "APPROVED",
      role: { in: ["admin", "manager"] },
    },
  });
  if (!callerMembership) return { error: "Not authorized" };

  await db.companyMembership.update({
    where: { id: membershipId },
    data: { status: "REJECTED" },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: membership.companyId,
      action: "MEMBERSHIP_REJECTED",
      entityType: "CompanyMembership",
      entityId: membershipId,
    },
  });

  revalidatePath("/company");
  return { success: true };
}

const shiftSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  capacity: z.number().min(1).default(1),
});

export async function createShift(companyId: string, formData: FormData) {
  const user = await getSessionUser();

  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    location: formData.get("location") as string,
    date: formData.get("date") as string,
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
    capacity: Number(formData.get("capacity") || 1),
  };

  const parsed = shiftSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { title, description, location, date, startTime, endTime, capacity } = parsed.data;

  const shiftDate = new Date(date);
  const start = new Date(`${date}T${startTime}`);
  const end = new Date(`${date}T${endTime}`);

  const shift = await db.shift.create({
    data: {
      companyId,
      title,
      description,
      location,
      date: shiftDate,
      startTime: start,
      endTime: end,
      capacity,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId,
      action: "SHIFT_CREATED",
      entityType: "Shift",
      entityId: shift.id,
      after: { title, date, startTime, endTime },
    },
  });

  revalidatePath("/company/shifts");
  return { success: true, shiftId: shift.id };
}

export async function createSchedule(companyId: string, formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);

  if (!name) return { error: "Schedule name is required" };
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return { error: "Invalid dates" };
  if (endDate <= startDate) return { error: "End date must be after start date" };

  const schedule = await db.schedule.create({
    data: {
      companyId,
      name,
      description,
      startDate,
      endDate,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId,
      action: "SCHEDULE_CREATED",
      entityType: "Schedule",
      entityId: schedule.id,
    },
  });

  revalidatePath("/company/schedules");
  return { success: true };
}

export async function publishSchedule(scheduleId: string) {
  const user = await getSessionUser();

  const schedule = await db.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) return { error: "Schedule not found" };

  await db.schedule.update({
    where: { id: scheduleId },
    data: { isPublished: true },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: schedule.companyId,
      action: "SCHEDULE_UPDATED",
      entityType: "Schedule",
      entityId: scheduleId,
    },
  });

  revalidatePath("/company/schedules");
  return { success: true };
}

export async function unpublishSchedule(scheduleId: string) {
  const user = await getSessionUser();

  const schedule = await db.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) return { error: "Schedule not found" };

  await db.schedule.update({
    where: { id: scheduleId },
    data: { isPublished: false },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: schedule.companyId,
      action: "SCHEDULE_UPDATED",
      entityType: "Schedule",
      entityId: scheduleId,
    },
  });

  revalidatePath("/company/schedules");
  return { success: true };
}

export async function deleteSchedule(scheduleId: string) {
  const user = await getSessionUser();

  const schedule = await db.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) return { error: "Schedule not found" };

  await db.schedule.update({
    where: { id: scheduleId },
    data: { deletedAt: new Date() },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: schedule.companyId,
      action: "SCHEDULE_UPDATED",
      entityType: "Schedule",
      entityId: scheduleId,
    },
  });

  revalidatePath("/company/schedules");
  return { success: true };
}

export async function approveTimeEntry(entryId: string) {
  const user = await getSessionUser();

  const entry = await db.timeEntry.findUnique({ where: { id: entryId } });
  if (!entry) return { error: "Time entry not found" };

  await db.timeEntry.update({
    where: { id: entryId },
    data: { status: "APPROVED", approvedBy: user.id, approvedAt: new Date() },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: entry.companyId,
      action: "TIME_ENTRY_APPROVED",
      entityType: "TimeEntry",
      entityId: entryId,
    },
  });

  revalidatePath("/company/time-entries");
  return { success: true };
}

export async function updateCompanySettings(companyId: string, formData: FormData) {
  const user = await getSessionUser();

  // Verify caller is company admin
  const membership = await db.companyMembership.findFirst({
    where: {
      userId: user.id,
      companyId,
      status: "APPROVED",
      role: { in: ["admin", "manager"] },
    },
  });
  if (!membership) return { error: "Not authorized" };

  // Update company flags (including geofencing)
  const latRaw = formData.get("companyLatitude") as string;
  const lngRaw = formData.get("companyLongitude") as string;
  const companyLatitude = latRaw ? parseFloat(latRaw) : null;
  const companyLongitude = lngRaw ? parseFloat(lngRaw) : null;

  await db.company.update({
    where: { id: companyId },
    data: {
      autoApproveWorkers: formData.get("autoApproveWorkers") === "on",
      allowManualEntry: formData.get("allowManualEntry") === "on",
      allowBackdatedEntry: formData.get("allowBackdatedEntry") === "on",
      requireShiftSelection: formData.get("requireShiftSelection") === "on",
      timezone: (formData.get("timezone") as string) || "America/New_York",
      enableGeofencing: formData.get("enableGeofencing") === "on",
      geofenceRadiusMeters: Number(formData.get("geofenceRadiusMeters") || 200),
      latitude: isNaN(companyLatitude as number) ? null : companyLatitude,
      longitude: isNaN(companyLongitude as number) ? null : companyLongitude,
    },
  });

  // Upsert settings
  await db.settings.upsert({
    where: { companyId },
    create: {
      companyId,
      overtimeThreshold: Number(formData.get("overtimeThreshold") || 40),
      overtimeMultiplier: Number(formData.get("overtimeMultiplier") || 1.5),
      roundingIncrement: Number(formData.get("roundingIncrement") || 15),
      autoApproveTimeEntries: formData.get("autoApproveTimeEntries") === "on",
      breakDurationMinutes: Number(formData.get("breakDurationMinutes") || 30),
      autoDeductBreak: formData.get("autoDeductBreak") === "on",
      maxClockInEarlyMinutes: Number(formData.get("maxClockInEarlyMinutes") || 15),
      maxClockOutLateMinutes: Number(formData.get("maxClockOutLateMinutes") || 15),
      enableEvv: formData.get("enableEvv") === "on",
    },
    update: {
      overtimeThreshold: Number(formData.get("overtimeThreshold") || 40),
      overtimeMultiplier: Number(formData.get("overtimeMultiplier") || 1.5),
      roundingIncrement: Number(formData.get("roundingIncrement") || 15),
      autoApproveTimeEntries: formData.get("autoApproveTimeEntries") === "on",
      breakDurationMinutes: Number(formData.get("breakDurationMinutes") || 30),
      autoDeductBreak: formData.get("autoDeductBreak") === "on",
      maxClockInEarlyMinutes: Number(formData.get("maxClockInEarlyMinutes") || 15),
      maxClockOutLateMinutes: Number(formData.get("maxClockOutLateMinutes") || 15),
      enableEvv: formData.get("enableEvv") === "on",
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId,
      action: "SETTINGS_CHANGED",
      entityType: "Settings",
      entityId: companyId,
    },
  });

  revalidatePath("/company/settings");
  return { success: true };
}

export async function rejectTimeEntry(entryId: string, reason: string) {
  const user = await getSessionUser();

  const entry = await db.timeEntry.findUnique({ where: { id: entryId } });
  if (!entry) return { error: "Time entry not found" };

  await db.timeEntry.update({
    where: { id: entryId },
    data: { status: "REJECTED", rejectionReason: reason },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: entry.companyId,
      action: "TIME_ENTRY_REJECTED",
      entityType: "TimeEntry",
      entityId: entryId,
      after: { reason },
    },
  });

  revalidatePath("/company/time-entries");
  return { success: true };
}

// ─── Shift Assignments ──────────────────────────────────────

export async function assignWorkerToShift(shiftId: string, workerProfileId: string) {
  const user = await getSessionUser();

  const shift = await db.shift.findUnique({
    where: { id: shiftId },
  });
  if (!shift) return { error: "Shift not found" };

  // Verify caller is company admin/manager
  const callerMembership = await db.companyMembership.findFirst({
    where: {
      userId: user.id,
      companyId: shift.companyId,
      status: "APPROVED",
      role: { in: ["admin", "manager"] },
    },
  });
  if (!callerMembership) return { error: "Not authorized" };

  // Check capacity — only count CONFIRMED or PENDING assignments
  const activeAssignmentCount = await db.assignment.count({
    where: { shiftId, status: { in: ["CONFIRMED", "PENDING"] } },
  });
  if (activeAssignmentCount >= shift.capacity) {
    return { error: "Shift is already at full capacity" };
  }

  // Check duplicate
  const existing = await db.assignment.findFirst({
    where: { shiftId, workerProfileId, status: { not: "CANCELLED" } },
  });
  if (existing) return { error: "Worker is already assigned to this shift" };

  // Check for overlapping shifts for this worker on the same date/time
  const workerProfile = await db.workerProfile.findUnique({
    where: { id: workerProfileId },
    select: { id: true, userId: true },
  });
  if (!workerProfile) return { error: "Worker profile not found" };

  if (shift.startTime && shift.endTime) {
    const overlappingAssignment = await db.assignment.findFirst({
      where: {
        workerProfileId,
        status: { in: ["CONFIRMED", "PENDING"] },
        shift: {
          id: { not: shiftId },
          date: shift.date,
          startTime: { lt: shift.endTime },
          endTime: { gt: shift.startTime },
          deletedAt: null,
        },
      },
      include: { shift: { select: { title: true } } },
    });
    if (overlappingAssignment) {
      return {
        error: `Worker has an overlapping shift: "${overlappingAssignment.shift?.title ?? "Unknown"}"`,
      };
    }
  }

  const assignment = await db.assignment.create({
    data: {
      workerProfileId,
      shiftId,
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: shift.companyId,
      action: "ASSIGNMENT_CREATED",
      entityType: "Assignment",
      entityId: assignment.id,
      after: { shiftId, workerProfileId },
    },
  });

  // Notify the worker (workerProfile already fetched above)
  if (workerProfile) {
    await db.notification.create({
      data: {
        userId: workerProfile.userId,
        title: "Shift Assigned",
        message: `You've been assigned to "${shift.title}"`,
        type: "shift_assignment",
        link: "/worker/shifts",
      },
    });
  }

  revalidatePath("/company/shifts");
  revalidatePath("/company/assignments");
  return { success: true };
}

export async function cancelAssignment(assignmentId: string) {
  const user = await getSessionUser();

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: { shift: { select: { companyId: true, title: true } }, workerProfile: { select: { userId: true } } },
  });
  if (!assignment) return { error: "Assignment not found" };

  const callerMembership = await db.companyMembership.findFirst({
    where: {
      userId: user.id,
      companyId: assignment.shift?.companyId,
      status: "APPROVED",
      role: { in: ["admin", "manager"] },
    },
  });
  if (!callerMembership) return { error: "Not authorized" };

  await db.assignment.update({
    where: { id: assignmentId },
    data: { status: "CANCELLED" },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: assignment.shift?.companyId,
      action: "ASSIGNMENT_CANCELLED",
      entityType: "Assignment",
      entityId: assignmentId,
    },
  });

  await db.notification.create({
    data: {
      userId: assignment.workerProfile.userId,
      title: "Assignment Cancelled",
      message: `Your assignment to "${assignment.shift?.title}" has been cancelled`,
      type: "shift_assignment",
      link: "/worker/shifts",
    },
  });

  revalidatePath("/company/shifts");
  revalidatePath("/company/assignments");
  return { success: true };
}

export async function handleShiftRequest(assignmentId: string, approve: boolean) {
  const user = await getSessionUser();

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      shift: { select: { companyId: true, title: true, capacity: true } },
      workerProfile: { select: { userId: true } },
    },
  });
  if (!assignment) return { error: "Assignment not found" };
  if (assignment.status !== "PENDING") return { error: "This request has already been handled" };

  const callerMembership = await db.companyMembership.findFirst({
    where: {
      userId: user.id,
      companyId: assignment.shift?.companyId,
      status: "APPROVED",
      role: { in: ["admin", "manager"] },
    },
  });
  if (!callerMembership) return { error: "Not authorized" };

  if (approve) {
    const confirmedCount = await db.assignment.count({
      where: { shiftId: assignment.shiftId, status: { in: ["CONFIRMED", "IN_PROGRESS"] } },
    });
    if (assignment.shift && confirmedCount >= assignment.shift.capacity) {
      return { error: "Shift is already at full capacity" };
    }

    await db.assignment.update({
      where: { id: assignmentId },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });

    await db.notification.create({
      data: {
        userId: assignment.workerProfile.userId,
        title: "Shift Request Approved",
        message: `Your request for "${assignment.shift?.title}" has been approved`,
        type: "shift_assignment",
        link: "/worker/shifts",
      },
    });
  } else {
    await db.assignment.update({
      where: { id: assignmentId },
      data: { status: "CANCELLED" },
    });

    await db.notification.create({
      data: {
        userId: assignment.workerProfile.userId,
        title: "Shift Request Declined",
        message: `Your request for "${assignment.shift?.title}" was not approved`,
        type: "shift_assignment",
        link: "/worker/shifts",
      },
    });
  }

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: assignment.shift?.companyId,
      action: approve ? "ASSIGNMENT_CREATED" : "ASSIGNMENT_CANCELLED",
      entityType: "Assignment",
      entityId: assignmentId,
    },
  });

  revalidatePath("/company/assignments");
  revalidatePath("/company/shifts");
  return { success: true };
}

export async function requestShift(shiftId: string) {
  const user = await getSessionUser();

  const shift = await db.shift.findUnique({
    where: { id: shiftId },
  });
  if (!shift) return { error: "Shift not found" };

  const membership = await db.companyMembership.findFirst({
    where: { userId: user.id, companyId: shift.companyId, status: "APPROVED" },
  });
  if (!membership) return { error: "You are not a member of this company" };

  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!workerProfile) return { error: "Worker profile not found" };

  const existing = await db.assignment.findFirst({
    where: { shiftId, workerProfileId: workerProfile.id, status: { not: "CANCELLED" } },
  });
  if (existing) return { error: "You already have a request or assignment for this shift" };

  const confirmedCount = await db.assignment.count({
    where: { shiftId, status: { in: ["CONFIRMED", "PENDING"] } },
  });
  if (confirmedCount >= shift.capacity) {
    return { error: "This shift is already at full capacity" };
  }

  // Check for overlapping shifts for this worker on the same date/time
  if (shift.startTime && shift.endTime) {
    const overlappingAssignment = await db.assignment.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        status: { in: ["CONFIRMED", "PENDING"] },
        shift: {
          id: { not: shiftId },
          date: shift.date,
          startTime: { lt: shift.endTime },
          endTime: { gt: shift.startTime },
          deletedAt: null,
        },
      },
      include: { shift: { select: { title: true } } },
    });
    if (overlappingAssignment) {
      return {
        error: `You have an overlapping shift: "${overlappingAssignment.shift?.title ?? "Unknown"}"`,
      };
    }
  }

  const assignment = await db.assignment.create({
    data: {
      workerProfileId: workerProfile.id,
      shiftId,
      status: "PENDING",
      notes: "Worker requested this shift",
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: shift.companyId,
      action: "ASSIGNMENT_CREATED",
      entityType: "Assignment",
      entityId: assignment.id,
      after: { shiftId, requestedByWorker: true },
    },
  });

  // Notify company admins
  const admins = await db.companyMembership.findMany({
    where: { companyId: shift.companyId, status: "APPROVED", role: { in: ["admin", "manager"] } },
    select: { userId: true },
  });
  for (const admin of admins) {
    await db.notification.create({
      data: {
        userId: admin.userId,
        title: "Shift Request",
        message: `${user.name} has requested the shift "${shift.title}"`,
        type: "shift_request",
        link: "/company/assignments",
      },
    });
  }

  revalidatePath("/worker/shifts");
  return { success: true };
}
