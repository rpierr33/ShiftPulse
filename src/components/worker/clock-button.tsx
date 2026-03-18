"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clockIn, clockOut } from "@/actions/clock";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";

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
        // Permission denied or error — still allow clock actions
        setGpsState("unavailable");
        setGpsPosition(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  // Acquire GPS on mount
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
    <div className="flex flex-col items-center gap-4">
      {/* GPS status indicator */}
      <div className="flex items-center gap-2 text-xs">
        {gpsState === "ready" && (
          <>
            <span className="flex items-center gap-1 text-green-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              GPS acquired
            </span>
            {gpsPosition && (
              <span className="text-gray-400">
                ({Math.round(gpsPosition.accuracy)}m accuracy)
              </span>
            )}
          </>
        )}
        {gpsState === "acquiring" && (
          <span className="flex items-center gap-1 text-blue-500">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Acquiring GPS...
          </span>
        )}
        {gpsState === "unavailable" && (
          <span className="flex items-center gap-1 text-amber-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Location unavailable
          </span>
        )}
      </div>

      <button
        onClick={handleClock}
        disabled={loading}
        className={cn(
          "w-48 h-48 rounded-full flex flex-col items-center justify-center text-white font-bold text-xl shadow-2xl transition-all active:scale-95 disabled:opacity-50",
          isClockedIn
            ? "bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-red-500/30"
            : "bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 shadow-green-500/30"
        )}
      >
        {loading ? (
          <svg className="animate-spin h-10 w-10" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <>
            <span className="text-2xl">{isClockedIn ? "CLOCK OUT" : "CLOCK IN"}</span>
            <span className="text-sm font-normal opacity-80 mt-1">
              {isClockedIn ? "Tap to end" : "Tap to start"}
            </span>
          </>
        )}
      </button>

      {isClockedIn && clockInTime && (
        <div className="text-center">
          <p className="text-sm text-gray-500">Clocked in since</p>
          <p className="text-lg font-semibold text-gray-900">{formatTime(clockInTime)}</p>
          {companyName && <p className="text-sm text-gray-400">{companyName}</p>}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm max-w-xs text-center">
          {error}
        </div>
      )}
    </div>
  );
}
