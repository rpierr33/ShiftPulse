import { logger } from "@/lib/logger";

// ─── Types ──────────────────────────────────────────────────────

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
}

export interface SendEmailResult {
  success: boolean;
  error?: string;
}

// ─── Configuration ──────────────────────────────────────────────

const EMAIL_FROM = process.env.EMAIL_FROM ?? "ShiftPulse <noreply@shiftpulse.app>";
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER ?? "console"; // "resend" | "console"
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// ─── Provider: send via Resend ──────────────────────────────────

async function sendViaResend(
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    logger.warn(
      "EMAIL_PROVIDER is set to 'resend' but RESEND_API_KEY is missing. " +
        "Skipping email send. Set RESEND_API_KEY in your environment to enable delivery."
    );
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error(`Resend API error`, { status: res.status, body });
    return { success: false, error: `Resend API error ${res.status}` };
  }

  return { success: true };
}

// ─── Provider: log to console (development) ─────────────────────

async function sendViaConsole(
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  logger.info("Email sent (console provider)", {
    to,
    subject,
    bodyPreview: html.slice(0, 300),
  });
  return { success: true };
}

// ─── Core send function ─────────────────────────────────────────

export async function sendEmail(
  payload: EmailPayload
): Promise<SendEmailResult> {
  const { to, subject, html } = payload;

  if (!to || !to.includes("@")) {
    return { success: false, error: "Invalid recipient email" };
  }

  try {
    if (
      process.env.NODE_ENV === "development" ||
      EMAIL_PROVIDER === "console"
    ) {
      return sendViaConsole(to, subject, html);
    }

    if (EMAIL_PROVIDER === "resend") {
      return sendViaResend(to, subject, html);
    }

    // Unknown provider — fall back to console logging
    logger.warn(
      `Unknown EMAIL_PROVIDER "${EMAIL_PROVIDER}". Falling back to console.`
    );
    return sendViaConsole(to, subject, html);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown email error";
    logger.error("Email send failed", { error: message });
    return { success: false, error: message };
  }
}

// ─── Shared layout helper ───────────────────────────────────────

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function layout(body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px; margin:0 auto; padding:32px 16px;">
    <div style="background:#2563eb; padding:20px 24px; border-radius:12px 12px 0 0;">
      <h1 style="color:#ffffff; font-size:18px; margin:0; letter-spacing:-0.025em;">ShiftPulse</h1>
    </div>
    <div style="background:#ffffff; border:1px solid #e5e7eb; border-top:none; padding:24px; border-radius:0 0 12px 12px;">
      ${body}
    </div>
    <p style="color:#9ca3af; font-size:12px; text-align:center; margin-top:16px;">
      You received this email because you have an account on
      <a href="${APP_URL}" style="color:#9ca3af;">ShiftPulse</a>.
    </p>
  </div>
</body>
</html>`.trim();
}

function button(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block; background:#2563eb; color:#ffffff; padding:10px 24px; border-radius:8px; text-decoration:none; font-size:14px; font-weight:600;">${label}</a>`;
}

function greeting(name: string): string {
  return `<p style="color:#374151; margin:0 0 16px;">Hi ${name},</p>`;
}

function paragraph(text: string): string {
  return `<p style="color:#4b5563; font-size:14px; line-height:1.6; margin:0 0 16px;">${text}</p>`;
}

function spacer(): string {
  return `<div style="height:8px;"></div>`;
}

// ─── Email templates ────────────────────────────────────────────

export function welcomeEmail(name: string): EmailTemplate {
  return {
    subject: "Welcome to ShiftPulse!",
    html: layout(
      greeting(name) +
        paragraph(
          "Thanks for joining ShiftPulse — the modern workforce management platform built for healthcare teams."
        ) +
        paragraph(
          "You can now manage your profile, view available shifts, and track your time entries all in one place."
        ) +
        spacer() +
        button("Get Started", `${APP_URL}/dashboard`)
    ),
  };
}

export function passwordResetEmail(
  name: string,
  resetUrl: string
): EmailTemplate {
  return {
    subject: "Reset your ShiftPulse password",
    html: layout(
      greeting(name) +
        paragraph(
          "We received a request to reset your password. Click the button below to choose a new one. This link will expire in 1 hour."
        ) +
        spacer() +
        button("Reset Password", resetUrl) +
        spacer() +
        paragraph(
          "If you didn't request a password reset, you can safely ignore this email. Your password will not change."
        )
    ),
  };
}

export interface ShiftDetails {
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  role?: string;
}

export function shiftAssignedEmail(
  name: string,
  shiftDetails: ShiftDetails
): EmailTemplate {
  const { date, startTime, endTime, location, role } = shiftDetails;

  const detailRows = [
    `<tr><td style="color:#6b7280; padding:4px 12px 4px 0; font-size:14px;">Date</td><td style="color:#111827; font-size:14px;">${date}</td></tr>`,
    `<tr><td style="color:#6b7280; padding:4px 12px 4px 0; font-size:14px;">Time</td><td style="color:#111827; font-size:14px;">${startTime} – ${endTime}</td></tr>`,
    `<tr><td style="color:#6b7280; padding:4px 12px 4px 0; font-size:14px;">Location</td><td style="color:#111827; font-size:14px;">${location}</td></tr>`,
    role
      ? `<tr><td style="color:#6b7280; padding:4px 12px 4px 0; font-size:14px;">Role</td><td style="color:#111827; font-size:14px;">${role}</td></tr>`
      : "",
  ].join("");

  const table = `<table style="margin:0 0 16px; border-collapse:collapse;">${detailRows}</table>`;

  return {
    subject: `Shift assigned: ${date} at ${location}`,
    html: layout(
      greeting(name) +
        paragraph("You have been assigned a new shift:") +
        table +
        button("View Shift", `${APP_URL}/dashboard/shifts`)
    ),
  };
}

export interface TimeEntryDetails {
  date: string;
  hoursWorked: string;
  location: string;
}

export function timeEntryApprovedEmail(
  name: string,
  entryDetails: TimeEntryDetails
): EmailTemplate {
  const { date, hoursWorked, location } = entryDetails;

  return {
    subject: `Time entry approved — ${date}`,
    html: layout(
      greeting(name) +
        paragraph("Your time entry has been approved:") +
        `<table style="margin:0 0 16px; border-collapse:collapse;">
          <tr><td style="color:#6b7280; padding:4px 12px 4px 0; font-size:14px;">Date</td><td style="color:#111827; font-size:14px;">${date}</td></tr>
          <tr><td style="color:#6b7280; padding:4px 12px 4px 0; font-size:14px;">Hours</td><td style="color:#111827; font-size:14px;">${hoursWorked}</td></tr>
          <tr><td style="color:#6b7280; padding:4px 12px 4px 0; font-size:14px;">Location</td><td style="color:#111827; font-size:14px;">${location}</td></tr>
        </table>` +
        button("View Time Entries", `${APP_URL}/dashboard/time-entries`)
    ),
  };
}

export function emailVerificationEmail(
  name: string,
  verificationUrl: string
): EmailTemplate {
  return {
    subject: "Verify your ShiftPulse email",
    html: layout(
      greeting(name) +
        paragraph(
          "Thanks for signing up! Please verify your email address by clicking the button below. This link will expire in 24 hours."
        ) +
        spacer() +
        button("Verify Email", verificationUrl) +
        spacer() +
        paragraph(
          "If you didn't create an account on ShiftPulse, you can safely ignore this email."
        )
    ),
  };
}

export function workerApprovedEmail(
  name: string,
  companyName: string
): EmailTemplate {
  return {
    subject: `You've been approved by ${companyName}`,
    html: layout(
      greeting(name) +
        paragraph(
          `Great news! <strong>${companyName}</strong> has approved your worker profile. You can now be assigned to shifts and start logging time.`
        ) +
        spacer() +
        button("View Dashboard", `${APP_URL}/dashboard`)
    ),
  };
}
