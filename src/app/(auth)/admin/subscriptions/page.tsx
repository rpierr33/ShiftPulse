import { requireRole } from "@/lib/auth-utils";
import { getAdminSubscriptionStats } from "@/actions/billing";
import { TopBar } from "@/components/layout/top-bar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { MetricCard } from "@/components/shared/metric-card";
import { formatDate } from "@/lib/utils";
import { TIER_NAMES, TIER_PRICES } from "@/lib/subscription";
import { CreditCard } from "lucide-react";
import type { SubscriptionTier } from "@prisma/client";

const tierBadgeVariant: Record<SubscriptionTier, "default" | "success" | "warning"> = {
  BASIC: "default",
  PROFESSIONAL: "success",
  ENTERPRISE: "warning",
};

const statusBadgeVariant: Record<string, "success" | "default" | "warning" | "danger"> = {
  active: "success",
  trialing: "default",
  past_due: "warning",
  cancelled: "danger",
};

export default async function AdminSubscriptionsPage() {
  await requireRole("ADMIN");
  const result = await getAdminSubscriptionStats();

  if (!result.success) {
    return (
      <div>
        <TopBar title="Subscriptions" />
        <div className="p-6 text-red-600">Failed to load subscription data.</div>
      </div>
    );
  }

  const { totalSubscribers, mrr, byTier, subscriptions } = result.data;

  return (
    <div>
      <TopBar
        title="Subscriptions"
        subtitle={`${totalSubscribers} active subscribers`}
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Subscribers"
            value={totalSubscribers}
            color="blue"
          />
          <MetricCard
            label="Monthly Revenue"
            value={`$${mrr.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            color="green"
          />
          <MetricCard
            label="Professional"
            value={byTier.PROFESSIONAL}
            color="purple"
            subtext={`$${(byTier.PROFESSIONAL * TIER_PRICES.PROFESSIONAL).toFixed(2)} MRR`}
          />
          <MetricCard
            label="Enterprise"
            value={byTier.ENTERPRISE}
            color="amber"
            subtext={`$${(byTier.ENTERPRISE * TIER_PRICES.ENTERPRISE).toFixed(2)} MRR`}
          />
        </div>

        {/* Tier Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["BASIC", "PROFESSIONAL", "ENTERPRISE"] as const).map((tier) => (
            <Card key={tier}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{TIER_NAMES[tier]}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {byTier[tier]}
                    </p>
                  </div>
                  <Badge variant={tierBadgeVariant[tier]}>
                    ${TIER_PRICES[tier]}/mo
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={18} />
              All Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                No subscriptions yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Cancel?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.company.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tierBadgeVariant[sub.tier]}>
                          {TIER_NAMES[sub.tier]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusBadgeVariant[sub.status] ?? "secondary"
                          }
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        ${TIER_PRICES[sub.tier].toFixed(2)}/mo
                      </TableCell>
                      <TableCell>
                        {sub.currentPeriodStart
                          ? formatDate(sub.currentPeriodStart)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {sub.currentPeriodEnd
                          ? formatDate(sub.currentPeriodEnd)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {sub.cancelAtPeriodEnd ? (
                          <Badge variant="danger">Yes</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
