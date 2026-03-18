import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JoinCompanyForm } from "@/components/worker/join-company-form";
import { ProfileEditForm } from "@/components/worker/profile-edit-form";
import { AvailabilityEditor } from "@/components/worker/availability-editor";
import { getAvailability } from "@/actions/availability";
import { User, Building2, Calendar } from "lucide-react";

export default async function WorkerProfilePage() {
  const user = await requireRole("WORKER");

  const [profile, memberships] = await Promise.all([
    db.workerProfile.findUnique({ where: { userId: user.id } }),
    db.companyMembership.findMany({
      where: { userId: user.id },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const availabilitySlots = profile
    ? await getAvailability(profile.id)
    : [];

  const fullUser = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, phone: true, timezone: true },
  });

  return (
    <div>
      <TopBar title="Profile" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Personal info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={18} />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fullUser && (
              <ProfileEditForm
                user={{
                  name: fullUser.name,
                  email: fullUser.email,
                  phone: fullUser.phone,
                  timezone: fullUser.timezone,
                }}
                profile={profile ? {
                  licenseNumber: profile.licenseNumber,
                  licenseState: profile.licenseState,
                  licenseExpiry: profile.licenseExpiry,
                  specialties: profile.specialties,
                  bio: profile.bio,
                  hourlyRate: profile.hourlyRate,
                } : null}
              />
            )}
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={18} />
              Weekly Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AvailabilityEditor initialSlots={availabilitySlots} />
          </CardContent>
        </Card>

        {/* Company connections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 size={18} />
              Company Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <JoinCompanyForm />

            {memberships.length > 0 && (
              <div className="mt-6 space-y-3">
                {memberships.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{m.company.name}</p>
                      <p className="text-xs text-gray-500">
                        Joined {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "Pending"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        m.status === "APPROVED" ? "success" :
                        m.status === "PENDING" ? "warning" :
                        "danger"
                      }
                    >
                      {m.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
