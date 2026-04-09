"use client";

import { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Download,
  Search,
  X,
  Loader2,
  Calendar,
  IndianRupee,
  Building2,
  Filter,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import {
  useTdsCertificates,
  useCreateTdsCertificate,
  useDeleteTdsCertificate,
} from "@/lib/hooks/use-tds";
import { useClients } from "@/lib/hooks/use-clients";
import { getFinancialYear } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Pagination, paginateArray } from "@/components/shared/pagination";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFYOptions(): string[] {
  const now = new Date();
  const currentFY = getFinancialYear(now);
  const years: string[] = [];
  // Show current FY and 4 previous
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  for (let i = 0; i < 5; i++) {
    const y = startYear - i;
    years.push(`${y}-${String(y + 1).slice(-2)}`);
  }
  return years;
}

function formatINR(amount: number): string {
  if (!Number.isFinite(amount)) return "Rs.0";
  return `Rs.${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const QUARTER_LABELS: Record<string, string> = {
  Q1: "Q1 (Apr-Jun)",
  Q2: "Q2 (Jul-Sep)",
  Q3: "Q3 (Oct-Dec)",
  Q4: "Q4 (Jan-Mar)",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TdsPage() {
  const fyOptions = useMemo(() => getFYOptions(), []);
  const [selectedFY, setSelectedFY] = useState(fyOptions[0]);
  const [filterQuarter, setFilterQuarter] = useState<string | "all">("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  // Form state
  const [formCertNo, setFormCertNo] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formQuarter, setFormQuarter] = useState("Q1");
  const [formDate, setFormDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const { data: certificates = [], isLoading } = useTdsCertificates(selectedFY);
  const { data: clients = [] } = useClients();
  const createCert = useCreateTdsCertificate();
  const deleteCert = useDeleteTdsCertificate();

  // Filter and search
  const filtered = useMemo(() => {
    let list = certificates;
    if (filterQuarter !== "all") {
      list = list.filter((c) => c.quarter === filterQuarter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.certificate_number.toLowerCase().includes(q) ||
          (c.client_name ?? "").toLowerCase().includes(q) ||
          (c.notes ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [certificates, filterQuarter, search]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [selectedFY, filterQuarter, search]);

  // Paginate
  const { paged: pagedCerts, total: totalFiltered } = useMemo(
    () => paginateArray(filtered, currentPage, PAGE_SIZE),
    [filtered, currentPage]
  );

  // Summary stats
  const totalTds = useMemo(() => filtered.reduce((sum, c) => sum + c.amount, 0), [filtered]);
  const byQuarter = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of certificates) {
      const q = c.quarter ?? "Unknown";
      map[q] = (map[q] ?? 0) + c.amount;
    }
    return map;
  }, [certificates]);

  function handleAdd() {
    if (!formCertNo.trim() || !formAmount) return;
    createCert.mutate(
      {
        certificate_number: formCertNo.trim(),
        client_id: formClientId || null,
        amount: parseFloat(formAmount) || 0,
        financial_year: selectedFY,
        quarter: formQuarter || null,
        received_date: formDate || null,
        notes: formNotes.trim() || null,
      },
      {
        onSuccess: () => {
          setShowAddModal(false);
          resetForm();
        },
      }
    );
  }

  function resetForm() {
    setFormCertNo("");
    setFormClientId("");
    setFormAmount("");
    setFormQuarter("Q1");
    setFormDate("");
    setFormNotes("");
  }

  function exportCSV() {
    const rows = [
      ["Certificate No.", "Client", "Amount", "Quarter", "Financial Year", "Received Date", "Notes"],
      ...filtered.map((c) => [
        c.certificate_number,
        c.client_name ?? "-",
        String(c.amount),
        c.quarter ?? "-",
        c.financial_year,
        c.received_date ?? "-",
        c.notes ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tds-certificates-${selectedFY}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: "TDS Certificates" }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">TDS Certificates</h1>
          <p className="text-sm text-text-muted mt-1">
            Track TDS deductions, Form 16A/16B certificates across financial years
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-button text-xs font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] hover:text-text-primary transition-all disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-button text-xs font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Certificate
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <GlassCard padding="sm">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Total TDS</p>
          <p className="text-lg font-bold text-text-primary mt-1">{formatINR(totalTds)}</p>
          <p className="text-[10px] text-text-muted mt-0.5">FY {selectedFY}</p>
        </GlassCard>
        {QUARTERS.map((q) => (
          <GlassCard key={q} padding="sm">
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{q}</p>
            <p className="text-lg font-bold text-text-primary mt-1">{formatINR(byQuarter[q] ?? 0)}</p>
            <p className="text-[10px] text-text-muted mt-0.5">
              {certificates.filter((c) => c.quarter === q).length} cert(s)
            </p>
          </GlassCard>
        ))}
      </div>

      {/* Filters */}
      <GlassCard padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-muted" />
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="glass-input text-sm py-1.5 w-32"
            >
              {fyOptions.map((fy) => (
                <option key={fy} value={fy}>FY {fy}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <select
              value={filterQuarter}
              onChange={(e) => setFilterQuarter(e.target.value)}
              className="glass-input text-sm py-1.5 w-36"
            >
              <option value="all">All Quarters</option>
              {QUARTERS.map((q) => (
                <option key={q} value={q}>{QUARTER_LABELS[q]}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search certificates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input text-sm py-1.5 pl-9 pr-8 w-full"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Certificates Table */}
      <GlassCard padding="none">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-text-muted" />
            <p className="text-sm text-text-muted mt-2">Loading certificates...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-8 h-8 text-text-muted/40 mx-auto mb-2" />
            <p className="text-sm text-text-muted">
              {certificates.length === 0
                ? "No TDS certificates for this financial year yet."
                : "No certificates match your filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  <th className="text-left px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-text-muted">Certificate No.</th>
                  <th className="text-left px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-text-muted">Client</th>
                  <th className="text-right px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-text-muted">Amount</th>
                  <th className="text-left px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-text-muted">Quarter</th>
                  <th className="text-left px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-text-muted">Received</th>
                  <th className="text-left px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-text-muted">Notes</th>
                  <th className="px-5 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {pagedCerts.map((cert) => (
                  <tr key={cert.id} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.015] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-text-primary font-mono">{cert.certificate_number}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-text-secondary">{cert.client_name ?? "-"}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-medium text-text-primary tabular-nums">{formatINR(cert.amount)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {cert.quarter ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {cert.quarter}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-text-secondary">{formatDate(cert.received_date)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-text-muted truncate max-w-[200px] block">{cert.notes ?? "-"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setDeleteId(cert.id)}
                        className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-red-400/[0.08] transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 pb-3">
            <Pagination
              currentPage={currentPage}
              totalItems={totalFiltered}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </GlassCard>

      {/* Form 16A/16B Info */}
      <GlassCard padding="lg">
        <h3 className="text-sm font-semibold text-text-primary mb-3">About TDS Certificates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-text-secondary leading-relaxed">
          <div>
            <p className="font-medium text-text-primary mb-1">Form 16A</p>
            <p>
              Certificate of TDS on income other than salary. Issued quarterly by the deductor (your client) for
              professional/technical service payments under Section 194J. TDS rate is typically 10%.
            </p>
          </div>
          <div>
            <p className="font-medium text-text-primary mb-1">Form 16B</p>
            <p>
              Certificate of TDS on sale of property under Section 194-IA. Not typically applicable for service
              businesses but tracked here for completeness.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Delete Certificate"
        description="Are you sure you want to delete this TDS certificate? This cannot be undone."
        confirmLabel="Delete"
        loading={deleteCert.isPending}
        onConfirm={() => {
          if (!deleteId) return;
          deleteCert.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
        }}
      />

      {/* Add modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setShowAddModal(false); resetForm(); }} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-card shadow-xl p-6" role="dialog" aria-modal="true">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-text-primary">Add TDS Certificate</h3>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="p-1.5 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Certificate No. *</label>
                  <input
                    type="text"
                    value={formCertNo}
                    onChange={(e) => setFormCertNo(e.target.value)}
                    placeholder="e.g. TDS/2025/001"
                    className="glass-input font-mono"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Amount (INR) *</label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="glass-input tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Client</label>
                <select
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  className="glass-input"
                >
                  <option value="">Select client (optional)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Quarter</label>
                  <select
                    value={formQuarter}
                    onChange={(e) => setFormQuarter(e.target.value)}
                    className="glass-input"
                  >
                    {QUARTERS.map((q) => (
                      <option key={q} value={q}>{QUARTER_LABELS[q]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Received Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional notes (e.g. Form 16A reference)"
                  rows={2}
                  className="glass-input resize-none"
                />
              </div>

              <div className="flex items-center gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-4 py-2 rounded-button text-sm text-text-secondary hover:text-text-primary border border-black/[0.05] bg-surface-DEFAULT transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!formCertNo.trim() || !formAmount || createCert.isPending}
                  className="flex items-center gap-2 px-5 py-2 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                >
                  {createCert.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Add Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
