"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { MapPin, Clock, Building2, ChevronDown, Play, Square } from "lucide-react";

interface Shift {
  id: string;
  companyName: string;
  role: string;
  scheduledStart?: string;
  scheduledEnd?: string;
}

interface MobileClockProps {
  shifts?: Shift[];
  isClockedIn?: boolean;
  clockInTime?: Date | null;
  currentShift?: Shift | null;
  onClockIn?: (shiftId: string) => void | Promise<void>;
  onClockOut?: () => void | Promise<void>;
  gpsStatus?: "acquired" | "acquiring" | "unavailable";
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MobileClock({
  shifts = [],
  isClockedIn = false,
  clockInTime = null,
  currentShift = null,
  onClockIn,
  onClockOut,
  gpsStatus = "acquiring",
}: MobileClockProps) {
  const [elapsed, setElapsed] = useState(0);
  const [selectedShiftId, setSelectedShiftId] = useState(shifts[0]?.id ?? "");
  const [showShiftSelector, setShowShiftSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  // Timer
  useEffect(() => {
    if (!isClockedIn || !clockInTime) {
      setElapsed(0);
      return;
    }

    const tick = () => {
      setElapsed(Math.floor((Date.now() - new Date(clockInTime).getTime()) / 1000));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime]);

  const handleClockAction = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (isClockedIn) {
        await onClockOut?.();
      } else {
        await onClockIn?.(selectedShiftId);
      }
    } finally {
      setLoading(false);
    }
  }, [isClockedIn, loading, onClockIn, onClockOut, selectedShiftId]);

  const gpsConfig = {
    acquired: { color: "bg-emerald-500", ring: "ring-emerald-500/30", label: "GPS Active", textColor: "text-emerald-400" },
    acquiring: { color: "bg-amber-500", ring: "ring-amber-500/30", label: "Acquiring GPS", textColor: "text-amber-400" },
    unavailable: { color: "bg-red-500", ring: "ring-red-500/30", label: "GPS Unavailable", textColor: "text-red-400" },
  };

  const gps = gpsConfig[gpsStatus];
  const activeShift = currentShift ?? shifts.find((s) => s.id === selectedShiftId);

  return (
    <div className="flex flex-col items-center px-6 py-8 min-h-[80vh] justify-between">
      {/* Shift info */}
      <div className="w-full max-w-sm">
        {isClockedIn && activeShift ? (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/20 rounded-full px-4 py-1.5 text-xs font-medium text-emerald-300 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Currently Clocked In
            </div>
            <h2 className="text-xl font-bold text-white">{activeShift.companyName}</h2>
            <p className="text-sm text-slate-400 mt-1">{activeShift.role}</p>
          </div>
        ) : (
          <div className="w-full mb-6">
            {shifts.length > 1 ? (
              <div className="relative">
                <button
                  onClick={() => setShowShiftSelector(!showShiftSelector)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-left transition-colors hover:bg-white/[0.08]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Building2 size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {activeShift?.companyName ?? "Select Shift"}
                      </div>
                      <div className="text-xs text-slate-500">{activeShift?.role ?? "Choose your shift"}</div>
                    </div>
                  </div>
                  <ChevronDown
                    size={18}
                    className={cn(
                      "text-slate-500 transition-transform duration-200",
                      showShiftSelector && "rotate-180"
                    )}
                  />
                </button>

                {showShiftSelector && (
                  <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-slate-900 border border-white/10 overflow-hidden z-20 shadow-2xl animate-scale-in">
                    {shifts.map((shift) => (
                      <button
                        key={shift.id}
                        onClick={() => {
                          setSelectedShiftId(shift.id);
                          setShowShiftSelector(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-white/[0.06]",
                          selectedShiftId === shift.id && "bg-blue-500/10"
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold">
                          {shift.companyName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{shift.companyName}</div>
                          <div className="text-xs text-slate-500">{shift.role}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : activeShift ? (
              <div className="text-center">
                <h2 className="text-xl font-bold text-white">{activeShift.companyName}</h2>
                <p className="text-sm text-slate-400 mt-1">{activeShift.role}</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-slate-500">No shifts assigned</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timer display */}
      <div className="flex flex-col items-center mb-8">
        {isClockedIn && (
          <div className="mb-8 animate-fade-in-up">
            <div className="text-6xl font-mono font-bold tracking-wider text-white tabular-nums">
              {formatElapsed(elapsed)}
            </div>
            <div className="text-center mt-2 text-sm text-slate-500 flex items-center justify-center gap-2">
              <Clock size={14} />
              Time elapsed
            </div>
          </div>
        )}

        {/* Clock button */}
        <div className="relative">
          {/* Pulsing ring when clocked in */}
          {isClockedIn && (
            <>
              <div className="absolute inset-0 w-[136px] h-[136px] -m-2 rounded-full bg-emerald-500/20 animate-pulse-ring" />
              <div className="absolute inset-0 w-[136px] h-[136px] -m-2 rounded-full bg-emerald-500/10 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
            </>
          )}

          <button
            onClick={handleClockAction}
            disabled={loading || (!isClockedIn && !selectedShiftId && shifts.length > 0)}
            className={cn(
              "relative w-[120px] h-[120px] rounded-full flex flex-col items-center justify-center transition-all duration-300 active:scale-95 shadow-2xl",
              isClockedIn
                ? "bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/30 hover:shadow-red-500/50"
                : "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/30 hover:shadow-emerald-500/50",
              loading && "opacity-70 pointer-events-none"
            )}
          >
            {loading ? (
              <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : isClockedIn ? (
              <>
                <Square size={28} className="text-white mb-1" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">Clock Out</span>
              </>
            ) : (
              <>
                <Play size={28} className="text-white mb-1 ml-1" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">Clock In</span>
              </>
            )}
          </button>
        </div>

        {/* Swipe hint for clock out */}
        {isClockedIn && (
          <p className="mt-6 text-xs text-slate-600 animate-fade-in">
            Tap to clock out
          </p>
        )}
      </div>

      {/* GPS Status */}
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className={cn("w-2.5 h-2.5 rounded-full ring-4", gps.color, gps.ring)} />
          <MapPin size={14} className={gps.textColor} />
          <span className={cn("text-xs font-medium", gps.textColor)}>{gps.label}</span>
        </div>
      </div>
    </div>
  );
}
