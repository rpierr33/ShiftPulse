"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clockIn, clockOut } from "@/actions/clock";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { MapPin, MapPinOff, Loader2 } from "lucide-react";

interface ClockButtonProps {
  isClockedIn: boolean;
  companyId: string;
  clockInTime?: Date | string | null;
  companyName?: string;
}

type GpsState = "acquiring" | "ready" | "unavailable";

interface GpsPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function ClockButton({ isClockedIn, companyId, clockInTime, companyName }: ClockButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gpsState, setGpsState] = useState<GpsState>("acquiring");
  const [gpsPosition, setGpsPosition] = useState<GpsPosition | null>(null);
  const router = useRouter();

  const acquireGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsState("unavailable");
      return;
    }

    setGpsState("acquiring");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setGpsState("ready");
      },
      () => {
        setGpsState("unavailable");
        setGpsPosition(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  useEffect(() => {
    acquireGps();
  }, [acquireGps]);

  async function handleClock() {
    setLoading(true);
    setError("");

    const location = gpsPosition
      ? { latitude: gpsPosition.latitude, longitude: gpsPosition.longitude, accuracy: gpsPosition.accuracy }
      : undefined;

    const result = isClockedIn
      ? await clockOut(companyId, undefined, location)
      : await clockIn(companyId, undefined, undefined, location);

    if (result.error) {
      setError(result.error);
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* GPS status */}
      <div className="flex items-center gap-2 text-xs">
        {gpsState === "ready" && (
          <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full ring-1 ring-emerald-100">
            <MapPin size={12} />
            GPS acquired
            {gpsPosition && (
              <span className="text-emerald-500">({Math.round(gpsPosition.accuracy)}m)</span>
            )}
          </span>
        )}
        {gpsState === "acquiring" && (
          <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full ring-1 ring-blue-100">
            <Loader2 size={12} className="animate-spin" />
            Acquiring GPS...
          </span>
        )}
        {gpsState === "unavailable" && (
          <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full ring-1 ring-amber-100">
            <MapPinOff size={12} />
            Location unavailable
          </span>
        )}
      </div>

      {/* Clock button */}
      <div className="relative">
        {/* Pulse ring when clocked in */}
        {isClockedIn && !loading && (
          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse-ring" />
        )}

        <button
          onClick={handleClock}
          disabled={loading}
          className={cn(
            "relative w-48 h-48 rounded-full flex flex-col items-center justify-center text-white font-bold text-xl transition-all duration-300 active:scale-95 disabled:opacity-50",
            isClockedIn
              ? "bg-gradient-to-br from-red-500 to-red-700 shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 hover:from-red-400 hover:to-red-600"
              : "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:from-emerald-400 hover:to-emerald-600"
          )}
        >
          {loading ? (
            <Loader2 size={40} className="animate-spin" />
          ) : (
            <>
              <span className="text-2xl font-bold tracking-tight">{isClockedIn ? "CLOCK OUT" : "CLOCK IN"}</span>
              <span className="text-sm font-normal opacity-80 mt-1">
                {isClockedIn ? "Tap to end" : "Tap to start"}
              </span>
            </>
          )}
        </button>
      </div>

      {isClockedIn && clockInTime && (
        <div className="text-center animate-fade-in-up">
          <p className="text-sm text-gray-500">Clocked in since</p>
          <p className="text-xl font-bold text-gray-900 tracking-tight">{formatTime(clockInTime)}</p>
          {companyName && <p className="text-sm text-gray-400 mt-0.5">{companyName}</p>}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-2.5 rounded-xl text-sm max-w-xs text-center ring-1 ring-red-100 animate-scale-in">
          {error}
        </div>
      )}
    </div>
  );
}
