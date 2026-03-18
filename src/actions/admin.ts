"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function getAdminDashboardMetrics() {
  await requireRole("ADMIN");

  const [companyCount, workerCount, timeEntryCount, flaggedCount] =
    await Promise.all([
      db.company.count({ where: { isActive: true } }),
      db.user.count({ where: { role: "WORKER", isActive: true } }),
      db.timeEntry.count(),
      db.timeEntry.count({ where: { isManualEntry: true } }),
    ]);

  return { companyCount, workerCount, timeEntryCount, flaggedCount };
}

export async function getAllCompanies(page = 1, pageSize = 20) {
  await requireRole("ADMIN");

  const [companies, total] = await Promise.all([
    db.company.findMany({
      include: {
        _count: {
          select: {
            memberships: { where: { status: "APPROVED" } },
            timeEntries: true,
            shifts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.company.count(),
  ]);

  return { companies, total, pages: Math.ceil(total / pageSize) };
}

export async function getAllUsers(page = 1, pageSize = 20) {
  await requireRole("ADMIN");

  const [users, total] = await Promise.all([
    db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { memberships: true, timeEntries: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.user.count(),
  ]);

  return { users, total, pages: Math.ceil(total / pageSize) };
}

export async function getAuditLogs(page = 1, pageSize = 50) {
  await requireRole("ADMIN");

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      include: {
        actor: { select: { name: true, email: true } },
        company: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.auditLog.count(),
  ]);

  return { logs, total, pages: Math.ceil(total / pageSize) };
}

export async function getAllTimeEntries(page = 1, pageSize = 50) {
  await requireRole("ADMIN");

  const [entries, total] = await Promise.all([
    db.timeEntry.findMany({
      include: {
        user: { select: { name: true, email: true } },
        company: { select: { name: true } },
        shift: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.timeEntry.count(),
  ]);

  return { entries, total, pages: Math.ceil(total / pageSize) };
}

export async function toggleUserActive(userId: string) {
  await requireRole("ADMIN");

  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  await db.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  revalidatePath("/admin/users");
}

export async function toggleCompanyActive(companyId: string) {
  await requireRole("ADMIN");

  const company = await db.company.findUniqueOrThrow({ where: { id: companyId } });
  await db.company.update({
    where: { id: companyId },
    data: { isActive: !company.isActive },
  });

  revalidatePath("/admin/companies");
}
