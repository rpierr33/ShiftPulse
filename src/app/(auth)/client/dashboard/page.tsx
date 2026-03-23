import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, CalendarCheck, MessageSquare, ArrowRight, Heart } from "lucide-react";
import Link from "next/link";
import { SERVICE_TYPES, WORKER_TYPE_SHORT } from "@/types";
import type { WorkerType } from "@prisma/client";

const STATUS_VARIANT: Record<string, "warning" | "success" | "danger" | "default" | "secondary"> = {
  pending: "warning",
  accepted: "success",
  declined: "danger",
  completed: "default",
  cancelled: "secondary",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getServiceLabel(value: string): string {
  return SERVICE_TYPES.find((s) => s.value === value)?.label ?? value;
}

export default async function ClientDashboardPage() {
  const user = await requireRole("CLIENT");

  const upcomingBookings = await db.booking.findMany({
    where: {
      clientId: user.id,
      status: { in: ["pending", "accepted"] },
      startDate: { gte: new Date() },
    },
    include: {
      workerProfile: {
        include: {
          user: { select: { name: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { startDate: "asc" },
    take: 3,
  });

  const firstName = user.name.split(" ")[0];

  return (
    <div>
      <TopBar title="Dashboard" subtitle={`Welcome back, ${firstName}`} />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Quick action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/marketplace/workers" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-orange-200">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-orange-400/20">
                  <Search size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm group-hover:text-orange-600 transition-colors">
                    Find a Caregiver
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Browse vetted healthcare workers
                  </p>
                </div>
                <ArrowRight size={16} className="text-gray-300 ml-auto group-hover:text-orange-400 transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/client/bookings" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-orange-200">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-400/20">
                  <CalendarCheck size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm group-hover:text-orange-600 transition-colors">
                    My Bookings
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    View and manage your bookings
                  </p>
                </div>
                <ArrowRight size={16} className="text-gray-300 ml-auto group-hover:text-orange-400 transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/messages" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-orange-200">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-orange-500/20">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm group-hover:text-orange-600 transition-colors">
                    Messages
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Chat with your caregivers
                  </p>
                </div>
                <ArrowRight size={16} className="text-gray-300 ml-auto group-hover:text-orange-400 transition-colors" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Upcoming bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                <CalendarCheck size={14} className="text-orange-600" />
              </div>
              Upcoming Bookings
            </CardTitle>
            {upcomingBookings.length > 0 && (
              <Link
                href="/client/bookings"
                className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1 font-medium transition-colors"
              >
                View all <ArrowRight size={14} />
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Heart size={24} className="text-orange-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">No upcoming bookings</h3>
                <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
                  Find your first caregiver on the marketplace and request a booking.
                </p>
                <Link href="/marketplace/workers">
                  <button className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2.5 rounded-xl hover:from-orange-600 hover:to-amber-600 text-sm font-medium transition-all shadow-sm shadow-orange-500/20 active:scale-[0.98]">
                    Browse Caregivers
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => {
                  const workerName = booking.workerProfile.user.name;
                  const workerType = booking.workerProfile.workerType;
                  const initials = workerName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-xl border border-gray-100/50 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {booking.workerProfile.user.avatarUrl ? (
                          <img
                            src={booking.workerProfile.user.avatarUrl}
                            alt={workerName}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {workerName}
                            {workerType && (
                              <span className="text-gray-400 font-normal">
                                {" "}
                                &middot; {WORKER_TYPE_SHORT[workerType]}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {getServiceLabel(booking.serviceType)} &middot;{" "}
                            {formatDate(booking.startDate)}
                            {booking.startTime && ` at ${booking.startTime}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant={STATUS_VARIANT[booking.status] ?? "secondary"}>
                        {booking.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
