"use server";

import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { generateJoinCode } from "@/lib/utils";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { sendVerificationEmail } from "@/actions/email-verification";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["WORKER", "COMPANY", "CLIENT"]),
  companyName: z.string().optional(),
});

export async function signUpAction(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string,
    companyName: formData.get("companyName") as string | undefined,
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password, role, companyName } = parsed.data;

  // Rate limit signups by email
  const rateCheck = await checkRateLimit(`signup:email:${email.toLowerCase()}`);
  if (!rateCheck.allowed) {
    return { error: `Too many attempts. Try again in ${Math.ceil((rateCheck.retryAfter || 60) / 60)} minutes.` };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role as "WORKER" | "COMPANY" | "CLIENT",
    },
  });

  if (role === "WORKER") {
    await db.workerProfile.create({
      data: { userId: user.id },
    });
  }

  if (role === "CLIENT") {
    await db.clientProfile.create({
      data: { userId: user.id },
    });
  }

  if (role === "COMPANY" && companyName) {
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const company = await db.company.create({
      data: {
        name: companyName,
        slug: slug + "-" + user.id.slice(0, 6),
        joinCode: generateJoinCode(),
      },
    });

    await db.companyMembership.create({
      data: {
        userId: user.id,
        companyId: company.id,
        status: "APPROVED",
        role: "admin",
        joinedAt: new Date(),
      },
    });

    await db.companyProfile.create({
      data: {
        userId: user.id,
        companyName,
      },
    });

    await db.settings.create({
      data: { companyId: company.id },
    });
  }

  // Send verification email in the background (don't block signup)
  sendVerificationEmail(user.id).catch((err) => {
    console.error("[Auth] Failed to send verification email:", err);
  });

  await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  return { success: true, role };
}

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  // Rate limit login by email
  const rateCheck = await checkRateLimit(`login:email:${email.toLowerCase()}`);
  if (!rateCheck.allowed) {
    return { error: `Too many login attempts. Try again in ${Math.ceil((rateCheck.retryAfter || 60) / 60)} minutes.` };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    // Reset rate limit on success
    await resetRateLimit(`login:email:${email.toLowerCase()}`);

    const user = await db.user.findUnique({
      where: { email },
      select: { role: true },
    });

    return { success: true, role: user?.role };
  } catch {
    return { error: "Invalid email or password" };
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

// ─── Password Reset ─────────────────────────────────────────────

const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function requestPasswordReset(formData: FormData) {
  const raw = { email: formData.get("email") as string };
  const parsed = requestResetSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email } = parsed.data;

  // Rate limit reset requests
  const rateCheck = await checkRateLimit(`password-reset:${email.toLowerCase()}`);
  if (!rateCheck.allowed) {
    // Still return success to not reveal if email exists
    return { success: true };
  }

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { name: true, email: true },
  });

  if (user) {
    // Delete any existing tokens for this email
    await db.passwordResetToken.deleteMany({
      where: { email: user.email },
    });

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expiresAt,
      },
    });

    // Send email
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    const template = passwordResetEmail(user.name, resetUrl);

    await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
    });
  }

  // Always return success to not reveal whether email exists
  return { success: true };
}

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function resetPassword(formData: FormData) {
  const raw = {
    token: formData.get("token") as string,
    password: formData.get("password") as string,
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { token, password } = parsed.data;

  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return { error: "Invalid or expired reset link. Please request a new one." };
  }

  if (resetToken.expiresAt < new Date()) {
    // Clean up expired token
    await db.passwordResetToken.delete({ where: { id: resetToken.id } });
    return { error: "This reset link has expired. Please request a new one." };
  }

  const user = await db.user.findUnique({
    where: { email: resetToken.email },
  });

  if (!user) {
    return { error: "Invalid or expired reset link. Please request a new one." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Delete the used token
  await db.passwordResetToken.delete({ where: { id: resetToken.id } });

  return { success: true };
}
