"use client";

import { useState, useEffect, useTransition } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { BookingCard } from "@/components/client/booking-card";
import { getClientBookings, cancelBooking } from "@/actions/client";
import { CalendarCheck } from "lucide-react";
import Link from "next/link";

type Tab = "upcoming" | "past" | "all";

type BookingItem = Awaited<ReturnType<typeof getClientBookings>>[number];

export default function ClientBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    try {
      const data = await getClientBookings();
      setBookings(data);
    } finally {
      setLoading(false);
    }
  }

  function handleCancel(id: string) {
    setCancellingId(id);
    startTransition(async () => {
      const result = await cancelBooking(id);
      if (result.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
        );
      }
      setCancellingId(null);
    });
  }

  const now = new Date();
  const filtered = bookings.filter((b) => {
    if (activeTab === "upcoming") {
      return (
        (b.status === "pending" || b.status === "accepted") &&
        new Date(b.startDate) >= now
      );
    }
    if (activeTab === "past") {
      return (
        b.status === "completed" ||
        b.status === "cancelled" ||
        b.status === "declined" ||
        new Date(b.startDate) < now
      );
    }
    return true;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "all", label: "All" },
  ];

  return (
    <div>
      <TopBar title="My Bookings" subtitle="Manage your care bookings" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings list */}
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarCheck size={24} className="text-orange-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {activeTab === "upcoming"
                ? "No upcoming bookings"
                : activeTab === "past"
                ? "No past bookings"
                : "No bookings yet"}
            </h3>
            <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
              {activeTab === "upcoming"
                ? "Find a caregiver and book your first session."
                : "Your booking history will appear here."}
            </p>
            {activeTab === "upcoming" && (
              <Link href="/marketplace/workers">
                <button className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2.5 rounded-xl hover:from-orange-600 hover:to-amber-600 text-sm font-medium transition-all shadow-sm shadow-orange-500/20 active:scale-[0.98]">
                  Browse Caregivers
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
                isCancelling={cancellingId === booking.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
