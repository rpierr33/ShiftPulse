"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { CREDENTIAL_TYPES } from "@/types";
import { uploadCredential, updateCredential } from "@/actions/credentials";
import type { Credential } from "@prisma/client";

interface CredentialFormProps {
  open: boolean;
  onClose: () => void;
  credential?: Credential | null;
}

export function CredentialForm({ open, onClose, credential }: CredentialFormProps) {
  const isEditing = !!credential;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState(credential?.type ?? "");
  const [name, setName] = useState(credential?.name ?? "");
  const [licenseNumber, setLicenseNumber] = useState(credential?.licenseNumber ?? "");
  const [issuingAuthority, setIssuingAuthority] = useState(credential?.issuingAuthority ?? "");
  const [issueDate, setIssueDate] = useState(
    credential?.issueDate ? new Date(credential.issueDate).toISOString().split("T")[0] : ""
  );
  const [expiryDate, setExpiryDate] = useState(
    credential?.expiryDate ? new Date(credential.expiryDate).toISOString().split("T")[0] : ""
  );
  const [documentUrl, setDocumentUrl] = useState(credential?.documentUrl ?? "");

  // Update form when credential prop changes
  const resetForm = () => {
    setType("");
    setName("");
    setLicenseNumber("");
    setIssuingAuthority("");
    setIssueDate("");
    setExpiryDate("");
    setDocumentUrl("");
    setError(null);
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    // Auto-fill name from type label
    const match = CREDENTIAL_TYPES.find((ct) => ct.value === value);
    if (match && !name) {
      setName(match.label);
    }
  };

  const handleSubmit = () => {
    if (!type) {
      setError("Please select a credential type.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter a credential name.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const payload = {
        type,
        name: name.trim(),
        licenseNumber: licenseNumber.trim() || undefined,
        issuingAuthority: issuingAuthority.trim() || undefined,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
        documentUrl: documentUrl.trim() || undefined,
      };

      const result = isEditing
        ? await updateCredential(credential.id, payload)
        : await uploadCredential(payload);

      if (result && "error" in result && result.error) {
        setError(result.error);
      } else {
        resetForm();
        onClose();
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      resetForm();
      onClose();
    }
  };

  const typeOptions = CREDENTIAL_TYPES.map((ct) => ({
    value: ct.value,
    label: ct.label,
  }));

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit Credential" : "Add Credential"}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-sm text-red-700 border border-red-100">
              {error}
            </div>
          )}

          <Select
            id="credential-type"
            label="Credential Type"
            options={typeOptions}
            placeholder="Select credential type..."
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
          />

          <Input
            id="credential-name"
            label="Credential Name"
            placeholder="e.g., Florida RN License"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            id="license-number"
            label="License / Certification Number"
            placeholder="e.g., RN-123456"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
          />

          <Input
            id="issuing-authority"
            label="Issuing Authority"
            placeholder="e.g., Florida Board of Nursing"
            value={issuingAuthority}
            onChange={(e) => setIssuingAuthority(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="issue-date"
              label="Issue Date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
            <Input
              id="expiry-date"
              label="Expiry Date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <Input
            id="document-url"
            label="Document URL"
            placeholder="https://... (link to uploaded document)"
            type="url"
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
          />

          <p className="text-xs text-gray-400">
            File upload coming soon. For now, paste a link to your document.
          </p>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={handleClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={isPending}>
          {isEditing ? "Save Changes" : "Add Credential"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
