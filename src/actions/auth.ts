"use server";

import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { generateJoinCode } from "@/lib/utils";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["WORKER", "COMPANY"]),
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
      role: role as "WORKER" | "COMPANY",
    },
  });

  if (role === "WORKER") {
    await db.workerProfile.create({
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
