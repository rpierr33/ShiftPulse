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
import { SERVICE_TYPES } from "@/types";
import { createServiceLog, updateServiceLog } from "@/actions/claims";
import { Plus, X, FileText } from "lucide-react";

type TimeEntryOption = {
  id: string;
  workerName: string;
  date: string;
  shiftTitle: string | null;
};

type ServiceLogData = {
  id?: string;
  timeEntryId: string;
  serviceDate: string;
  serviceType: string;
  procedureCodes: string[];
  diagnosisCodes: string[];
  units: number;
  notes: string;
};

interface ServiceLogFormProps {
  open: boolean;
  onClose: () => void;
  timeEntries: TimeEntryOption[];
  initialData?: ServiceLogData;
}

const defaultData: ServiceLogData = {
  timeEntryId: "",
  serviceDate: "",
  serviceType: "",
  procedureCodes: [],
  diagnosisCodes: [],
  units: 1,
  notes: "",
};

export function ServiceLogForm({ open, onClose, timeEntries, initialData }: ServiceLogFormProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ServiceLogData>(initialData ?? defaultData);
  const [newProcCode, setNewProcCode] = useState("");
  const [newDiagCode, setNewDiagCode] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isEditing = Boolean(initialData?.id);

  function reset() {
    setStep(1);
    setData(initialData ?? defaultData);
    setNewProcCode("");
    setNewDiagCode("");
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function addProcedureCode() {
    const code = newProcCode.trim().toUpperCase();
    if (!code) return;
    if (data.procedureCodes.includes(code)) return;
    setData((prev) => ({ ...prev, procedureCodes: [...prev.procedureCodes, code] }));
    setNewProcCode("");
  }

  function removeProcedureCode(code: string) {
    setData((prev) => ({
      ...prev,
      procedureCodes: prev.procedureCodes.filter((c) => c !== code),
    }));
  }

  function addDiagnosisCode() {
    const code = newDiagCode.trim().toUpperCase();
    if (!code) return;
    if (data.diagnosisCodes.includes(code)) return;
    setData((prev) => ({ ...prev, diagnosisCodes: [...prev.diagnosisCodes, code] }));
    setNewDiagCode("");
  }

  function removeDiagnosisCode(code: string) {
    setData((prev) => ({
      ...prev,
      diagnosisCodes: prev.diagnosisCodes.filter((c) => c !== code),
    }));
  }

  function handleSubmit() {
    setError("");
    if (!data.timeEntryId) {
      setError("Please select a time entry");
      setStep(1);
      return;
    }
    if (!data.serviceType) {
      setError("Please select a service type");
      setStep(2);
      return;
    }

    startTransition(async () => {
      try {
        if (isEditing && initialData?.id) {
          await updateServiceLog(initialData.id, {
            serviceType: data.serviceType,
            procedureCodes: data.procedureCodes,
            diagnosisCodes: data.diagnosisCodes,
            units: data.units,
            notes: data.notes || undefined,
          });
        } else {
          await createServiceLog({
            timeEntryId: data.timeEntryId,
            serviceDate: data.serviceDate,
            serviceType: data.serviceType,
            procedureCodes: data.procedureCodes,
            diagnosisCodes: data.diagnosisCodes,
            units: data.units,
            notes: data.notes || undefined,
          });
        }
        handleClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  const serviceTypeOptions = SERVICE_TYPES.map((s) => ({ value: s.value, label: s.label }));

  const timeEntryOptions = timeEntries.map((te) => ({
    value: te.id,
    label: `${te.workerName} - ${te.date}${te.shiftTitle ? ` (${te.shiftTitle})` : ""}`,
  }));

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText size={18} />
          {isEditing ? "Edit Service Log" : "New Service Log"}
        </DialogTitle>
      </DialogHeader>
      <DialogContent>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</div>
        )}

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`h-2 flex-1 rounded-full transition-colors ${
                s === step ? "bg-blue-600" : s < step ? "bg-blue-300" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Select Time Entry */}
        {step === 1 && (
          <div className="space-y-4">
            <Select
              label="Time Entry"
              options={timeEntryOptions}
              placeholder="Select a time entry..."
              value={data.timeEntryId}
              onChange={(e) => {
                const entry = timeEntries.find((te) => te.id === e.target.value);
                setData((prev) => ({
                  ...prev,
                  timeEntryId: e.target.value,
                  serviceDate: entry?.date ?? prev.serviceDate,
                }));
              }}
            />
            {data.serviceDate && (
              <Input
                label="Service Date"
                type="date"
                value={data.serviceDate}
                onChange={(e) => setData((prev) => ({ ...prev, serviceDate: e.target.value }))}
              />
            )}
          </div>
        )}

        {/* Step 2: Service Type */}
        {step === 2 && (
          <div className="space-y-4">
            <Select
              label="Service Type"
              options={serviceTypeOptions}
              placeholder="Select service type..."
              value={data.serviceType}
              onChange={(e) => setData((prev) => ({ ...prev, serviceType: e.target.value }))}
            />
          </div>
        )}

        {/* Step 3: Procedure Codes */}
        {step === 3 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Procedure Codes (CPT/HCPCS)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code (e.g. 99213)"
                value={newProcCode}
                onChange={(e) => setNewProcCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addProcedureCode();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addProcedureCode}>
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.procedureCodes.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-medium"
                >
                  {code}
                  <button onClick={() => removeProcedureCode(code)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Diagnosis Codes */}
        {step === 4 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Diagnosis Codes (ICD-10)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code (e.g. Z00.00)"
                value={newDiagCode}
                onChange={(e) => setNewDiagCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDiagnosisCode();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addDiagnosisCode}>
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.diagnosisCodes.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-medium"
                >
                  {code}
                  <button onClick={() => removeDiagnosisCode(code)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Units */}
        {step === 5 && (
          <div className="space-y-4">
            <Input
              label="Units of Service"
              type="number"
              min={0.25}
              step={0.25}
              value={data.units}
              onChange={(e) =>
                setData((prev) => ({ ...prev, units: parseFloat(e.target.value) || 1 }))
              }
            />
          </div>
        )}

        {/* Step 6: Notes */}
        {step === 6 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="flex w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors min-h-[100px] resize-y"
              placeholder="Additional notes about the service..."
              value={data.notes}
              onChange={(e) => setData((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        )}
      </DialogContent>
      <DialogFooter>
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        {step < 6 ? (
          <Button onClick={() => setStep(step + 1)}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} loading={isPending}>
            {isEditing ? "Update" : "Create"} Service Log
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}
