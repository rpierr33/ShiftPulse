"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WORKER_TYPE_SHORT } from "@/types";
import { Calendar, Clock, DollarSign, X, User } from "lucide-react";
import type { WorkerType, DayOfWeek } from "@prisma/client";

type BookingData = {
  id: string;
  status: string;
  serviceType: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  startTime?: string | null;
  endTime?: string | null;
  isRecurring: boolean;
  recurringDays: DayOfWeek[];
  hourlyRate?: number | null;
  totalHours?: number | null;
  notes?: string | null;
  declineReason?: string | null;
  completedAt?: Date | string | null;
  createdAt: Date | string;
  workerName: string;
  workerAvatar?: string | null;
  workerType?: WorkerType | null;
  workerProfileId: string;
};

interface BookingCardProps {
  booking: BookingData;
  onCancel?: (id: string) => void;
  isCancelling?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "warning" | "success" | "danger" | "default" | "secondary" }> = {
  pending: { label: "Pending", variant: "warning" },
  accepted: { label: "Accepted", variant: "success" },
  declined: { label: "Declined", variant: "danger" },
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  skilled_nursing: "Skilled Nursing",
  home_health_aide: "Home Health Aide",
  physical_therapy: "Physical Therapy",
  occupational_therapy: "Occupational Therapy",
  speech_therapy: "Speech Therapy",
  medical_social_services: "Medical Social Services",
  personal_care: "Personal Care",
  companion_care: "Companion Care",
  respite_care: "Respite Care",
  hospice_visit: "Hospice Visit",
  wound_care: "Wound Care",
  medication_management: "Medication Management",
  iv_therapy: "IV Therapy",
  assessment: "Assessment / Evaluation",
  other: "Other",
};

function formatBookingDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BookingCard({ booking, onCancel, isCancelling }: BookingCardProps) {
  const statusConfig = STATUS_CONFIG[booking.status] ?? {
    label: booking.status,
    variant: "secondary" as const,
  };

  const canCancel = booking.status === "pending" || booking.status === "accepted";
  const workerTypeLabel = booking.workerType
    ? WORKER_TYPE_SHORT[booking.workerType]
    : null;

  const initials = booking.workerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* Worker avatar / initials */}
          <div className="flex-shrink-0">
            {booking.workerAvatar ? (
              <img
                src={booking.workerAvatar}
                alt={booking.workerName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-semibold text-sm">
                {initials}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {booking.workerName}
                  </h3>
                  {workerTypeLabel && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                      {workerTypeLabel}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">
                  {SERVICE_TYPE_LABELS[booking.serviceType] ?? booking.serviceType}
                </p>
              </div>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>

            {/* Details row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} />
                {formatBookingDate(booking.startDate)}
                {booking.endDate && ` - ${formatBookingDate(booking.endDate)}`}
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

            {/* Decline reason */}
            {booking.status === "declined" && booking.declineReason && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                Reason: {booking.declineReason}
              </div>
            )}

            {/* Notes */}
            {booking.notes && (
              <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                {booking.notes}
              </p>
            )}

            {/* Actions */}
            {canCancel && onCancel && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCancel(booking.id)}
                  disabled={isCancelling}
                  loading={isCancelling}
                >
                  <X size={14} />
                  Cancel Booking
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
