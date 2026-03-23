"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

// ─── Worker Actions ─────────────────────────────────────────────

export async function getWorkerCredentials(workerProfileId?: string) {
  const user = await getSessionUser();

  let profileId = workerProfileId;

  if (!profileId) {
    const profile = await db.workerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) return [];
    profileId = profile.id;
  }

  const credentials = await db.credential.findMany({
    where: { workerProfileId: profileId },
    orderBy: { createdAt: "desc" },
  });

  return credentials;
}

export async function uploadCredential(data: {
  type: string;
  name: string;
  licenseNumber?: string;
  issuingAuthority?: string;
  issueDate?: string;
  expiryDate?: string;
  documentUrl?: string;
}) {
  const user = await getSessionUser();

  const profile = await db.workerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!profile) {
    return { error: "Worker profile not found. Please complete your profile first." };
  }

  if (!data.type || !data.name) {
    return { error: "Credential type and name are required." };
  }

  try {
    const credential = await db.credential.create({
      data: {
        workerProfileId: profile.id,
        type: data.type,
        name: data.name,
        licenseNumber: data.licenseNumber || null,
        issuingAuthority: data.issuingAuthority || null,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        documentUrl: data.documentUrl || null,
        status: "PENDING",
      },
    });

    revalidatePath("/worker/credentials");
    return { success: true, credential };
  } catch {
    return { error: "Failed to upload credential. Please try again." };
  }
}

export async function updateCredential(
  id: string,
  data: {
    type?: string;
    name?: string;
    licenseNumber?: string;
    issuingAuthority?: string;
    issueDate?: string;
    expiryDate?: string;
    documentUrl?: string;
  }
) {
  const user = await getSessionUser();

  // Verify ownership
  const credential = await db.credential.findUnique({
    where: { id },
    include: { workerProfile: { select: { userId: true } } },
  });

  if (!credential) {
    return { error: "Credential not found." };
  }

  if (credential.workerProfile.userId !== user.id) {
    return { error: "You do not have permission to edit this credential." };
  }

  try {
    const updated = await db.credential.update({
      where: { id },
      data: {
        ...(data.type !== undefined && { type: data.type }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber || null }),
        ...(data.issuingAuthority !== undefined && { issuingAuthority: data.issuingAuthority || null }),
        ...(data.issueDate !== undefined && { issueDate: data.issueDate ? new Date(data.issueDate) : null }),
        ...(data.expiryDate !== undefined && { expiryDate: data.expiryDate ? new Date(data.expiryDate) : null }),
        ...(data.documentUrl !== undefined && { documentUrl: data.documentUrl || null }),
        status: "PENDING", // Reset to pending on edit
      },
    });

    revalidatePath("/worker/credentials");
    return { success: true, credential: updated };
  } catch {
    return { error: "Failed to update credential. Please try again." };
  }
}

export async function deleteCredential(id: string) {
  const user = await getSessionUser();

  const credential = await db.credential.findUnique({
    where: { id },
    include: { workerProfile: { select: { userId: true } } },
  });

  if (!credential) {
    return { error: "Credential not found." };
  }

  if (credential.workerProfile.userId !== user.id) {
    return { error: "You do not have permission to delete this credential." };
  }

  try {
    await db.credential.delete({ where: { id } });
    revalidatePath("/worker/credentials");
    return { success: true };
  } catch {
    return { error: "Failed to delete credential. Please try again." };
  }
}

// ─── Company / Admin Actions ────────────────────────────────────

export async function verifyCredential(id: string) {
  const user = await getSessionUser();

  if (user.role !== "COMPANY" && user.role !== "ADMIN") {
    return { error: "Only companies and admins can verify credentials." };
  }

  const credential = await db.credential.findUnique({ where: { id } });
  if (!credential) {
    return { error: "Credential not found." };
  }

  try {
    await db.credential.update({
      where: { id },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        verifiedBy: user.id,
        notes: null,
      },
    });

    revalidatePath("/company/credentials");
    revalidatePath("/worker/credentials");
    return { success: true };
  } catch {
    return { error: "Failed to verify credential. Please try again." };
  }
}

export async function rejectCredential(id: string, reason: string) {
  const user = await getSessionUser();

  if (user.role !== "COMPANY" && user.role !== "ADMIN") {
    return { error: "Only companies and admins can reject credentials." };
  }

  if (!reason || reason.trim().length === 0) {
    return { error: "A rejection reason is required." };
  }

  const credential = await db.credential.findUnique({ where: { id } });
  if (!credential) {
    return { error: "Credential not found." };
  }

  try {
    await db.credential.update({
      where: { id },
      data: {
        status: "REJECTED",
        notes: reason.trim(),
      },
    });

    revalidatePath("/company/credentials");
    revalidatePath("/worker/credentials");
    return { success: true };
  } catch {
    return { error: "Failed to reject credential. Please try again." };
  }
}

export async function getCompanyCredentialsDashboard(companyId: string) {
  const user = await getSessionUser();

  if (user.role !== "COMPANY" && user.role !== "ADMIN") {
    return { error: "Access denied.", workers: [] };
  }

  // Get all approved workers in the company
  const memberships = await db.companyMembership.findMany({
    where: {
      companyId,
      status: "APPROVED",
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          workerProfile: {
            select: {
              id: true,
              workerType: true,
              credentials: {
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      },
    },
  });

  const workers = memberships
    .filter((m) => m.user.workerProfile)
    .map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      workerType: m.user.workerProfile!.workerType,
      workerProfileId: m.user.workerProfile!.id,
      credentials: m.user.workerProfile!.credentials,
    }));

  return { workers };
}

export async function getExpiringCredentials(companyId: string, daysAhead: number) {
  const user = await getSessionUser();

  if (user.role !== "COMPANY" && user.role !== "ADMIN") {
    return [];
  }

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  // Get worker profile IDs from company memberships
  const memberships = await db.companyMembership.findMany({
    where: {
      companyId,
      status: "APPROVED",
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          name: true,
          workerProfile: { select: { id: true } },
        },
      },
    },
  });

  const workerProfileIds = memberships
    .filter((m) => m.user.workerProfile)
    .map((m) => m.user.workerProfile!.id);

  if (workerProfileIds.length === 0) return [];

  const credentials = await db.credential.findMany({
    where: {
      workerProfileId: { in: workerProfileIds },
      expiryDate: {
        lte: futureDate,
        gte: new Date(), // Not already expired
      },
      status: { not: "EXPIRED" },
    },
    include: {
      workerProfile: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { expiryDate: "asc" },
  });

  return credentials;
}

export async function getCredentialStats(companyId: string) {
  const user = await getSessionUser();

  if (user.role !== "COMPANY" && user.role !== "ADMIN") {
    return { verified: 0, pending: 0, expired: 0, expiringSoon: 0, total: 0 };
  }

  const memberships = await db.companyMembership.findMany({
    where: {
      companyId,
      status: "APPROVED",
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          workerProfile: { select: { id: true } },
        },
      },
    },
  });

  const workerProfileIds = memberships
    .filter((m) => m.user.workerProfile)
    .map((m) => m.user.workerProfile!.id);

  if (workerProfileIds.length === 0) {
    return { verified: 0, pending: 0, expired: 0, expiringSoon: 0, total: 0 };
  }

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [verified, pending, expired, expiringSoon, total] = await Promise.all([
    db.credential.count({
      where: { workerProfileId: { in: workerProfileIds }, status: "VERIFIED" },
    }),
    db.credential.count({
      where: { workerProfileId: { in: workerProfileIds }, status: "PENDING" },
    }),
    db.credential.count({
      where: { workerProfileId: { in: workerProfileIds }, status: "EXPIRED" },
    }),
    db.credential.count({
      where: {
        workerProfileId: { in: workerProfileIds },
        status: { not: "EXPIRED" },
        expiryDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
    }),
    db.credential.count({
      where: { workerProfileId: { in: workerProfileIds } },
    }),
  ]);

  return { verified, pending, expired, expiringSoon, total };
}
