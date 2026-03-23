"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createBooking, searchWorkersForClient } from "@/actions/client";
import { SERVICE_TYPES, WORKER_TYPE_SHORT } from "@/types";
import {
  User,
  Calendar,
  Clock,
  DollarSign,
  Star,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import type { WorkerType, DayOfWeek } from "@prisma/client";

const DAYS_OF_WEEK: { value: DayOfWeek; label: string; short: string }[] = [
  { value: "MONDAY", label: "Monday", short: "Mon" },
  { value: "TUESDAY", label: "Tuesday", short: "Tue" },
  { value: "WEDNESDAY", label: "Wednesday", short: "Wed" },
  { value: "THURSDAY", label: "Thursday", short: "Thu" },
  { value: "FRIDAY", label: "Friday", short: "Fri" },
  { value: "SATURDAY", label: "Saturday", short: "Sat" },
  { value: "SUNDAY", label: "Sunday", short: "Sun" },
];

type WorkerInfo = {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  workerType: WorkerType | null;
  score: number;
  averageRating: number | null;
  totalReviews: number;
  servicesOffered: string[];
  preferredRates: Record<string, number> | null;
  hourlyRate: number | null;
};

export default function NewBookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workerId = searchParams.get("workerId");

  const [worker, setWorker] = useState<WorkerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [serviceType, setServiceType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<DayOfWeek[]>([]);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!workerId) {
      setError("No worker selected. Please choose a caregiver from the marketplace.");
      setLoading(false);
      return;
    }
    loadWorker();
  }, [workerId]);

  async function loadWorker() {
    try {
      // Search for the specific worker by their profile ID
      const result = await searchWorkersForClient({ page: 1, limit: 100 });
      const found = result.workers.find((w) => w.id === workerId);
      if (found) {
        setWorker(found);
      } else {
        setError("Worker not found or is not available for private bookings.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Get the hourly rate for the selected service type
  const currentRate = (() => {
    if (!worker || !serviceType) return null;
    if (worker.preferredRates && serviceType in worker.preferredRates) {
      return worker.preferredRates[serviceType];
    }
    return worker.hourlyRate;
  })();

  // Filter SERVICE_TYPES to only those the worker offers
  const availableServices = SERVICE_TYPES.filter(
    (s) => worker?.servicesOffered.includes(s.value)
  );

  function toggleDay(day: DayOfWeek) {
    setRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!worker || !serviceType || !startDate) {
      setSubmitError("Please fill in all required fields.");
      return;
    }

    startTransition(async () => {
      const result = await createBooking({
        workerProfileId: worker.id,
        serviceType,
        startDate,
        endDate: endDate || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        isRecurring,
        recurringDays: isRecurring ? recurringDays : undefined,
        notes: notes || undefined,
      });

      if (result.error) {
        setSubmitError(result.error);
      } else {
        router.push("/client/bookings");
      }
    });
  }

  if (loading) {
    return (
      <div>
        <TopBar title="New Booking" />
        <div className="p-4 lg:p-6">
          <div className="animate-pulse max-w-2xl space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <TopBar title="New Booking" />
        <div className="p-4 lg:p-6">
          <div className="text-center py-16 max-w-md mx-auto">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User size={24} className="text-red-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{error}</h3>
            <Link href="/marketplace/workers">
              <Button variant="outline" className="mt-4">
                <ArrowLeft size={16} />
                Back to Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!worker) return null;

  const workerInitials = worker.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div>
      <TopBar title="New Booking" subtitle="Request care services" />

      <div className="p-4 lg:p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {/* Worker info card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                {worker.avatarUrl ? (
                  <img
                    src={worker.avatarUrl}
                    alt={worker.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg">
                    {workerInitials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {worker.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    {worker.workerType && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded-md text-xs font-medium text-gray-600">
                        {WORKER_TYPE_SHORT[worker.workerType]}
                      </span>
                    )}
                    {worker.averageRating != null && (
                      <span className="inline-flex items-center gap-1">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        {worker.averageRating} ({worker.totalReviews})
                      </span>
                    )}
                    <span>Score: {worker.score}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={18} />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                id="serviceType"
                label="Service Type *"
                options={
                  availableServices.length > 0
                    ? availableServices.map((s) => ({
                        value: s.value,
                        label: s.label,
                      }))
                    : SERVICE_TYPES.map((s) => ({
                        value: s.value,
                        label: s.label,
                      }))
                }
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="Select a service type"
              />

              {currentRate != null && (
                <div className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <DollarSign size={16} className="text-amber-600" />
                  <span className="text-amber-800 font-medium">
                    Rate: ${parseFloat(String(currentRate)).toFixed(2)}/hr
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="startDate"
                  label="Start Date *"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
                <Input
                  id="endDate"
                  label="End Date (optional)"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="startTime"
                  label="Start Time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <Input
                  id="endTime"
                  label="End Time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>

              {/* Recurring toggle */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      isRecurring ? "bg-orange-500" : "bg-gray-200"
                    }`}
                    onClick={() => setIsRecurring(!isRecurring)}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        isRecurring ? "translate-x-5" : ""
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <RefreshCw size={14} />
                    Recurring Booking
                  </span>
                </label>

                {isRecurring && (
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                          recurringDays.includes(day.value)
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                        }`}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="w-full">
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Notes for the Caregiver
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions, parking info, access codes, etc..."
                  rows={3}
                  className="flex w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {submitError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button type="submit" loading={isPending}>
              Request Booking
            </Button>
            <Link href="/marketplace/workers">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
