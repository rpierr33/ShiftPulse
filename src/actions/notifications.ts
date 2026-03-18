"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

// ─── Notification preferences shape ───────────────────────────────

export interface NotificationPreferences {
  shiftReminders: boolean;
  approvalRequests: boolean;
  membershipUpdates: boolean;
  scheduleChanges: boolean;
  emailEnabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  shiftReminders: true,
  approvalRequests: true,
  membershipUpdates: true,
  scheduleChanges: true,
  emailEnabled: false,
};

// ─── Existing actions ─────────────────────────────────────────────

export async function getNotifications() {
  const user = await getSessionUser();

  return db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getUnreadCount() {
  const user = await getSessionUser();

  return db.notification.count({
    where: { userId: user.id, isRead: false },
  });
}

export async function markNotificationRead(id: string) {
  const user = await getSessionUser();

  await db.notification.updateMany({
    where: { id, userId: user.id },
    data: { isRead: true },
  });

  revalidatePath("/");
}

export async function markAllNotificationsRead() {
  const user = await getSessionUser();

  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/");
}

// ─── Notification preferences ─────────────────────────────────────

/**
 * Get the current user's notification preferences.
 * Stored as a JSON string in a special notification record.
 * Falls back to defaults if none saved.
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const user = await getSessionUser();

  const record = await db.notification.findFirst({
    where: {
      userId: user.id,
      type: "__preferences",
    },
    select: { message: true },
  });

  if (!record) return DEFAULT_PREFERENCES;

  try {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(record.message) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save the current user's notification preferences.
 * Uses an upsert-like pattern with a special notification type.
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<{ success: boolean }> {
  const user = await getSessionUser();

  // Merge with defaults to ensure all keys exist
  const current = await getNotificationPreferences();
  const merged: NotificationPreferences = { ...current, ...preferences };

  // Find existing preferences record
  const existing = await db.notification.findFirst({
    where: {
      userId: user.id,
      type: "__preferences",
    },
    select: { id: true },
  });

  if (existing) {
    await db.notification.update({
      where: { id: existing.id },
      data: { message: JSON.stringify(merged) },
    });
  } else {
    await db.notification.create({
      data: {
        userId: user.id,
        title: "Notification Preferences",
        message: JSON.stringify(merged),
        type: "__preferences",
        isRead: true,
      },
    });
  }

  revalidatePath("/");
  return { success: true };
}
