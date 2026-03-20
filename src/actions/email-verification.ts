"use server";

import crypto from "crypto";
import { db } from "@/lib/db";
import { sendEmail, emailVerificationEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, emailVerified: true },
  });

  if (!user) {
    return { error: "User not found" };
  }

  if (user.emailVerified) {
    return { error: "Email already verified" };
  }

  // Delete any existing tokens for this email
  await db.emailVerificationToken.deleteMany({
    where: { email: user.email },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.emailVerificationToken.create({
    data: {
      email: user.email,
      token,
      expiresAt,
    },
  });

  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;
  const template = emailVerificationEmail(user.name, verificationUrl);

  await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
  });

  return { success: true };
}

export async function verifyEmail(token: string) {
  if (!token) {
    return { error: "Verification token is required" };
  }

  const verificationToken = await db.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return { error: "Invalid or expired verification link" };
  }

  if (verificationToken.expiresAt < new Date()) {
    // Clean up expired token
    await db.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });
    return { error: "This verification link has expired. Please request a new one." };
  }

  // Find user by email and mark as verified
  const user = await db.user.findUnique({
    where: { email: verificationToken.email },
  });

  if (!user) {
    return { error: "User not found" };
  }

  await db.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });

  // Delete the used token
  await db.emailVerificationToken.delete({
    where: { id: verificationToken.id },
  });

  return { success: true };
}

export async function resendVerification(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address" };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (!user) {
    // Don't reveal whether the email exists
    return { success: true };
  }

  if (user.emailVerified) {
    return { error: "This email is already verified" };
  }

  await sendVerificationEmail(user.id);

  return { success: true };
}
