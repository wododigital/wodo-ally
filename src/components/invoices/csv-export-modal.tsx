"use client";

import { useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DateFilter, type DateFilterState, resolveDateRange } from "@/components/shared/date-filter";
import { TypeFilterDropdown } from "./type-filter-dropdown";
import type { InvoiceListItem } from "@/lib/hooks/use-invoices";

interface CsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: InvoiceListItem[];
  isLoading?: boolean;
}

const EXPORT_COLUMNS = [
  "Invoice #",
  "Client",
  "Type",
  "Issue Date",
  "Due Date",
  "Status",
  "Subtotal",
  "Tax",
  "TDS",
  "Total",
  "Paid",
  "Balance",
  "Currency",
];

export function CsvExportModal({
  isOpen,
  onClose,
  invoices,
  isLoading = false,
}: CsvExportModalProps) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ mode: "all" });
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const filtered = invoices.filter((inv) => {
    const matchType = typeFilter === "all" || inv.invoice_type === typeFilter;
    if (!matchType) return false;

    const dateRange = resolveDateRange(dateFilter);
    if (!dateRange) return true;

    const invDate = inv.invoice_date ? new Date(inv.invoice_date) : null;
    if (!invDate) return true;

    return invDate >= dateRange.start && invDate <= dateRange.end;
  });

  function downloadCsv() {
    setIsExporting(true);
    try {
      const escape = (val: string | number | null | undefined) => {
        const s = String(val ?? "");
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };

      const lines = filtered.map((inv) => {
        const displayNum =
          inv.invoice_type === "proforma" ? (inv.proforma_ref ?? "PF-DRAFT") : (inv.invoice_number ?? "DRAFT");
        return [
          displayNum,
          inv.client_name ?? "",
          inv.invoice_type,
          inv.invoice_date ?? "",
          inv.due_date ?? "",
          inv.status,
          inv.subtotal ?? 0,
          inv.tax_amount ?? 0,
          inv.total_tds_deducted ?? 0,
          inv.total_amount ?? 0,
          (inv.total_amount ?? 0) - (inv.balance_due ?? 0),
          inv.balance_due ?? 0,
          inv.currency ?? "INR",
        ]
          .map(escape)
          .join(",");
      }).join("\n");

      const csv = [EXPORT_COLUMNS.map(escape).join(","), lines].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      onClose();
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg rounded-2xl"
        style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06]">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Export Invoices as CSV</h2>
            <p className="text-sm text-gray-500 mt-0.5">Download filtered invoice data</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Type Filter */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Invoice Type
            </label>
            <TypeFilterDropdown value={typeFilter} onChange={setTypeFilter} />
          </div>

          {/* Date Filter */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Date Range
            </label>
            <DateFilter value={dateFilter} onChange={setDateFilter} />
          </div>

          {/* Column Preview */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Export Columns
            </label>
            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl border border-black/[0.05]">
              {EXPORT_COLUMNS.map((col) => (
                <div key={col} className="text-xs text-gray-600 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  {col}
                </div>
              ))}
            </div>
          </div>

          {/* Row count */}
          <div className="text-sm text-gray-600">
            {filtered.length === 0
              ? "No invoices match the selected filters"
              : `${filtered.length} invoice${filtered.length !== 1 ? "s" : ""} will be exported`}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-black/[0.05]">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-button text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={downloadCsv}
            disabled={isExporting || filtered.length === 0}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-70",
              "hover:opacity-90"
            )}
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            {isExporting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isExporting ? "Exporting..." : "Export CSV"}
            {!isExporting && <Download className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
