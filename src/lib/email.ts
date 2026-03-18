export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email. Currently logs to console in development.
 * Designed to be swapped out for SendGrid, Resend, or SES.
 *
 * To integrate a real provider:
 *   1. Install the provider SDK
 *   2. Replace the body of this function with the provider's send call
 *   3. Set the required env vars (API key, from address, etc.)
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html } = payload;

  // Guard: require a valid-looking address
  if (!to || !to.includes("@")) {
    return { success: false, error: "Invalid recipient email" };
  }

  try {
    if (process.env.NODE_ENV === "development" || !process.env.EMAIL_PROVIDER_API_KEY) {
      // Development / no-provider mode: log to console
      console.log("──────────── EMAIL ────────────");
      console.log(`To:      ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:    ${html.slice(0, 200)}...`);
      console.log("───────────────────────────────");
      return { success: true };
    }

    // ── Production placeholder ──
    // Replace this block with your email provider integration:
    //
    // import { Resend } from "resend";
    // const resend = new Resend(process.env.EMAIL_PROVIDER_API_KEY);
    // await resend.emails.send({
    //   from: process.env.EMAIL_FROM ?? "noreply@shiftpulse.app",
    //   to,
    //   subject,
    //   html,
    // });

    console.log(`[Email] Would send to ${to}: "${subject}"`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("[Email] Send failed:", message);
    return { success: false, error: message };
  }
}
