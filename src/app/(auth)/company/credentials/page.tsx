import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { TopBar } from "@/components/layout/top-bar";
import {
  getCompanyCredentialsDashboard,
  getCredentialStats,
  getExpiringCredentials,
} from "@/actions/credentials";
import { CompanyCredentialsClient } from "./client";

export default async function CompanyCredentialsPage() {
  const user = await requireRole("COMPANY");

  // Get the company for this user
  const membership = await db.companyMembership.findFirst({
    where: { userId: user.id, status: "APPROVED", deletedAt: null },
    select: { companyId: true },
  });

  if (!membership) {
    return (
      <div>
        <TopBar title="Credentials" subtitle="Compliance dashboard" />
        <div className="p-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-gray-500">No company found. Please set up your company first.</p>
          </div>
        </div>
      </div>
    );
  }

  const [dashboardData, stats, expiringCredentials] = await Promise.all([
    getCompanyCredentialsDashboard(membership.companyId),
    getCredentialStats(membership.companyId),
    getExpiringCredentials(membership.companyId, 90),
  ]);

  const workers = "workers" in dashboardData ? dashboardData.workers : [];

  return (
    <div>
      <TopBar title="Credentials" subtitle="Worker compliance dashboard" />
      <div className="p-4 lg:p-6">
        <CompanyCredentialsClient
          workers={JSON.parse(JSON.stringify(workers))}
          stats={stats}
          expiringCredentials={JSON.parse(JSON.stringify(expiringCredentials))}
        />
      </div>
    </div>
  );
}
