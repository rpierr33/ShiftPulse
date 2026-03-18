"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { DayOfWeek } from "@prisma/client";

const shiftTemplateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  daysOfWeek: z.array(z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"])).min(1, "Select at least one day"),
});

export async function createShiftTemplate(companyId: string, data: {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  daysOfWeek: DayOfWeek[];
}) {
  const user = await getSessionUser();

  const parsed = shiftTemplateSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const template = await db.shiftTemplate.create({
    data: {
      companyId,
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      capacity: parsed.data.capacity,
      daysOfWeek: parsed.data.daysOfWeek,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId,
      action: "SHIFT_CREATED",
      entityType: "ShiftTemplate",
      entityId: template.id,
      after: { title: parsed.data.title, daysOfWeek: parsed.data.daysOfWeek },
    },
  });

  revalidatePath("/company/shifts/templates");
  return { success: true, templateId: template.id };
}

export async function updateShiftTemplate(templateId: string, data: {
  title?: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  daysOfWeek?: DayOfWeek[];
}) {
  const user = await getSessionUser();

  const existing = await db.shiftTemplate.findUnique({ where: { id: templateId } });
  if (!existing) return { error: "Template not found" };

  const template = await db.shiftTemplate.update({
    where: { id: templateId },
    data,
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: template.companyId,
      action: "SHIFT_UPDATED",
      entityType: "ShiftTemplate",
      entityId: template.id,
      before: existing,
      after: data,
    },
  });

  revalidatePath("/company/shifts/templates");
  return { success: true };
}

export async function deleteShiftTemplate(templateId: string) {
  const user = await getSessionUser();

  const template = await db.shiftTemplate.update({
    where: { id: templateId },
    data: { isActive: false },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      companyId: template.companyId,
      action: "SHIFT_CANCELLED",
      entityType: "ShiftTemplate",
      entityId: template.id,
    },
  });

  revalidatePath("/company/shifts/templates");
  return { success: true };
}


const JS_TO_DAY: Record<number, DayOfWeek> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

export async function generateShiftsFromTemplates(
  companyId: string,
  startDate: string,
  endDate: string
) {
  const user = await getSessionUser();

  const templates = await db.shiftTemplate.findMany({
    where: { companyId, isActive: true },
  });

  if (templates.length === 0) return { error: "No active templates found" };

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { error: "Invalid date range" };
  }

  if (end < start) {
    return { error: "End date must be after start date" };
  }

  let count = 0;

  for (const template of templates) {
    // Iterate through each day in the range
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = JS_TO_DAY[current.getDay()];

      if (template.daysOfWeek.includes(dayOfWeek)) {
        const dateStr = current.toISOString().split("T")[0];
        const shiftDate = new Date(dateStr);
        const shiftStart = new Date(`${dateStr}T${template.startTime}:00`);
        const shiftEnd = new Date(`${dateStr}T${template.endTime}:00`);

        // Check if a shift already exists for this template+date combo
        const existing = await db.shift.findFirst({
          where: {
            companyId,
            title: template.title,
            date: shiftDate,
            startTime: shiftStart,
            endTime: shiftEnd,
            deletedAt: null,
          },
        });

        if (!existing) {
          await db.shift.create({
            data: {
              companyId,
              title: template.title,
              description: template.description,
              location: template.location,
              latitude: template.latitude,
              longitude: template.longitude,
              date: shiftDate,
              startTime: shiftStart,
              endTime: shiftEnd,
              capacity: template.capacity,
            },
          });
          count++;
        }
      }

      current.setDate(current.getDate() + 1);
    }
  }

  if (count > 0) {
    await db.auditLog.create({
      data: {
        actorId: user.id,
        companyId,
        action: "SHIFT_CREATED",
        entityType: "Shift",
        entityId: companyId,
        after: { generatedFromTemplates: true, count, startDate, endDate },
      },
    });

    revalidatePath("/company/shifts");
    revalidatePath("/company/shifts/templates");
  }

  return { success: true, count };
}

export async function getShiftTemplates(companyId: string) {
  return db.shiftTemplate.findMany({
    where: { companyId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}
