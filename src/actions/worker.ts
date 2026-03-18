"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  licenseExpiry: z.string().optional(),
  specialties: z.string().optional(),
  bio: z.string().optional(),
  hourlyRate: z.string().optional(),
});

export async function updateWorkerProfile(formData: FormData) {
  const user = await getSessionUser();

  const raw = {
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    timezone: formData.get("timezone") as string,
    licenseNumber: formData.get("licenseNumber") as string,
    licenseState: formData.get("licenseState") as string,
    licenseExpiry: formData.get("licenseExpiry") as string,
    specialties: formData.get("specialties") as string,
    bio: formData.get("bio") as string,
    hourlyRate: formData.get("hourlyRate") as string,
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, phone, timezone, licenseNumber, licenseState, licenseExpiry, specialties, bio, hourlyRate } = parsed.data;

  // Parse specialties from comma-separated string
  const specialtiesArray = specialties
    ? specialties.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // Parse hourly rate
  const parsedRate = hourlyRate ? parseFloat(hourlyRate) : null;
  if (hourlyRate && (parsedRate === null || isNaN(parsedRate))) {
    return { error: "Invalid hourly rate" };
  }

  // Parse license expiry
  const parsedExpiry = licenseExpiry ? new Date(licenseExpiry) : null;

  try {
    // Update user record
    await db.user.update({
      where: { id: user.id },
      data: {
        name,
        phone: phone || null,
        timezone,
      },
    });

    // Update worker profile
    await db.workerProfile.update({
      where: { userId: user.id },
      data: {
        licenseNumber: licenseNumber || null,
        licenseState: licenseState || null,
        licenseExpiry: parsedExpiry,
        specialties: specialtiesArray,
        bio: bio || null,
        hourlyRate: parsedRate,
      },
    });

    revalidatePath("/worker/profile");
    return { success: true };
  } catch {
    return { error: "Failed to update profile. Please try again." };
  }
}
