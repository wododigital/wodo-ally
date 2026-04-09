"use client";

import { useState, useMemo, useEffect } from "react";
import { AlertCircle, CheckCircle2, Search, CreditCard, ChevronUp, ChevronDown, TrendingUp, Clock } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkCard } from "@/components/shared/dark-section";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { DateFilter, DateFilterState, resolveDateRange } from "@/components/shared/date-filter";
import { Pagination, paginateArray } from "@/components/shared/pagination";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { usePaymentsList, useDashboardKPIs } from "@/lib/hooks/use-analytics";

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  skydo_usd: "Skydo (USD)",
  skydo_aed: "Skydo (AED)",
  skydo_gbp: "Skydo (GBP)",
  upi: "UPI",
  other: "Other",
};

type SortField = "payment_date" | "client_name" | "amount_received" | "payment_method";
type SortDir = "asc" | "desc";

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-20" />;
  return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-accent" /> : <ChevronDown className="w-3 h-3 text-accent" />;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ mode: "all" });
  const [sortField, setSortField] = useState<SortField>("payment_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: payments, isLoading: paymentsLoading } = usePaymentsList();
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const isLoading = paymentsLoading || kpisLoading;

  const dateRange = useMemo(() => resolveDateRange(dateFilter), [dateFilter]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  const filtered = useMemo(() => {
    let list = payments ?? [];
    if (dateRange) {
      list = list.filter((p) => {
        const d = new Date(p.payment_date);
        return d >= dateRange.start && d <= dateRange.end;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.client_name.toLowerCase().includes(q) ||
        (p.invoice_number ?? "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "payment_date") cmp = new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime();
      if (sortField === "client_name") cmp = a.client_name.localeCompare(b.client_name);
      if (sortField === "amount_received") cmp = Number(a.amount_received_inr ?? a.amount_received) - Number(b.amount_received_inr ?? b.amount_received);
      if (sortField === "payment_method") cmp = (a.payment_method ?? "").localeCompare(b.payment_method ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [payments, dateRange, search, sortField, sortDir]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [search, dateFilter, sortField, sortDir]);

  const PAGE_SIZE = 20;
  const { paged: paginated, total: totalFiltered } = paginateArray(filtered, currentPage, PAGE_SIZE);

  // All-time totals for KPIs (unaffected by filters)
  const allPayments = payments ?? [];
  const totalReceivedAllTime = allPayments.reduce((s, p) => s + Number(p.amount_received_inr ?? p.amount_received), 0);
  const totalTdsAllTime = allPayments.reduce((s, p) => s + Number(p.tds_amount), 0);
  const totalOutstanding = kpis?.outstanding ?? 0;
  const overdueCount = kpis?.overdue_invoices ?? 0;

  const hasFilters = search || dateFilter.mode !== "all";

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Dark KPI header */}
      <DarkSection>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
            Payments Overview
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: TrendingUp,   label: "Total Received", value: isLoading ? "-" : `Rs.${(totalReceivedAllTime / 100000).toFixed(1)}L`, sub: "All time",          color: "#22c55e" },
            { icon: Clock,        label: "Outstanding",    value: isLoading ? "-" : `Rs.${(totalOutstanding / 1000).toFixed(0)}K`,       sub: "Awaiting payment", color: "#f59e0b" },
            { icon: AlertCircle,  label: "Overdue",        value: isLoading ? "-" : `${overdueCount} invoice${overdueCount !== 1 ? "s" : ""}`, sub: "Follow-up needed", color: "#ef4444" },
            { icon: CheckCircle2, label: "TDS Deducted",   value: isLoading ? "-" : `Rs.${totalTdsAllTime.toLocaleString("en-IN")}`,     sub: "All time",          color: "#6b7280" },
          ].map((stat) => (
            <DarkCard key={stat.label} className="p-5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
                style={{ background: `${stat.color}18` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <p className="text-xl font-light font-sans mb-0.5" style={{ color: "rgba(255,255,255,0.92)" }}>
                {stat.value}
              </p>
              <p className="text-[11px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{stat.label}</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{stat.sub}</p>
            </DarkCard>
          ))}
        </div>
      </DarkSection>

      {/* Search + date filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client or invoice..."
            className="glass-input pl-9"
          />
        </div>
        <DateFilter value={dateFilter} onChange={setDateFilter} />
      </div>

      {/* Table */}
      {isLoading ? (
        <GlassCard padding="none">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-black/[0.05] last:border-0">
              <Skeleton className="w-9 h-9 rounded-button shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard padding="md">
          <EmptyState
            icon={CreditCard}
            title="No payments found"
            description={
              hasFilters
                ? "No payments match your filters. Try adjusting the search or date range."
                : "No payment records found. Payments will appear here once recorded against invoices."
            }
          />
        </GlassCard>
      ) : (
        <GlassCard padding="none">
          {/* Table header */}
          <div
            className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-black/[0.06]"
            style={{ background: "rgba(255,255,255,0.65)" }}
          >
            {[
              { label: "Client / Invoice", field: "client_name"    as SortField },
              { label: "Method",           field: "payment_method" as SortField },
              { label: "Date",             field: "payment_date"   as SortField },
              { label: "Amount",           field: "amount_received" as SortField },
            ].map(({ label, field }) => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors"
              >
                {label}
                <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
              </button>
            ))}
          </div>

          {paginated.map((payment, idx) => (
            <div
              key={payment.id}
              className={cn(
                "flex md:grid md:grid-cols-[2fr_1fr_1fr_1fr] items-start gap-4 px-5 py-4",
                idx < paginated.length - 1 && "border-b border-black/[0.05]"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-button flex items-center justify-center shrink-0"
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
                >
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{payment.client_name}</p>
                  <p className="text-xs text-text-muted mt-0.5 font-sans">
                    {payment.invoice_number ?? payment.invoice_id.slice(0, 8)}
                  </p>
                  {payment.reference_number && (
                    <p className="text-xs text-text-muted font-sans">{payment.reference_number}</p>
                  )}
                </div>
              </div>

              <div className="hidden md:flex items-center">
                <span className="text-sm text-text-secondary">
                  {payment.payment_method ? METHOD_LABELS[payment.payment_method] ?? payment.payment_method : "-"}
                </span>
              </div>

              <div className="hidden md:flex items-center">
                <span className="text-sm font-sans text-text-secondary">{formatDate(payment.payment_date)}</span>
              </div>

              <div className="ml-auto md:ml-0 flex flex-col items-end md:items-start">
                <CurrencyDisplay
                  amount={payment.amount_received_inr ?? payment.amount_received}
                  currency="INR"
                  size="sm"
                  className="text-green-400"
                />
                {payment.tds_amount > 0 && (
                  <span className="text-xs text-yellow-400/80 mt-0.5">
                    TDS: -Rs.{payment.tds_amount.toLocaleString("en-IN")}
                  </span>
                )}
                {(payment.skydo_fx_margin > 0 || payment.skydo_processing_fee > 0) && (
                  <span className="text-xs text-blue-400/70 mt-0.5">
                    Fee: Rs.{(payment.skydo_fx_margin + payment.skydo_processing_fee).toLocaleString("en-IN")}
                  </span>
                )}
                <p className="md:hidden text-xs text-text-muted mt-0.5">{formatDate(payment.payment_date)}</p>
              </div>
            </div>
          ))}
          <Pagination
            currentPage={currentPage}
            totalItems={totalFiltered}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </GlassCard>
      )}

      {overdueCount > 0 && (
        <GlassCard padding="md">
          <div
            className="flex items-start gap-3 p-3 rounded-card"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}
          >
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-text-primary">Overdue invoices need attention</p>
              <p className="text-xs font-sans font-semibold text-red-400 mt-0.5">
                {overdueCount} invoice{overdueCount !== 1 ? "s" : ""} - Total outstanding: Rs.{(totalOutstanding / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
