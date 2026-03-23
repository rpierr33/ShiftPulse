import { requireRole } from "@/lib/auth-utils";
import { getCompanyForUser } from "@/actions/company";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIER_PRICES, TIER_NAMES, TIER_DESCRIPTIONS } from "@/lib/subscription";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { CreditCard, Calendar, AlertTriangle } from "lucide-react";
import { BillingActions } from "./billing-actions";

export default async function BillingPage() {
  const user = await requireRole("COMPANY");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/login");

  const subscription = await db.subscription.findUnique({
    where: { companyId: company.id },
  });

  const currentTier = subscription?.tier ?? "BASIC";
  const status = subscription?.status ?? "active";
  const price = TIER_PRICES[currentTier];
  const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd ?? false;

  const statusVariant =
    status === "active" || status === "trialing"
      ? "success"
      : status === "past_due"
        ? "warning"
        : "danger";

  return (
    <div>
      <TopBar title="Billing & Subscription" subtitle="Manage your plan" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={18} />
              Current Plan
            </CardTitle>
            <CardDescription>
              Your active subscription details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {TIER_NAMES[currentTier]}
                  </h3>
                  <Badge variant={statusVariant}>
                    {cancelAtPeriodEnd ? "Cancelling" : status}
                  </Badge>
                </div>
                <p className="text-gray-500 text-sm">
                  {TIER_DESCRIPTIONS[currentTier]}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-gray-900">
                    ${price.toFixed(2)}
                  </span>
                  <span className="text-gray-400 text-sm">/ month</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 text-sm text-gray-500">
                {subscription?.currentPeriodEnd && (
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>
                      {cancelAtPeriodEnd ? "Access until" : "Next billing"}:{" "}
                      <strong className="text-gray-700">
                        {formatDate(subscription.currentPeriodEnd)}
                      </strong>
                    </span>
                  </div>
                )}
                {subscription?.trialEndsAt &&
                  status === "trialing" && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Calendar size={14} />
                      <span>
                        Trial ends:{" "}
                        <strong>
                          {formatDate(subscription.trialEndsAt)}
                        </strong>
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade / Downgrade Section */}
        <BillingActions
          currentTier={currentTier}
          cancelAtPeriodEnd={cancelAtPeriodEnd}
          status={status}
        />

        {/* Billing History Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={18} />
              Billing History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium text-xs uppercase tracking-wider">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-gray-400"
                    >
                      Billing history will appear here once Stripe is connected.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={18} />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <CreditCard size={18} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  No payment method on file
                </p>
                <p className="text-xs text-gray-400">
                  Stripe integration coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {subscription && !cancelAtPeriodEnd && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={18} />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BillingActions
                currentTier={currentTier}
                cancelAtPeriodEnd={cancelAtPeriodEnd}
                status={status}
                showCancelOnly
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
