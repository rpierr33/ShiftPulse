import { getSessionUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { WorkerOnboarding } from "@/components/onboarding/worker-onboarding";
import { ProviderOnboarding } from "@/components/onboarding/provider-onboarding";

export default async function OnboardingPage() {
  const user = await getSessionUser();

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { onboardingCompleted: true, role: true, phone: true },
  });

  if (!dbUser) redirect("/login");

  // Already completed? Redirect to dashboard
  if (dbUser.onboardingCompleted) {
    redirect(dbUser.role === "WORKER" ? "/worker/dashboard" : "/company/dashboard");
  }

  if (dbUser.role === "WORKER") {
    const workerProfile = await db.workerProfile.findUnique({
      where: { userId: user.id },
      include: {
        availabilitySlots: {
          where: { isRecurring: true },
          select: { dayOfWeek: true, startTime: true, endTime: true },
        },
      },
    });

    const workerData = workerProfile
      ? {
          workerType: workerProfile.workerType,
          yearsExperience: workerProfile.yearsExperience,
          bio: workerProfile.bio,
          city: workerProfile.city,
          state: workerProfile.state,
          zipCode: workerProfile.zipCode,
          serviceRadiusMiles: workerProfile.serviceRadiusMiles,
          phone: dbUser.phone,
          specialties: workerProfile.specialties,
          hourlyRate: workerProfile.hourlyRate,
          availabilitySlots: workerProfile.availabilitySlots,
          isMarketplaceVisible: workerProfile.isMarketplaceVisible,
          profileCompleteness: workerProfile.profileCompleteness,
        }
      : null;

    return (
      <div className="min-h-screen bg-gray-50">
        <WorkerOnboarding userId={user.id} existingData={workerData} />
      </div>
    );
  }

  if (dbUser.role === "COMPANY") {
    const companyProfile = await db.companyProfile.findUnique({
      where: { userId: user.id },
    });

    const membership = await db.companyMembership.findFirst({
      where: { userId: user.id },
      select: { companyId: true },
    });

    const company = membership
      ? await db.company.findUnique({ where: { id: membership.companyId } })
      : null;

    const providerData = {
      providerType: companyProfile?.providerType ?? company?.providerType ?? null,
      description: companyProfile?.description ?? company?.description ?? null,
      address: companyProfile?.address ?? company?.address ?? null,
      city: companyProfile?.city ?? company?.city ?? null,
      state: companyProfile?.state ?? company?.state ?? null,
      zipCode: companyProfile?.zipCode ?? company?.zipCode ?? null,
      phone: companyProfile?.phone ?? company?.phone ?? dbUser.phone ?? null,
      website: companyProfile?.website ?? null,
      npiNumber: companyProfile?.npiNumber ?? null,
      servicesOffered: company?.servicesOffered ?? [],
      serviceAreas: company?.serviceAreas ?? [],
      isMarketplaceVisible: company?.isMarketplaceVisible ?? false,
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <ProviderOnboarding userId={user.id} existingData={providerData} />
      </div>
    );
  }

  // Admin or unknown role - skip onboarding
  redirect("/admin/dashboard");
}
