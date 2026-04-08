"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus, FileText, Search, ChevronDown,
  CheckCircle2, AlertCircle, Clock, Download,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronRight,
  BarChart2, Loader2,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkCard } from "@/components/shared/dark-section";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination, paginateArray } from "@/components/shared/pagination";
import { NewInvoiceModal } from "@/components/shared/new-invoice-modal";
import { CsvExportModal } from "@/components/invoices/csv-export-modal";
import { TypeFilterDropdown } from "@/components/invoices/type-filter-dropdown";
import { StatusChangeDropdown } from "@/components/invoices/status-change-dropdown";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { useInvoices, useUpdateInvoice, useConvertProformaToInvoice } from "@/lib/hooks/use-invoices";
import type { InvoiceListItem } from "@/lib/hooks/use-invoices";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent", "cancelled"],
  sent: ["paid", "overdue", "cancelled", "archived"],
  overdue: ["paid", "sent", "cancelled", "archived"],
  paid: [],
  cancelled: ["draft"],
  archived: ["draft"],
};

const TYPE_LABELS: Record<string, string> = {
  gst: "GST",
  international: "Intl.",
  non_gst: "Non-GST",
  proforma: "Proforma",
};

const TYPE_COLORS: Record<string, string> = {
  gst: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  international: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  non_gst: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  proforma: "text-text-muted bg-surface-DEFAULT border-black/[0.05]",
};

const STATUS_OPTIONS = ["all", "draft", "sent", "paid", "overdue", "proforma", "archived"];
const STATUS_LABELS: Record<string, string> = {
  all: "All Status",
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  proforma: "Proforma",
  archived: "Archived",
};
const TYPE_OPTIONS = ["all", "gst", "international", "non_gst", "proforma"];

type SortField = "invoice" | "client" | "type" | "date" | "amount" | "status";
type SortDir = "asc" | "desc";
type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "partially_paid" | "overdue" | "cancelled" | "archived";


// ─── Status filter dropdown ───────────────────────────────────────────────────

function StatusFilterDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-button text-xs font-medium transition-all border whitespace-nowrap",
          value !== "all"
            ? "bg-white text-text-primary border-black/[0.12] shadow-sm"
            : "bg-transparent text-text-muted border-black/[0.06] hover:border-black/[0.10]"
        )}
      >
        <span>{STATUS_LABELS[value] ?? value}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full mt-1 z-20 py-1.5 rounded-xl min-w-[130px]"
            style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-black/[0.04]",
                  value === opt ? "text-accent font-semibold" : "text-text-secondary"
                )}
              >
                {STATUS_LABELS[opt] ?? opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


// ─── CSV export ───────────────────────────────────────────────────────────────

function downloadCsv(rows: InvoiceListItem[]) {
  const headers = ["Invoice #", "Client", "Type", "Issue Date", "Due Date", "Status", "Subtotal", "Tax", "TDS", "Total", "Paid", "Balance", "Currency"];
  const escape = (val: string | number) => { const s = String(val); return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = rows.map((inv) => [inv.invoice_number ?? "", inv.client_name ?? "", inv.invoice_type, inv.invoice_date ?? "", inv.due_date ?? "", inv.status, inv.subtotal ?? 0, inv.tax_amount ?? 0, inv.total_tds_deducted ?? 0, inv.total_amount ?? 0, (inv.total_amount ?? 0) - (inv.balance_due ?? 0), inv.balance_due ?? 0, inv.currency ?? "INR"].map(escape).join(",")).join("\n");
  const csv = [headers.map(escape).join(","), lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function InvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [modalClientId, setModalClientId] = useState("");
  const [modalType, setModalType] = useState<string | null>(null);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data: invoices = [], isLoading } = useInvoices();
  const updateInvoice = useUpdateInvoice();
  const convertProforma = useConvertProformaToInvoice();
  const hasAutoArchived = useRef(false);

  // Open modal if ?new=1 in URL (e.g. from client page)
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setModalClientId(searchParams.get("client") ?? "");
      setModalType(searchParams.get("type") ?? null);
      setShowNewModal(true);
      // Clean URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("new");
      url.searchParams.delete("client");
      url.searchParams.delete("type");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // Auto-archive proforma invoices with no payment recorded after 30 days
  useEffect(() => {
    if (hasAutoArchived.current || invoices.length === 0) return;
    hasAutoArchived.current = true;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const toArchive = invoices.filter(
      (inv) =>
        inv.invoice_type === "proforma" &&
        inv.invoice_date != null &&
        inv.invoice_date <= cutoffStr &&
        !(["paid", "cancelled", "archived"] as string[]).includes(inv.status as string)
    );
    for (const inv of toArchive) {
      updateInvoice.mutate(
        { id: inv.id, data: { status: "archived" as any } },
        { onSuccess: () => {}, onError: () => {} }
      );
    }
  }, [invoices]); // eslint-disable-line react-hooks/exhaustive-deps

  function openNewModal(clientId = "", type: string | null = null) {
    setModalClientId(clientId);
    setModalType(type);
    setShowNewModal(true);
  }

  function getDisplayNumber(inv: InvoiceListItem) {
    if (inv.invoice_type === "proforma") return inv.proforma_ref ?? "PF-DRAFT";
    return inv.invoice_number ?? "DRAFT";
  }

  const filtered = useMemo(() => invoices.filter((inv) => {
    // Archived invoices only visible when explicitly filtering for them
    if ((inv.status as string) === "archived" && statusFilter !== "archived") return false;
    const matchStatus = statusFilter === "all" || (statusFilter === "proforma" ? inv.invoice_type === "proforma" : inv.status === statusFilter);
    const matchType = typeFilter === "all" || (typeFilter === "proforma" ? inv.invoice_type === "proforma" : inv.invoice_type === typeFilter);
    const displayNum = getDisplayNumber(inv);
    const matchSearch = !search || displayNum.toLowerCase().includes(search.toLowerCase()) || inv.client_name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchType && matchSearch;
  }), [invoices, statusFilter, typeFilter, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortField === "invoice") cmp = getDisplayNumber(a).localeCompare(getDisplayNumber(b));
      else if (sortField === "client") cmp = a.client_name.localeCompare(b.client_name);
      else if (sortField === "type") cmp = a.invoice_type.localeCompare(b.invoice_type);
      else if (sortField === "date") cmp = (a.invoice_date ?? "").localeCompare(b.invoice_date ?? "");
      else if (sortField === "amount") cmp = (a.total_amount ?? 0) - (b.total_amount ?? 0);
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [statusFilter, typeFilter, search, sortField, sortDir]);

  const { paged: pagedInvoices, total: totalFiltered } = paginateArray(sorted, currentPage, PAGE_SIZE);

  const totals = {
    outstanding: invoices.filter((i) => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + (i.balance_due ?? 0), 0),
    paid_this_month: invoices.filter((i) => i.status === "paid" && i.invoice_date >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)).reduce((s, i) => s + (i.total_amount ?? 0), 0),
    overdue_count: invoices.filter((i) => i.status === "overdue").length,
  };

  function handleStatusChange(invoiceId: string, newStatus: string) {
    updateInvoice.mutate({ id: invoiceId, data: { status: newStatus as any, ...(newStatus === "paid" ? { paid_at: new Date().toISOString() } : {}), ...(newStatus === "sent" ? { sent_at: new Date().toISOString() } : {}) } });
  }

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-accent" /> : <ArrowDown className="w-3 h-3 text-accent" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {showNewModal && (
        <NewInvoiceModal
          onClose={() => setShowNewModal(false)}
          preselectedClientId={modalClientId}
          preselectedType={modalType}
        />
      )}

      {showCsvModal && (
        <CsvExportModal
          isOpen={showCsvModal}
          onClose={() => setShowCsvModal(false)}
          invoices={invoices}
          isLoading={isLoading}
        />
      )}

      {/* Invoice KPIs */}
      <DarkSection>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>Invoice Overview</p>
          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            <button
              onClick={() => setShowCsvModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-button text-xs font-medium transition-all border bg-white/[0.06] text-white/60 border-white/[0.10] hover:border-white/[0.18] hover:text-white/80"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <Link
              href="/analytics/invoices"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-button text-xs font-medium transition-all border bg-white/[0.06] text-white/60 border-white/[0.10] hover:border-white/[0.18] hover:text-white/80"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Analytics
            </Link>
            <button
              onClick={() => openNewModal()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-button text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "rgba(253,126,20,0.85)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Invoice
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: FileText,     label: "Total Invoices Sent",  value: `${invoices.length}`,                                color: "#3b82f6", sub: "This month" },
            { icon: CheckCircle2, label: "Payment Received", value: `Rs.${(totals.paid_this_month / 1000).toFixed(0)}K`, color: "#22c55e", sub: "This month" },
            { icon: Clock,        label: "Payment Pending",     value: `Rs.${(totals.outstanding / 1000).toFixed(0)}K`,     color: "#f59e0b", sub: "This month" },
            { icon: AlertCircle,  label: "Overdue Amount",         value: `${totals.overdue_count} invoice${totals.overdue_count !== 1 ? "s" : ""}`, color: "#ef4444", sub: "This month" },
          ].map((stat) => (
            <DarkCard key={stat.label} className="p-5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3" style={{ background: `${stat.color}18` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <p className="text-xl font-light font-sans mb-0.5" style={{ color: "rgba(255,255,255,0.92)" }}>{isLoading ? "-" : stat.value}</p>
              <p className="text-[11px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{stat.label}</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{stat.sub}</p>
            </DarkCard>
          ))}
        </div>
      </DarkSection>

      {/* Search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number or client..." className="glass-input pl-9" />
        </div>

        {/* Status dropdown */}
        <StatusFilterDropdown value={statusFilter} onChange={setStatusFilter} />

        {/* Type filter dropdown */}
        <TypeFilterDropdown value={typeFilter} onChange={setTypeFilter} />

        {(statusFilter !== "all" || typeFilter !== "all") && (
          <button
            onClick={() => { setStatusFilter("all"); setTypeFilter("all"); }}
            className="text-xs text-text-muted hover:text-accent transition-colors"
          >
            Clear
          </button>
        )}
        <span className="text-xs text-text-muted ml-auto hidden sm:block">
          {sorted.length} invoice{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <GlassCard padding="md">
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-text-muted">Loading invoices...</p>
          </div>
        </GlassCard>
      ) : sorted.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices found" description="Create your first invoice or adjust your filters." />
      ) : (
        <GlassCard padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]" style={{ background: "rgba(255,255,255,0.70)" }}>
                  <th className="text-left px-5 py-3">
                    <button onClick={() => toggleSort("invoice")} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-accent transition-colors">
                      Invoice <SortIcon field="invoice" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button onClick={() => toggleSort("client")} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-accent transition-colors">
                      Client <SortIcon field="client" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">
                    <button onClick={() => toggleSort("type")} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-accent transition-colors">
                      Type <SortIcon field="type" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">
                    <button onClick={() => toggleSort("date")} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-accent transition-colors">
                      Date <SortIcon field="date" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3">
                    <button onClick={() => toggleSort("amount")} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-accent transition-colors ml-auto">
                      Amount <SortIcon field="amount" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">
                    <button onClick={() => toggleSort("status")} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-accent transition-colors">
                      Status <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {pagedInvoices.map((invoice, idx) => {
                  const isIntl = invoice.invoice_type === "international";
                  const inrAmount = invoice.total_amount_inr ?? null;
                  const isArchived = (invoice.status as string) === "archived";
                  return (
                    <tr key={invoice.id} onClick={() => {
                      setNavigatingId(invoice.id);
                      router.push(`/invoices/${invoice.id}`);
                    }}
                      className={cn(
                        "hover:bg-surface-DEFAULT transition-colors cursor-pointer group",
                        isArchived && "opacity-60 grayscale",
                        idx < sorted.length - 1 && "border-b border-black/[0.05]"
                      )}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-sans font-semibold text-text-primary group-hover:text-accent transition-colors">
                            {getDisplayNumber(invoice)}
                          </p>
                          {navigatingId === invoice.id && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-text-secondary">{invoice.client_name}</p>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", TYPE_COLORS[invoice.invoice_type])}>
                          {TYPE_LABELS[invoice.invoice_type]}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <p className="text-sm text-text-muted font-sans">{formatDate(invoice.invoice_date)}</p>
                      </td>
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-end">
                          <CurrencyDisplay amount={invoice.total_amount} currency={invoice.currency as "INR" | "USD" | "AED"} size="sm" />
                          {isIntl && inrAmount && inrAmount > 0 && (
                            <span className="text-[11px] text-text-muted font-sans mt-0.5">~Rs.{(inrAmount / 1000).toFixed(1)}K</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                        <StatusChangeDropdown
                          status={invoice.status}
                          invoiceType={invoice.invoice_type}
                          onChange={(s) => handleStatusChange(invoice.id, s)}
                          onConvertProforma={() => convertProforma.mutate(invoice.id)}
                        />
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/invoices/${invoice.id}/edit`}
                          className="p-1.5 rounded-button text-text-muted hover:text-accent hover:bg-accent-muted transition-all opacity-0 group-hover:opacity-100 inline-flex">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={totalFiltered}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </GlassCard>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div />}>
      <InvoicesContent />
    </Suspense>
  );
}
