import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? [] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/**
 * Common soft-delete filter. Add to `where` clauses on models that have deletedAt.
 * Usage: where: { ...notDeleted, companyId: "..." }
 */
export const notDeleted = { deletedAt: null } as const;

/**
 * Soft-delete a record by setting deletedAt to now.
 */
export function softDeleteData() {
  return { deletedAt: new Date() };
}
