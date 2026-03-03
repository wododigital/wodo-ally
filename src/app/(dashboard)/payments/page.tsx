"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Search, CreditCard } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/loading-skeleton";
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const { data: payments, isLoading: paymentsLoading } = usePaymentsList();
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();

  const isLoading = paymentsLoading || kpisLoading;

  const filtered = (payments ?? []).filter((p) =>
    p.client_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.invoice_number ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalReceived = (payments ?? []).reduce(
    (s, p) => s + Number(p.amount_received_inr ?? p.amount_received),
    0
  );
  const totalTds = (payments ?? []).reduce(
    (s, p) => s + Number(p.tds_amount),
    0
  );
  const totalSkydo = (payments ?? []).reduce(
    (s, p) => s + Number(p.skydo_fx_margin) + Number(p.skydo_processing_fee),
    0
  );
  const totalOutstanding = kpis?.outstanding ?? 0;
  const overdueCount = kpis?.overdue_invoices ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Payments"
        description="Track all incoming payments and deductions"
      />

      {/* Compact summary bar */}
      <GlassCard padding="md">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.05]">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 first:pl-0 last:pr-0 py-1 sm:py-0 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-28" />
                </div>
              ))
            : [
                { label: "Total Received",  value: `Rs.${(totalReceived / 100000).toFixed(1)}L`, color: "#16a34a" },
                { label: "Outstanding",     value: `Rs.${(totalOutstanding / 1000).toFixed(0)}K`, color: "#f59e0b" },
                { label: "TDS Deducted",    value: `Rs.${totalTds.toLocaleString("en-IN")}`, color: "#6b7280" },
                { label: "Skydo Fees",      value: `Rs.${totalSkydo.toLocaleString("en-IN")}`, color: "#6b7280" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-0.5 px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{item.label}</span>
                  <span className="text-lg font-bold font-sans" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search payments..."
              className="glass-input pl-9"
            />
          </div>

          {isLoading ? (
            <GlassCard padding="none">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-4 border-b border-black/[0.05] last:border-0">
                  <Skeleton className="w-9 h-9 rounded-button shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <div className="space-y-1 text-right">
                    <Skeleton className="h-4 w-24 ml-auto" />
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </div>
                </div>
              ))}
            </GlassCard>
          ) : filtered.length === 0 ? (
            <GlassCard padding="md">
              <EmptyState
                icon={CreditCard}
                title="No payments found"
                description={
                  search
                    ? "No payments match your search. Try a different client name or invoice number."
                    : "No payment records found. Payments will appear here once recorded against invoices."
                }
              />
            </GlassCard>
          ) : (
            <GlassCard padding="none">
              {filtered.map((payment, idx) => (
                <div
                  key={payment.id}
                  className={cn(
                    "flex items-start gap-4 px-5 py-4",
                    idx < filtered.length - 1 && "border-b border-black/[0.05]"
                  )}
                >
                  <div
                    className="w-9 h-9 rounded-button flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{payment.client_name}</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {payment.invoice_number ?? payment.invoice_id.slice(0, 8)} -{" "}
                          {payment.payment_method
                            ? METHOD_LABELS[payment.payment_method] ?? payment.payment_method
                            : "Unknown method"}
                        </p>
                        {payment.reference_number && (
                          <p className="text-xs text-text-muted font-sans mt-0.5">{payment.reference_number}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <CurrencyDisplay
                          amount={payment.amount_received_inr ?? payment.amount_received}
                          currency="INR"
                          size="sm"
                          className="text-green-400"
                        />
                        <p className="text-xs text-text-muted mt-0.5">{formatDate(payment.payment_date)}</p>
                      </div>
                    </div>
                    {(payment.tds_amount > 0 ||
                      payment.skydo_fx_margin > 0 ||
                      payment.skydo_processing_fee > 0) && (
                      <div className="flex items-center gap-3 mt-2">
                        {payment.tds_amount > 0 && (
                          <span className="text-xs text-yellow-400/80 bg-yellow-500/10 px-2 py-0.5 rounded">
                            TDS: -Rs.{payment.tds_amount.toLocaleString("en-IN")}
                          </span>
                        )}
                        {(payment.skydo_fx_margin > 0 || payment.skydo_processing_fee > 0) && (
                          <span className="text-xs text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded">
                            Skydo fee: -Rs.{(payment.skydo_fx_margin + payment.skydo_processing_fee).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </GlassCard>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Needs follow-up */}
          <GlassCard padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Needs Follow-Up</h3>
            {kpisLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : overdueCount === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">No overdue invoices</p>
            ) : (
              <div
                className="flex items-start gap-3 p-3 rounded-card"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}
              >
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">Overdue invoices</p>
                  <p className="text-xs font-sans font-semibold text-red-400 mt-1">
                    {overdueCount} invoice{overdueCount !== 1 ? "s" : ""} need attention
                  </p>
                  <p className="text-xs font-sans text-red-400/70">
                    Total outstanding: Rs.{(totalOutstanding / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Monthly summary from payments */}
          <GlassCard padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Recent Months</h3>
            {paymentsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (payments ?? []).length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">No payment data</p>
            ) : (
              <div className="space-y-2">
                {(() => {
                  // Group payments by month
                  const byMonth: Record<string, number> = {};
                  for (const p of payments ?? []) {
                    const d = new Date(p.payment_date);
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                    const label = d.toLocaleString("en-IN", { month: "short", year: "numeric" });
                    if (!byMonth[key]) byMonth[key] = 0;
                    byMonth[key] += Number(p.amount_received_inr ?? p.amount_received);
                    // Store label mapping
                    (byMonth as Record<string, unknown>)[`${key}_label`] = label;
                  }
                  const months = Object.keys(byMonth)
                    .filter((k) => !k.endsWith("_label"))
                    .sort()
                    .reverse()
                    .slice(0, 4);

                  return months.map((key) => {
                    const amount = byMonth[key];
                    const label = (byMonth as Record<string, unknown>)[`${key}_label`] as string;
                    return (
                      <div key={key} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-text-secondary">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-sans text-text-primary">
                            Rs.{(amount / 1000).toFixed(0)}K
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                            Paid
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
