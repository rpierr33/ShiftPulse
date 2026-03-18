"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { generatePayrollCSV } from "@/lib/payroll";
import { formatDate } from "@/lib/utils";

async function verifyCompanyAdmin(companyId: string) {
  const user = await getSessionUser();
  const membership = await db.companyMembership.findFirst({
    where: {
      userId: user.id,
      companyId,
      status: "APPROVED",
      role: { in: ["admin", "manager"] },
    },
  });
  if (!membership) {
    throw new Error("Unauthorized: not a company admin");
  }
  return user;
}

export async function generateExport(
  companyId: string,
  startDate: string,
  endDate: string,
  format: "csv" | "pdf" = "csv"
) {
  const user = await verifyCompanyAdmin(companyId);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const entries = await db.timeEntry.findMany({
    where: {
      companyId,
      clockInTime: { gte: start, lte: end },
      deletedAt: null,
    },
    include: {
      user: { select: { name: true, email: true } },
      shift: { select: { title: true } },
    },
    orderBy: [{ userId: "asc" }, { clockInTime: "asc" }],
  });

  // Fetch company settings for overtime threshold
  const settings = await db.settings.findUnique({
    where: { companyId },
  });
  const overtimeThreshold = settings?.overtimeThreshold ?? 40;
  const overtimeMultiplier = settings?.overtimeMultiplier ?? 1.5;

  const csvContent = generatePayrollCSV(entries, overtimeThreshold, overtimeMultiplier);

  const totalHours = entries.reduce((sum, e) => sum + (e.duration || 0), 0) / 60;
  const fileName = `payroll-${formatDate(start).replace(/[\s,]/g, "-")}-to-${formatDate(end).replace(/[\s,]/g, "-")}.csv`;

  const exportRecord = await db.payrollExport.create({
    data: {
      companyId,
      generatedBy: user.id,
      format,
      startDate: start,
      endDate: end,
      totalHours,
      totalEntries: entries.length,
      fileName,
      data: csvContent,
    },
  });

  return {
    id: exportRecord.id,
    fileName: exportRecord.fileName,
    totalHours,
    totalEntries: entries.length,
    createdAt: exportRecord.createdAt,
  };
}

export async function getExportHistory(companyId: string) {
  await verifyCompanyAdmin(companyId);

  const exports = await db.payrollExport.findMany({
    where: { companyId },
    select: {
      id: true,
      format: true,
      startDate: true,
      endDate: true,
      totalHours: true,
      totalEntries: true,
      fileName: true,
      createdAt: true,
      generator: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return exports;
}

export async function getExportById(exportId: string) {
  const user = await getSessionUser();

  const exportRecord = await db.payrollExport.findUnique({
    where: { id: exportId },
    include: {
      generator: { select: { name: true } },
    },
  });

  if (!exportRecord) {
    throw new Error("Export not found");
  }

  // Verify caller is admin of this company
  const membership = await db.companyMembership.findFirst({
    where: {
      userId: user.id,
      companyId: exportRecord.companyId,
      status: "APPROVED",
      role: { in: ["admin", "manager"] },
    },
  });

  if (!membership) {
    throw new Error("Unauthorized");
  }

  return exportRecord;
}
