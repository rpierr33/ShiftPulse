"use client";

import { useState, useEffect, useTransition } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getWorkerBookings,
  acceptBooking,
  declineBooking,
  completeBooking,
} from "@/actions/client";
import { SERVICE_TYPES } from "@/types";
import {
  Calendar,
  Clock,
  DollarSign,
  Check,
  X,
  CheckCircle2,
  User,
  MapPin,
  Phone,
} from "lucide-react";
import type { DayOfWeek } from "@prisma/client";

type BookingItem = Awaited<ReturnType<typeof getWorkerBookings>>[number];

const STATUS_VARIANT: Record<string, "warning" | "success" | "danger" | "default" | "secondary"> = {
  pending: "warning",
  accepted: "success",
  declined: "danger",
  completed: "default",
  cancelled: "secondary",
};

function getServiceLabel(value: string): string {
  return SERVICE_TYPES.find((s) => s.value === value)?.label ?? value;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function WorkerBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    try {
      const data = await getWorkerBookings();
      setBookings(data);
    } finally {
      setLoading(false);
    }
  }

  function handleAccept(id: string) {
    setActionId(id);
    startTransition(async () => {
      const result = await acceptBooking(id);
      if (result.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "accepted" } : b))
        );
      }
      setActionId(null);
    });
  }

  function handleDecline(id: string) {
    setActionId(id);
    startTransition(async () => {
      const result = await declineBooking(id, declineReason || undefined);
      if (result.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === id
              ? { ...b, status: "declined", declineReason: declineReason || null }
              : b
          )
        );
        setDeclineId(null);
        setDeclineReason("");
      }
      setActionId(null);
    });
  }

  function handleComplete(id: string) {
    setActionId(id);
    startTransition(async () => {
      const result = await completeBooking(id);
      if (result.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === id
              ? { ...b, status: "completed", completedAt: new Date() }
              : b
          )
        );
      }
      setActionId(null);
    });
  }

  // Sort: pending first, then by date
  const sorted = [...bookings].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  return (
    <div>
      <TopBar
        title="Private Client Bookings"
        subtitle="Manage booking requests from private clients"
      />

      <div className="p-4 lg:p-6 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-2/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar size={24} className="text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              No booking requests yet
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              When private clients book your services, their requests will appear here.
            </p>
          </div>
        ) : (
          sorted.map((booking) => {
            const clientInitials = booking.clientName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            const isPendingBooking = booking.status === "pending";
            const isAccepted = booking.status === "accepted";
            const isActioning = actionId === booking.id && isPending;

            return (
              <Card key={booking.id} className={isPendingBooking ? "ring-1 ring-amber-200" : ""}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    {/* Client avatar */}
                    {booking.clientAvatar ? (
                      <img
                        src={booking.clientAvatar}
                        alt={booking.clientName}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {clientInitials}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {booking.clientName}
                          </h3>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {getServiceLabel(booking.serviceType)}
                          </p>
                        </div>
                        <Badge variant={STATUS_VARIANT[booking.status] ?? "secondary"}>
                          {booking.status}
                        </Badge>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(booking.startDate)}
                          {booking.endDate && ` - ${formatDate(booking.endDate)}`}
                        </span>

                        {booking.startTime && (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} />
                            {booking.startTime}
                            {booking.endTime && ` - ${booking.endTime}`}
                          </span>
                        )}

                        {booking.hourlyRate != null && (
                          <span className="inline-flex items-center gap-1">
                            <DollarSign size={12} />
                            ${parseFloat(String(booking.hourlyRate)).toFixed(2)}/hr
                          </span>
                        )}

                        {booking.isRecurring && (
                          <span className="text-amber-600 font-medium">Recurring</span>
                        )}
                      </div>

                      {/* Client info */}
                      {(booking.careRecipientName || booking.clientCity) && (
                        <div className="mt-3 text-xs text-gray-500 space-y-1 bg-gray-50 rounded-lg p-3">
                          {booking.careRecipientName && (
                            <p className="flex items-center gap-1.5">
                              <User size={11} />
                              Care recipient: {booking.careRecipientName}
                            </p>
                          )}
                          {booking.clientCity && (
                            <p className="flex items-center gap-1.5">
                              <MapPin size={11} />
                              {[booking.clientAddress, booking.clientCity, booking.clientState, booking.clientZipCode]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}
                          {booking.clientPhone && (
                            <p className="flex items-center gap-1.5">
                              <Phone size={11} />
                              {booking.clientPhone}
                            </p>
                          )}
                          {booking.careNeeds && (
                            <p className="mt-1 text-gray-600">
                              Care needs: {booking.careNeeds}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {booking.notes && (
                        <p className="mt-2 text-xs text-gray-500">
                          Client note: {booking.notes}
                        </p>
                      )}

                      {/* Decline reason */}
                      {booking.status === "declined" && booking.declineReason && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                          Decline reason: {booking.declineReason}
                        </div>
                      )}

                      {/* Actions for pending */}
                      {isPendingBooking && (
                        <div className="mt-4 space-y-3">
                          {declineId === booking.id ? (
                            <div className="flex items-end gap-2">
                              <Input
                                id={`decline-reason-${booking.id}`}
                                label="Reason for declining (optional)"
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                                placeholder="e.g., Schedule conflict"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDecline(booking.id)}
                                loading={isActioning}
                              >
                                Confirm Decline
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeclineId(null);
                                  setDeclineReason("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleAccept(booking.id)}
                                loading={isActioning}
                              >
                                <Check size={14} />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeclineId(booking.id)}
                              >
                                <X size={14} />
                                Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action for accepted: mark complete */}
                      {isAccepted && (
                        <div className="mt-4">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleComplete(booking.id)}
                            loading={isActioning}
                          >
                            <CheckCircle2 size={14} />
                            Mark as Completed
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
