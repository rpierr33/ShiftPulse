"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Input available if needed for search
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { CredentialReview } from "@/components/company/credential-review";
import {
  CREDENTIAL_TYPES,
  CREDENTIAL_STATUS_LABELS,
  CREDENTIAL_STATUS_COLORS,
  WORKER_TYPE_SHORT,
} from "@/types";
import {
  Users,
  BadgeCheck,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Search,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Credential, CredentialStatus, WorkerType } from "@prisma/client";

type WorkerWithCredentials = {
  userId: string;
  name: string;
  workerType: WorkerType | null;
  workerProfileId: string;
  credentials: Credential[];
};

type ExpiringCredential = Credential & {
  workerProfile: {
    id: string;
    user: { name: string };
  };
};

interface CompanyCredentialsClientProps {
  workers: WorkerWithCredentials[];
  stats: {
    verified: number;
    pending: number;
    expired: number;
    expiringSoon: number;
    total: number;
  };
  expiringCredentials: ExpiringCredential[];
}

function getStatusIcon(status: CredentialStatus, size = 14) {
  switch (status) {
    case "VERIFIED":
      return <BadgeCheck size={size} className="text-emerald-500" />;
    case "PENDING":
      return <Clock size={size} className="text-amber-500" />;
    case "EXPIRED":
      return <AlertTriangle size={size} className="text-red-500" />;
    case "REJECTED":
      return <XCircle size={size} className="text-red-600" />;
  }
}

function getCredentialTypeLabel(type: string): string {
  const match = CREDENTIAL_TYPES.find((ct) => ct.value === type);
  return match?.label ?? type;
}

function getDaysUntilExpiry(expiryDate: string | Date): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getExpiryColor(days: number): string {
  if (days < 0) return "text-red-600";
  if (days <= 30) return "text-red-500";
  if (days <= 90) return "text-amber-500";
  return "text-blue-500";
}

export function CompanyCredentialsClient({
  workers,
  stats,
  expiringCredentials,
}: CompanyCredentialsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);
  const [reviewCredential, setReviewCredential] = useState<Credential | null>(null);
  const [reviewWorkerName, setReviewWorkerName] = useState("");

  // Filter workers
  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      !searchQuery || worker.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      !statusFilter ||
      worker.credentials.some((c) => c.status === statusFilter);

    const matchesType =
      !typeFilter ||
      worker.credentials.some((c) => c.type === typeFilter);

    return matchesSearch && matchesStatus && matchesType;
  });

  const statusOptions = [
    { value: "PENDING", label: "Pending" },
    { value: "VERIFIED", label: "Verified" },
    { value: "EXPIRED", label: "Expired" },
    { value: "REJECTED", label: "Rejected" },
  ];

  const typeOptions = CREDENTIAL_TYPES.map((ct) => ({
    value: ct.value,
    label: ct.label,
  }));

  const statCards = [
    {
      label: "Total Workers",
      value: workers.length,
      icon: <Users size={20} className="text-blue-500" />,
      bg: "bg-blue-50",
    },
    {
      label: "Fully Compliant",
      value: workers.filter(
        (w) =>
          w.credentials.length > 0 &&
          w.credentials.every((c) => c.status === "VERIFIED")
      ).length,
      icon: <BadgeCheck size={20} className="text-emerald-500" />,
      bg: "bg-emerald-50",
    },
    {
      label: "Expiring Soon",
      value: stats.expiringSoon,
      icon: <Clock size={20} className="text-amber-500" />,
      bg: "bg-amber-50",
    },
    {
      label: "Expired / Missing",
      value: stats.expired,
      icon: <AlertTriangle size={20} className="text-red-500" />,
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Expiring soon alert */}
      {expiringCredentials.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-900">
                Credentials Expiring Soon ({expiringCredentials.length})
              </h3>
            </div>
            <div className="space-y-2">
              {expiringCredentials.slice(0, 5).map((cred) => {
                const days = getDaysUntilExpiry(cred.expiryDate!);
                return (
                  <div
                    key={cred.id}
                    className="flex items-center justify-between bg-white/70 rounded-xl p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {cred.workerProfile.user.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getCredentialTypeLabel(cred.type)} - {cred.name}
                      </p>
                    </div>
                    <span className={cn("text-xs font-semibold", getExpiryColor(days))}>
                      {days <= 0 ? "Expired" : `${days} days left`}
                    </span>
                  </div>
                );
              })}
              {expiringCredentials.length > 5 && (
                <p className="text-xs text-amber-700 text-center pt-1">
                  + {expiringCredentials.length - 5} more
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search workers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
          <Select
            id="status-filter"
            options={statusOptions}
            placeholder="All statuses"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Select
            id="type-filter"
            options={typeOptions}
            placeholder="All types"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
          {(statusFilter || typeFilter || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("");
                setTypeFilter("");
                setSearchQuery("");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Workers table */}
      {filteredWorkers.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Shield size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No workers found
          </h3>
          <p className="text-sm text-gray-500">
            {workers.length === 0
              ? "No approved workers in your organization yet."
              : "No workers match your current filters."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Credentials</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkers.map((worker, idx) => {
                const isExpanded = expandedWorkerId === worker.userId;
                const verifiedCount = worker.credentials.filter(
                  (c) => c.status === "VERIFIED"
                ).length;
                const pendingCount = worker.credentials.filter(
                  (c) => c.status === "PENDING"
                ).length;
                const expiredCount = worker.credentials.filter(
                  (c) => c.status === "EXPIRED"
                ).length;
                const rejectedCount = worker.credentials.filter(
                  (c) => c.status === "REJECTED"
                ).length;
                const allVerified =
                  worker.credentials.length > 0 &&
                  worker.credentials.every((c) => c.status === "VERIFIED");

                return (
                  <tbody key={worker.userId}>
                    <TableRow
                      className={cn(
                        "cursor-pointer",
                        idx % 2 === 1 && "bg-gray-50/50"
                      )}
                      onClick={() =>
                        setExpandedWorkerId(isExpanded ? null : worker.userId)
                      }
                    >
                      <TableCell className="w-8">
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-gray-400" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-gray-900">{worker.name}</p>
                      </TableCell>
                      <TableCell>
                        {worker.workerType ? (
                          <Badge variant="secondary">
                            {WORKER_TYPE_SHORT[worker.workerType]}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {verifiedCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600">
                              <BadgeCheck size={12} /> {verifiedCount}
                            </span>
                          )}
                          {pendingCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
                              <Clock size={12} /> {pendingCount}
                            </span>
                          )}
                          {expiredCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-red-500">
                              <AlertTriangle size={12} /> {expiredCount}
                            </span>
                          )}
                          {rejectedCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-red-600">
                              <XCircle size={12} /> {rejectedCount}
                            </span>
                          )}
                          {worker.credentials.length === 0 && (
                            <span className="text-xs text-gray-400">None uploaded</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {allVerified ? (
                          <Badge variant="success">Compliant</Badge>
                        ) : worker.credentials.length === 0 ? (
                          <Badge variant="secondary">No credentials</Badge>
                        ) : pendingCount > 0 ? (
                          <Badge variant="warning">Needs review</Badge>
                        ) : (
                          <Badge variant="danger">Incomplete</Badge>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded credential rows */}
                    {isExpanded && (
                      <>
                        {worker.credentials.length === 0 ? (
                          <tr>
                            <td colSpan={5}>
                              <div className="px-12 py-6 bg-gray-50/50 text-center text-sm text-gray-500">
                                This worker has not uploaded any credentials yet.
                              </div>
                            </td>
                          </tr>
                        ) : (
                          worker.credentials.map((cred) => {
                            const _statusColors = CREDENTIAL_STATUS_COLORS[cred.status];
                            return (
                              <tr
                                key={cred.id}
                                className="bg-gray-50/80 border-b border-gray-100"
                              >
                                <td></td>
                                <td className="p-4" colSpan={2}>
                                  <div className="flex items-center gap-3">
                                    {getStatusIcon(cred.status)}
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {cred.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {getCredentialTypeLabel(cred.type)}
                                        {cred.licenseNumber &&
                                          ` - #${cred.licenseNumber}`}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div>
                                    <Badge
                                      variant={
                                        cred.status === "VERIFIED"
                                          ? "success"
                                          : cred.status === "PENDING"
                                          ? "warning"
                                          : "danger"
                                      }
                                    >
                                      {CREDENTIAL_STATUS_LABELS[cred.status]}
                                    </Badge>
                                    {cred.expiryDate && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Exp:{" "}
                                        {new Date(
                                          cred.expiryDate
                                        ).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  {cred.status === "PENDING" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReviewCredential(cred);
                                        setReviewWorkerName(worker.name);
                                      }}
                                    >
                                      Review
                                    </Button>
                                  )}
                                  {cred.status !== "PENDING" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReviewCredential(cred);
                                        setReviewWorkerName(worker.name);
                                      }}
                                    >
                                      View
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </>
                    )}
                  </tbody>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Review dialog */}
      <CredentialReview
        open={!!reviewCredential}
        onClose={() => {
          setReviewCredential(null);
          setReviewWorkerName("");
        }}
        credential={reviewCredential}
        workerName={reviewWorkerName}
      />
    </div>
  );
}
