"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ClockButton } from "@/components/worker/clock-button";
import { formatTime, formatDate } from "@/lib/utils";
import { Clock, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClockEvent {
  id: string;
  type: string;
  timestamp: Date;
  company: { name: string };
}

interface ClockStatus {
  isClockedIn: boolean;
  currentEntryId?: string;
  clockInTime?: Date;
  companyId?: string;
  companyName?: string;
  shiftTitle?: string;
}

interface Company {
  id: string;
  company: { id: string; name: string };
}

interface ClockPageClientProps {
  clockStatus: ClockStatus;
  companies: Company[];
  recentEvents: ClockEvent[];
}

export function ClockPageClient({ clockStatus, companies, recentEvents }: ClockPageClientProps) {
  const primaryCompany = companies[0]?.company;
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    clockStatus.isClockedIn && clockStatus.companyId
      ? clockStatus.companyId
      : primaryCompany?.id || ""
  );

  const selectedCompany = companies.find((m) => m.company.id === selectedCompanyId)?.company;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Main clock action */}
      <Card className="overflow-hidden">
        <CardContent className="p-8 md:p-12 flex flex-col items-center">
          <div className="text-center mb-10">
            <p className="text-5xl font-bold text-gray-900 tracking-tight mb-1">
              {new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
            <p className="text-gray-400 text-sm">{formatDate(new Date())}</p>
          </div>

          {selectedCompany ? (
            <ClockButton
              isClockedIn={clockStatus.isClockedIn}
              companyId={selectedCompanyId}
              clockInTime={clockStatus.clockInTime}
              companyName={clockStatus.isClockedIn ? clockStatus.companyName : selectedCompany.name}
            />
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 size={28} className="text-gray-300" />
              </div>
              <p className="font-medium text-gray-900">No company connected</p>
              <p className="text-sm text-gray-400 mt-1">Join a company to start clocking in</p>
            </div>
          )}

          {companies.length > 1 && !clockStatus.isClockedIn && (
            <div className="mt-8 w-full max-w-xs">
              <p className="text-sm text-gray-500 mb-3 text-center font-medium">Select company:</p>
              <div className="space-y-2">
                {companies.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedCompanyId(m.company.id)}
                    className={cn(
                      "w-full p-3.5 border rounded-xl text-sm text-center transition-all duration-200",
                      selectedCompanyId === m.company.id
                        ? "border-blue-500/50 bg-blue-50 text-blue-700 font-medium ring-1 ring-blue-500/20 shadow-sm"
                        : "border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-gray-300"
                    )}
                  >
                    {m.company.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent clock events */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock size={14} className="text-blue-600" />
            </div>
            Recent Activity
          </h3>
          {recentEvents.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={28} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No clock events yet</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-xl border border-gray-100/50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        event.type === "CLOCK_IN"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-600"
                      )}
                    >
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        event.type === "CLOCK_IN" ? "bg-emerald-500" : "bg-red-500"
                      )} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {event.type === "CLOCK_IN" ? "Clock In" : "Clock Out"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{event.company.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatTime(event.timestamp)}</p>
                    <p className="text-xs text-gray-400">{formatDate(event.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
