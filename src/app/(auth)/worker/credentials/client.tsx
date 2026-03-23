"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CredentialForm } from "@/components/worker/credential-form";
import { deleteCredential } from "@/actions/credentials";
import {
  CREDENTIAL_TYPES,
  CREDENTIAL_STATUS_LABELS,
  CREDENTIAL_STATUS_COLORS,
} from "@/types";
import {
  Plus,
  BadgeCheck,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Shield,
  Pencil,
  Trash2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Credential, CredentialStatus } from "@prisma/client";

interface WorkerCredentialsClientProps {
  credentials: Credential[];
}

function getStatusIcon(status: CredentialStatus) {
  switch (status) {
    case "VERIFIED":
      return <BadgeCheck size={14} />;
    case "PENDING":
      return <Clock size={14} />;
    case "EXPIRED":
      return <AlertTriangle size={14} />;
    case "REJECTED":
      return <XCircle size={14} />;
  }
}

function getStatusBadgeVariant(status: CredentialStatus) {
  switch (status) {
    case "VERIFIED":
      return "success" as const;
    case "PENDING":
      return "warning" as const;
    case "EXPIRED":
    case "REJECTED":
      return "danger" as const;
  }
}

function getExpiryWarning(expiryDate: Date | string | null): {
  label: string;
  color: string;
} | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: "Expired", color: "text-red-600" };
  }
  if (diffDays <= 30) {
    return { label: `Expires in ${diffDays} days`, color: "text-red-500" };
  }
  if (diffDays <= 90) {
    return { label: `Expires in ${diffDays} days`, color: "text-amber-500" };
  }
  return null;
}

function maskLicenseNumber(num: string | null): string {
  if (!num) return "";
  if (num.length <= 4) return num;
  return "****" + num.slice(-4);
}

function getCredentialTypeLabel(type: string): string {
  const match = CREDENTIAL_TYPES.find((ct) => ct.value === type);
  return match?.label ?? type;
}

export function WorkerCredentialsClient({ credentials }: WorkerCredentialsClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEdit = (cred: Credential) => {
    setEditingCredential(cred);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      setDeletingId(id);
      await deleteCredential(id);
      setDeletingId(null);
      setExpandedId(null);
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCredential(null);
  };

  return (
    <div className="space-y-6">
      {/* Score hint */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
        <Sparkles size={16} className="text-blue-500 flex-shrink-0" />
        <p className="text-sm text-blue-700">
          Verified credentials boost your marketplace score and visibility to providers.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {credentials.length} credential{credentials.length !== 1 ? "s" : ""} on file
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} />
          Add Credential
        </Button>
      </div>

      {/* Credentials Grid */}
      {credentials.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Shield size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No credentials yet
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Add your licenses, certifications, and other credentials to get verified
            and improve your marketplace profile.
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Add Your First Credential
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {credentials.map((cred) => {
            const isExpanded = expandedId === cred.id;
            const statusColors = CREDENTIAL_STATUS_COLORS[cred.status];
            const expiryWarning = getExpiryWarning(cred.expiryDate);

            return (
              <Card
                key={cred.id}
                className={cn(
                  "relative overflow-hidden cursor-pointer transition-all",
                  isExpanded && "ring-2 ring-blue-200"
                )}
                onClick={() => setExpandedId(isExpanded ? null : cred.id)}
              >
                <div className="p-5">
                  {/* Top row: icon + status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", statusColors.bg)}>
                      <FileText size={18} className={statusColors.text} />
                    </div>
                    <Badge variant={getStatusBadgeVariant(cred.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(cred.status)}
                        {CREDENTIAL_STATUS_LABELS[cred.status]}
                      </span>
                    </Badge>
                  </div>

                  {/* Name and type */}
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                    {cred.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {getCredentialTypeLabel(cred.type)}
                  </p>

                  {/* License number (masked) */}
                  {cred.licenseNumber && (
                    <p className="text-xs text-gray-600 font-mono">
                      {maskLicenseNumber(cred.licenseNumber)}
                    </p>
                  )}

                  {/* Expiry info */}
                  {cred.expiryDate && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Expires: {new Date(cred.expiryDate).toLocaleDateString()}
                      </p>
                      {expiryWarning && (
                        <p className={cn("text-xs font-medium mt-0.5", expiryWarning.color)}>
                          <AlertTriangle size={12} className="inline mr-1" />
                          {expiryWarning.label}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Rejection reason */}
                  {cred.status === "REJECTED" && cred.notes && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-700">
                        <span className="font-medium">Reason:</span> {cred.notes}
                      </p>
                    </div>
                  )}

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                      {cred.issuingAuthority && (
                        <div>
                          <span className="text-xs text-gray-400">Issuing Authority</span>
                          <p className="text-sm text-gray-700">{cred.issuingAuthority}</p>
                        </div>
                      )}
                      {cred.issueDate && (
                        <div>
                          <span className="text-xs text-gray-400">Issue Date</span>
                          <p className="text-sm text-gray-700">
                            {new Date(cred.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {cred.documentUrl && (
                        <a
                          href={cred.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={12} />
                          View Document
                        </a>
                      )}
                      {cred.verifiedAt && (
                        <div>
                          <span className="text-xs text-gray-400">Verified</span>
                          <p className="text-sm text-gray-700">
                            {new Date(cred.verifiedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(cred);
                          }}
                        >
                          <Pencil size={14} />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          loading={isPending && deletingId === cred.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(cred.id);
                          }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit form dialog */}
      <CredentialForm
        open={showForm}
        onClose={handleCloseForm}
        credential={editingCredential}
      />
    </div>
  );
}
