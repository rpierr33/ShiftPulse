"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ClockButton } from "@/components/worker/clock-button";
import { formatTime, formatDate } from "@/lib/utils";
import { Clock } from "lucide-react";
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
      <Card>
        <CardContent className="p-8 flex flex-col items-center">
          <div className="text-center mb-8">
            <p className="text-4xl font-bold text-gray-900 mb-1">
              {new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
            <p className="text-gray-500">{formatDate(new Date())}</p>
          </div>

          {selectedCompany ? (
            <ClockButton
              isClockedIn={clockStatus.isClockedIn}
              companyId={selectedCompanyId}
              clockInTime={clockStatus.clockInTime}
              companyName={clockStatus.isClockedIn ? clockStatus.companyName : selectedCompany.name}
            />
          ) : (
            <div className="text-center text-gray-500">
              <p className="font-medium">No company connected</p>
              <p className="text-sm">Join a company to start clocking in</p>
            </div>
          )}

          {companies.length > 1 && !clockStatus.isClockedIn && (
            <div className="mt-6 w-full max-w-xs">
              <p className="text-sm text-gray-500 mb-2 text-center">Select company:</p>
              <div className="space-y-2">
                {companies.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedCompanyId(m.company.id)}
                    className={cn(
                      "w-full p-3 border rounded-lg text-sm text-center transition-colors",
                      selectedCompanyId === m.company.id
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                        : "border-gray-200 hover:bg-gray-50 text-gray-700"
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
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock size={18} />
            Recent Activity
          </h3>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No clock events yet</p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        event.type === "CLOCK_IN" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {event.type === "CLOCK_IN" ? "Clock In" : "Clock Out"}
                      </p>
                      <p className="text-xs text-gray-500">{event.company.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{formatTime(event.timestamp)}</p>
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
