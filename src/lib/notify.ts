import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export type NotificationChannel = "in_app" | "email" | "push";

export interface SendNotificationOptions {
  title: string;
  message: string;
  type: string; // shift_reminder, approval_request, membership_update, etc.
  link?: string;
  channels?: NotificationChannel[];
}

/**
 * Unified notification function.
 * Creates an in-app notification and optionally sends email.
 */
export async function sendNotification(
  userId: string,
  options: SendNotificationOptions
) {
  const {
    title,
    message,
    type,
    link,
    channels = ["in_app"],
  } = options;

  // Always create the in-app notification
  const notification = await db.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      link: link ?? null,
      sentVia: channels,
    },
  });

  // Send email if requested
  if (channels.includes("email")) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: title,
        html: buildEmailHtml({ title, message, link, recipientName: user.name }),
      });
    }
  }

  return notification;
}

// ─── Email template helper ─────────────────────────────────────

function buildEmailHtml(params: {
  title: string;
  message: string;
  link?: string;
  recipientName: string;
}): string {
  const { title, message, link, recipientName } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const actionUrl = link ? `${appUrl}${link}` : appUrl;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
      <div style="background: #2563eb; padding: 20px 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; font-size: 18px; margin: 0;">CareCircle</h1>
      </div>
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; margin: 0 0 8px;">Hi ${recipientName},</p>
        <h2 style="color: #111827; font-size: 16px; margin: 0 0 12px;">${title}</h2>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">${message}</p>
        ${
          link
            ? `<a href="${actionUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">View Details</a>`
            : ""
        }
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
        You received this email because you have notifications enabled on CareCircle.
      </p>
    </div>
  `.trim();
}
