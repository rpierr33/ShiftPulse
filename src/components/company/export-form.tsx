"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { generateExport, getExportHistory } from "@/actions/payroll";
import { Download, FileSpreadsheet } from "lucide-react";

type ExportRecord = {
  id: string;
  format: string;
  startDate: Date;
  endDate: Date;
  totalHours: number;
  totalEntries: number;
  fileName: string;
  createdAt: Date;
  generator: { name: string };
};

export function ExportForm({ companyId }: { companyId: string }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [isPending, startTransition] = useTransition();
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // Set default date range to current week
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);

    // Load export history
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  async function loadHistory() {
    try {
      const data = await getExportHistory(companyId);
      setExports(data as ExportRecord[]);
    } catch {
      // Silently handle - history will be empty
    }
  }

  function handleGenerate() {
    if (!startDate || !endDate) {
      setMessage({ type: "error", text: "Please select start and end dates." });
      return;
    }
    if (endDate < startDate) {
      setMessage({ type: "error", text: "End date must be after start date." });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      try {
        const result = await generateExport(companyId, startDate, endDate, format);
        setMessage({
          type: "success",
          text: `Export generated: ${result.totalEntries ?? 0} entries, ${(result.totalHours ?? 0).toFixed(1)} hours.`,
        });
        await loadHistory();
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to generate export.",
        });
      }
    });
  }

  function formatDateDisplay(date: Date | string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet size={18} />
          Payroll Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <Input
            id="export-start"
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            id="export-end"
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as "csv" | "pdf")}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="csv">CSV</option>
              <option value="pdf">PDF (Summary)</option>
            </select>
          </div>
          <Button onClick={handleGenerate} loading={isPending} className="shrink-0">
            Generate Export
          </Button>
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}

        {exports.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Export History</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Generated</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="text-sm">
                      {formatDateDisplay(exp.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateDisplay(exp.startDate)} - {formatDateDisplay(exp.endDate)}
                    </TableCell>
                    <TableCell className="text-sm">{exp.totalEntries}</TableCell>
                    <TableCell className="text-sm">{exp.totalHours.toFixed(1)}h</TableCell>
                    <TableCell>
                      <a href={`/api/exports/${exp.id}`} download>
                        <Button variant="outline" size="sm">
                          <Download size={14} />
                          Download
                        </Button>
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
