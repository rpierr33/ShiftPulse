"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { CREDENTIAL_TYPES, CREDENTIAL_STATUS_LABELS } from "@/types";
import { verifyCredential, rejectCredential } from "@/actions/credentials";
import {
  BadgeCheck,
  XCircle,
  FileText,
  ExternalLink,
  Calendar,
  Building2,
  Hash,
} from "lucide-react";
import type { Credential } from "@prisma/client";

interface CredentialReviewProps {
  open: boolean;
  onClose: () => void;
  credential: Credential | null;
  workerName: string;
}

function getCredentialTypeLabel(type: string): string {
  const match = CREDENTIAL_TYPES.find((ct) => ct.value === type);
  return match?.label ?? type;
}

export function CredentialReview({
  open,
  onClose,
  credential,
  workerName,
}: CredentialReviewProps) {
  const [isPending, startTransition] = useTransition();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!credential) return null;

  const handleVerify = () => {
    setError(null);
    startTransition(async () => {
      const result = await verifyCredential(credential.id);
      if (result && "error" in result && result.error) {
        setError(result.error);
      } else {
        handleClose();
      }
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await rejectCredential(credential.id, rejectReason.trim());
      if (result && "error" in result && result.error) {
        setError(result.error);
      } else {
        handleClose();
      }
    });
  };

  const handleClose = () => {
    setRejectReason("");
    setShowRejectInput(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader>
        <DialogTitle>Review Credential</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-sm text-red-700 border border-red-100">
              {error}
            </div>
          )}

          {/* Worker info */}
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-0.5">Worker</p>
            <p className="text-sm font-medium text-gray-900">{workerName}</p>
          </div>

          {/* Credential details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <FileText size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{credential.name}</h3>
                <p className="text-xs text-gray-500">{getCredentialTypeLabel(credential.type)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {credential.licenseNumber && (
                <div className="flex items-start gap-2">
                  <Hash size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">License Number</p>
                    <p className="text-sm text-gray-900 font-mono">{credential.licenseNumber}</p>
                  </div>
                </div>
              )}

              {credential.issuingAuthority && (
                <div className="flex items-start gap-2">
                  <Building2 size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Issuing Authority</p>
                    <p className="text-sm text-gray-900">{credential.issuingAuthority}</p>
                  </div>
                </div>
              )}

              {credential.issueDate && (
                <div className="flex items-start gap-2">
                  <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Issue Date</p>
                    <p className="text-sm text-gray-900">
                      {new Date(credential.issueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {credential.expiryDate && (
                <div className="flex items-start gap-2">
                  <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Expiry Date</p>
                    <p className="text-sm text-gray-900">
                      {new Date(credential.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Document link */}
            {credential.documentUrl && (
              <a
                href={credential.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-sm text-blue-600 hover:text-blue-700 hover:bg-gray-100 transition-colors w-full"
              >
                <ExternalLink size={14} />
                View Uploaded Document
              </a>
            )}

            {!credential.documentUrl && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-700">
                  No document was uploaded for this credential.
                </p>
              </div>
            )}

            {/* Current status */}
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-0.5">Current Status</p>
              <Badge
                variant={
                  credential.status === "VERIFIED"
                    ? "success"
                    : credential.status === "PENDING"
                    ? "warning"
                    : "danger"
                }
              >
                {CREDENTIAL_STATUS_LABELS[credential.status]}
              </Badge>
            </div>
          </div>

          {/* Reject reason input */}
          {showRejectInput && (
            <Input
              id="reject-reason"
              label="Rejection Reason"
              placeholder="Explain why this credential is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          )}
        </div>
      </DialogContent>
      <DialogFooter>
        {!showRejectInput ? (
          <>
            <Button variant="outline" onClick={handleClose} disabled={isPending}>
              Close
            </Button>
            {credential.status === "PENDING" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectInput(true)}
                  disabled={isPending}
                >
                  <XCircle size={16} />
                  Reject
                </Button>
                <Button
                  variant="success"
                  onClick={handleVerify}
                  loading={isPending}
                >
                  <BadgeCheck size={16} />
                  Verify
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectInput(false);
                setRejectReason("");
              }}
              disabled={isPending}
            >
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              loading={isPending}
            >
              <XCircle size={16} />
              Confirm Rejection
            </Button>
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
}
