"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ServiceLogForm } from "@/components/company/service-log-form";
import { deleteCMS1500Form, exportCMS1500ToPDF } from "@/actions/claims";
import {
  FileText,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  FileDown,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────

type SerializedServiceLog = {
  id: string;
  serviceDate: string;
  serviceType: string;
  procedureCodes: string[];
  diagnosisCodes: string[];
  units: number;
  notes: string | null;
  status: string;
  workerName: string;
  workerId: string;
  timeEntryId: string;
  shiftTitle: string | null;
  createdAt: string;
};

type SerializedCMS1500Form = {
  id: string;
  patientFirstName: string | null;
  patientLastName: string | null;
  insuranceType: string | null;
  totalCharges: number | null;
  status: string;
  createdAt: string;
  serviceLogId: string | null;
};

type TimeEntryOption = {
  id: string;
  workerName: string;
  date: string;
  shiftTitle: string | null;
};

interface ClaimsClientProps {
  companyId: string;
  serviceLogs: SerializedServiceLog[];
  cms1500Forms: SerializedCMS1500Form[];
  timeEntries: TimeEntryOption[];
}

// ─── Status badges ──────────────────────────────────────────────

function ServiceLogStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">Draft</Badge>;
    case "submitted":
      return <Badge variant="default">Submitted</Badge>;
    case "reviewed":
      return <Badge variant="success">Reviewed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function CMS1500StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">Draft</Badge>;
    case "completed":
      return <Badge variant="default">Completed</Badge>;
    case "exported":
      return <Badge variant="success">Exported</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function formatServiceType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Component ──────────────────────────────────────────────────

export function ClaimsClient({
  companyId: _companyId,
  serviceLogs,
  cms1500Forms,
  timeEntries,
}: ClaimsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"logs" | "forms">("logs");
  const [showLogForm, setShowLogForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState("");

  function handleDeleteForm(id: string) {
    if (!confirm("Are you sure you want to delete this draft form?")) return;
    setDeleteError("");
    startTransition(async () => {
      try {
        await deleteCMS1500Form(id);
        router.refresh();
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Failed to delete");
      }
    });
  }

  function handleExportForm(id: string) {
    startTransition(async () => {
      try {
        const html = await exportCMS1500ToPDF(id);
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(html);
          win.document.close();
        }
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Failed to export");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-200 w-fit">
        <button
          onClick={() => setActiveTab("logs")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === "logs"
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          <ClipboardList size={16} />
          Service Logs
          <span className="ml-1 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
            {serviceLogs.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("forms")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === "forms"
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          <FileText size={16} />
          CMS-1500 Forms
          <span className="ml-1 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
            {cms1500Forms.length}
          </span>
        </button>
      </div>

      {deleteError && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3 flex items-center gap-2">
          <AlertCircle size={16} />
          {deleteError}
        </div>
      )}

      {/* Service Logs Tab */}
      {activeTab === "logs" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList size={18} />
                Service Logs
              </CardTitle>
              <Button size="sm" onClick={() => setShowLogForm(true)}>
                <Plus size={14} />
                New Service Log
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {serviceLogs.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No service logs yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Create a service log after approving a time entry
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Procedure Codes</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.serviceDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{log.workerName}</TableCell>
                        <TableCell>{formatServiceType(log.serviceType)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {log.procedureCodes.map((code) => (
                              <span
                                key={code}
                                className="inline-block bg-gray-100 text-gray-700 rounded px-1.5 py-0.5 text-xs"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{log.units}</TableCell>
                        <TableCell>
                          <ServiceLogStatusBadge status={log.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CMS-1500 Forms Tab */}
      {activeTab === "forms" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText size={18} />
                CMS-1500 Claim Forms
              </CardTitle>
              <Button
                size="sm"
                onClick={() => router.push(`/company/claims/new`)}
              >
                <Plus size={14} />
                New CMS-1500
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {cms1500Forms.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No CMS-1500 forms yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Create a new claim form to get started
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date Created</TableHead>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Insurance Type</TableHead>
                      <TableHead>Total Charges</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cms1500Forms.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell>
                          {new Date(form.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {form.patientLastName && form.patientFirstName
                            ? `${form.patientLastName}, ${form.patientFirstName}`
                            : "Not specified"}
                        </TableCell>
                        <TableCell>
                          {form.insuranceType
                            ? form.insuranceType.charAt(0).toUpperCase() +
                              form.insuranceType.slice(1)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {form.totalCharges != null
                            ? `$${parseFloat(String(form.totalCharges)).toFixed(2)}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <CMS1500StatusBadge status={form.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/company/claims/${form.id}`)}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportForm(form.id)}
                              disabled={isPending}
                            >
                              <FileDown size={14} />
                            </Button>
                            {form.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteForm(form.id)}
                                disabled={isPending}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Service Log Form Dialog */}
      <ServiceLogForm
        open={showLogForm}
        onClose={() => setShowLogForm(false)}
        timeEntries={timeEntries}
      />
    </div>
  );
}
