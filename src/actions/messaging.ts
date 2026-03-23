"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────────

export type ConversationPreview = {
  id: string;
  type: string;
  title: string | null;
  companyId: string | null;
  shiftId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  participants: {
    id: string;
    userId: string;
    lastReadAt: Date | null;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }[];
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    isSystem: boolean;
    createdAt: Date;
    sender: { name: string };
  } | null;
  unreadCount: number;
};

export type ConversationWithMessages = {
  id: string;
  type: string;
  title: string | null;
  companyId: string | null;
  shiftId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  participants: {
    id: string;
    userId: string;
    lastReadAt: Date | null;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }[];
  messages: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
    sender: {
      id: string;
      name: string;
    };
  }[];
};

export type SearchableUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

// ─── Get all conversations for current user ──────────────────────

export async function getConversations(): Promise<ConversationPreview[]> {
  const user = await getSessionUser();

  const participantRecords = await db.conversationParticipant.findMany({
    where: { userId: user.id },
    select: { conversationId: true, lastReadAt: true },
  });

  if (participantRecords.length === 0) return [];

  const conversationIds = participantRecords.map((p) => p.conversationId);
  const lastReadMap = new Map(
    participantRecords.map((p) => [p.conversationId, p.lastReadAt])
  );

  const conversations = await db.conversation.findMany({
    where: {
      id: { in: conversationIds },
      isActive: true,
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: { select: { name: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return conversations.map((conv) => {
    const lastReadAt = lastReadMap.get(conv.id) ?? null;
    const lastMessage = conv.messages[0] ?? null;

    let unreadCount = 0;
    if (lastMessage && (!lastReadAt || lastMessage.createdAt > lastReadAt)) {
      // Count unread messages since lastReadAt
      // For now, if there's any unread, we'll mark it. We refine with a count below.
      unreadCount = 1; // placeholder, overridden below
    }

    return {
      id: conv.id,
      type: conv.type,
      title: conv.title,
      companyId: conv.companyId,
      shiftId: conv.shiftId,
      isActive: conv.isActive,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      participants: conv.participants,
      lastMessage,
      unreadCount,
    };
  });
}

// Batch count unreads properly (separate query for accuracy)
async function countUnreadMessages(
  conversationId: string,
  userId: string
): Promise<number> {
  const participant = await db.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
    select: { lastReadAt: true },
  });

  if (!participant) return 0;

  const where: { conversationId: string; senderId: { not: string }; createdAt?: { gt: Date } } = {
    conversationId,
    senderId: { not: userId },
  };

  if (participant.lastReadAt) {
    where.createdAt = { gt: participant.lastReadAt };
  }

  return db.message.count({ where });
}

// Enhanced version that includes accurate unread counts
export async function getConversationsWithUnreadCounts(): Promise<
  ConversationPreview[]
> {
  const user = await getSessionUser();
  const conversations = await getConversations();

  const withCounts = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await countUnreadMessages(conv.id, user.id);
      return { ...conv, unreadCount };
    })
  );

  return withCounts;
}

// ─── Get a single conversation with all messages ─────────────────

export async function getConversation(
  conversationId: string
): Promise<ConversationWithMessages | null> {
  const user = await getSessionUser();

  // Verify the user is a participant
  const participant = await db.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: user.id },
    },
  });

  if (!participant) return null;

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
  });

  return conversation;
}

// ─── Send a message ──────────────────────────────────────────────

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getSessionUser();

  if (!content.trim()) {
    return { success: false, error: "Message cannot be empty" };
  }

  // Verify the user is a participant
  const participant = await db.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: user.id },
    },
  });

  if (!participant) {
    return { success: false, error: "Not a participant in this conversation" };
  }

  await db.$transaction([
    db.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: content.trim(),
      },
    }),
    db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
    // Mark as read for sender
    db.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId: user.id },
      },
      data: { lastReadAt: new Date() },
    }),
  ]);

  revalidatePath("/messages");
  return { success: true };
}

// ─── Start a new conversation ────────────────────────────────────

export async function startConversation(
  participantIds: string[],
  title?: string,
  type?: string,
  companyId?: string,
  shiftId?: string
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  const user = await getSessionUser();

  // Ensure the current user is included in participants
  const allParticipantIds = Array.from(
    new Set([user.id, ...participantIds])
  );

  if (allParticipantIds.length < 2) {
    return { success: false, error: "Need at least one other participant" };
  }

  const conversation = await db.conversation.create({
    data: {
      type: type ?? (allParticipantIds.length === 2 ? "direct" : "shift_thread"),
      title: title ?? null,
      companyId: companyId ?? null,
      shiftId: shiftId ?? null,
      participants: {
        create: allParticipantIds.map((id) => ({
          userId: id,
          lastReadAt: id === user.id ? new Date() : null,
        })),
      },
    },
  });

  revalidatePath("/messages");
  return { success: true, conversationId: conversation.id };
}

// ─── Start or find a direct message conversation ─────────────────

export async function startDirectMessage(
  recipientId: string
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  const user = await getSessionUser();

  if (recipientId === user.id) {
    return { success: false, error: "Cannot message yourself" };
  }

  // Look for an existing direct conversation between these two users
  const existingParticipants = await db.conversationParticipant.findMany({
    where: { userId: user.id },
    select: { conversationId: true },
  });

  for (const ep of existingParticipants) {
    const conv = await db.conversation.findUnique({
      where: { id: ep.conversationId },
      include: {
        participants: { select: { userId: true } },
      },
    });

    if (
      conv &&
      conv.type === "direct" &&
      conv.isActive &&
      conv.participants.length === 2 &&
      conv.participants.some((p) => p.userId === recipientId)
    ) {
      return { success: true, conversationId: conv.id };
    }
  }

  // No existing conversation found, create a new one
  return startConversation([recipientId], undefined, "direct");
}

// ─── Mark conversation as read ───────────────────────────────────

export async function markAsRead(
  conversationId: string
): Promise<{ success: boolean }> {
  const user = await getSessionUser();

  await db.conversationParticipant.updateMany({
    where: {
      conversationId,
      userId: user.id,
    },
    data: { lastReadAt: new Date() },
  });

  revalidatePath("/messages");
  return { success: true };
}

// ─── Get total unread message count ──────────────────────────────

export async function getUnreadMessageCount(): Promise<number> {
  const user = await getSessionUser();

  const participantRecords = await db.conversationParticipant.findMany({
    where: { userId: user.id },
    select: { conversationId: true, lastReadAt: true },
  });

  if (participantRecords.length === 0) return 0;

  let total = 0;
  for (const record of participantRecords) {
    const where: { conversationId: string; senderId: { not: string }; createdAt?: { gt: Date } } = {
      conversationId: record.conversationId,
      senderId: { not: user.id },
    };

    if (record.lastReadAt) {
      where.createdAt = { gt: record.lastReadAt };
    }

    const count = await db.message.count({ where });
    total += count;
  }

  return total;
}

// ─── Search users ────────────────────────────────────────────────

export async function searchUsers(query: string): Promise<SearchableUser[]> {
  const user = await getSessionUser();

  if (!query.trim() || query.trim().length < 2) return [];

  const users = await db.user.findMany({
    where: {
      AND: [
        { id: { not: user.id } },
        { isActive: true },
        { deletedAt: null },
        {
          OR: [
            { name: { contains: query.trim(), mode: "insensitive" } },
            { email: { contains: query.trim(), mode: "insensitive" } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    take: 10,
    orderBy: { name: "asc" },
  });

  return users;
}

// ─── Create broadcast ────────────────────────────────────────────

export async function createBroadcast(
  companyId: string,
  title: string,
  content: string,
  recipientFilter?: "all" | "workers" | "managers"
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  const user = await getSessionUser();

  if (user.role !== "COMPANY" && user.role !== "ADMIN") {
    return { success: false, error: "Only company users can create broadcasts" };
  }

  // Get company members based on filter
  const memberWhere: { companyId: string; status: "APPROVED"; role?: string } = {
    companyId,
    status: "APPROVED",
  };

  if (recipientFilter === "workers") {
    memberWhere.role = "worker";
  } else if (recipientFilter === "managers") {
    memberWhere.role = "manager";
  }

  const members = await db.companyMembership.findMany({
    where: memberWhere,
    select: { userId: true },
  });

  if (members.length === 0) {
    return { success: false, error: "No recipients found" };
  }

  const participantIds = Array.from(
    new Set([user.id, ...members.map((m) => m.userId)])
  );

  const conversation = await db.conversation.create({
    data: {
      type: "broadcast",
      title,
      companyId,
      participants: {
        create: participantIds.map((id) => ({
          userId: id,
          lastReadAt: id === user.id ? new Date() : null,
        })),
      },
      messages: {
        create: {
          senderId: user.id,
          content,
          isSystem: false,
        },
      },
    },
  });

  revalidatePath("/messages");
  return { success: true, conversationId: conversation.id };
}
