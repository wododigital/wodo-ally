"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText, Clock, AlertCircle, CheckCircle2, Calendar,
  TrendingUp, ArrowRight, Plus, Loader2,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkLabel, DarkCard } from "@/components/shared/dark-section";
import { cn } from "@/lib/utils/cn";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  useScheduledInvoices,
  useUpdateScheduledInvoice,
  useCollectionsInvoices,
} from "@/lib/hooks/use-invoices";
import { NewInvoiceModal } from "@/components/shared/new-invoice-modal";

// ─── Constants ────────────────────────────────────────────────────────────────

const URGENCY_CONFIG = {
  overdue:  { color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.15)",   icon: AlertCircle,   label: "Overdue"   },
  due_soon: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.15)",  icon: Clock,         label: "Due Soon"  },
  upcoming: { color: "#3b82f6", bg: "rgba(59,130,246,0.06)",  border: "rgba(59,130,246,0.10)",  icon: Calendar,      label: "Upcoming"  },
};

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "rgba(255,255,255,0.95)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "#111827",
};

function formatMonth(m: string) {
  const [year, month] = m.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(month) - 1]} ${year}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const { data: scheduledItems = [], isLoading: siLoading } = useScheduledInvoices();
  const { data: collections = [], isLoading: colLoading } = useCollectionsInvoices();
  const updateScheduled = useUpdateScheduledInvoice();
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceClientId, setInvoiceClientId] = useState("");

  // Derive billing months from real data (sorted unique)
  const billingMonths = useMemo(() => {
    const months = Array.from(new Set(scheduledItems.map((i) => i.billing_month))).sort();
    return months;
  }, [scheduledItems]);

  const [activeMonth, setActiveMonth] = useState<string>("");

  // Pick first month as default when data loads
  const currentMonth = activeMonth || billingMonths[0] || "";

  const monthItems = scheduledItems.filter((i) => i.billing_month === currentMonth);
  const monthTotal = monthItems.reduce((s, i) => s + i.amount, 0);

  // KPI calculations
  const firstMonth = billingMonths[0] ?? "";
  const secondMonth = billingMonths[1] ?? "";
  const firstMonthItems = scheduledItems.filter((i) => i.billing_month === firstMonth);
  const aprTotal = firstMonthItems.reduce((s, i) => s + i.amount, 0);
  const aprPending = firstMonthItems.filter((i) => i.status === "pending").length;

  const overdueAmount = collections
    .filter((c) => c.urgency === "overdue")
    .reduce((s, c) => s + (c.balance_due ?? 0), 0);

  const twoMonthPipeline = scheduledItems
    .filter((i) => i.billing_month === firstMonth || i.billing_month === secondMonth)
    .reduce((s, i) => s + i.amount, 0);

  const aprExpected = collections
    .filter((c) => {
      if (!c.due_date) return false;
      const m = c.due_date.slice(0, 7);
      return m === firstMonth;
    })
    .reduce((s, c) => s + (c.balance_due ?? 0), 0);

  // Forecast chart - aggregate scheduled invoices by billing month
  const forecastData = useMemo(() => {
    const map = new Map<string, { retainer: number; one_time: number }>();
    for (const item of scheduledItems) {
      const entry = map.get(item.billing_month) ?? { retainer: 0, one_time: 0 };
      const isRetainer =
        item.engagement_type === "retainer" || item.engagement_type === null;
      if (isRetainer) entry.retainer += item.amount;
      else entry.one_time += item.amount;
      map.set(item.billing_month, entry);
    }
    // Sort and label
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({
        month: formatMonth(month).slice(0, 3),
        ...vals,
      }));
  }, [scheduledItems]);

  const isLoading = siLoading || colLoading;

  return (
    <div className="space-y-8 animate-fade-in">
      {showInvoiceModal && (
        <NewInvoiceModal
          onClose={() => setShowInvoiceModal(false)}
          preselectedClientId={invoiceClientId}
        />
      )}

      {/* ── KPI summary ─────────────────────────────────────────────────────── */}
      <DarkSection>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>Pipeline Overview</p>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Link href="/analytics/invoices"
              className="px-2.5 py-1 rounded-button text-xs font-medium transition-all border bg-white/[0.04] text-white/50 border-white/[0.08] hover:border-white/[0.14] hover:text-white/70">
              Analytics
            </Link>
            <button
              onClick={() => { setInvoiceClientId(""); setShowInvoiceModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-button text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "rgba(253,126,20,0.85)" }}>
              <Plus className="w-3 h-3" />
              New Invoice
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: FileText,
              label: `${firstMonth ? formatMonth(firstMonth) : "Next"} - To Invoice`,
              value: isLoading ? "..." : `Rs.${(aprTotal/1000).toFixed(0)}K`,
              sub: isLoading ? "" : `${aprPending} invoice${aprPending !== 1 ? "s" : ""} pending`,
              color: "#fd7e14",
            },
            {
              icon: TrendingUp,
              label: "Outstanding to Collect",
              value: isLoading ? "..." : `Rs.${((collections.reduce((s, c) => s + (c.balance_due ?? 0), 0)) / 1000).toFixed(0)}K`,
              sub: isLoading ? "" : `${collections.length} open invoice${collections.length !== 1 ? "s" : ""}`,
              color: "#22c55e",
            },
            {
              icon: Calendar,
              label: "2-Month Pipeline",
              value: isLoading ? "..." : `Rs.${(twoMonthPipeline / 100000).toFixed(2)}L`,
              sub: "Retainer + milestone invoices",
              color: "#3b82f6",
            },
            {
              icon: AlertCircle,
              label: "Overdue to Collect",
              value: isLoading ? "..." : `Rs.${(overdueAmount / 1000).toFixed(0)}K`,
              sub: overdueAmount > 0 ? "Needs immediate follow-up" : "No overdue invoices",
              color: "#ef4444",
            },
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

      {/* ── Main two-column layout ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── Left col (3/5): Invoices to Raise ─────────────────────────────── */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Invoices to Raise</h2>
            <button
              onClick={() => { setInvoiceClientId(""); setShowInvoiceModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
            >
              <Plus className="w-3 h-3" />
              New Invoice
            </button>
          </div>

          {/* Month tabs */}
          {isLoading ? (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 h-14 bg-surface-DEFAULT rounded-xl animate-pulse border border-black/[0.05]" />
              ))}
            </div>
          ) : billingMonths.length === 0 ? (
            <p className="text-sm text-text-muted">No scheduled invoices found.</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {billingMonths.map((m) => {
                const count = scheduledItems.filter((i) => i.billing_month === m && i.status === "pending").length;
                const total = scheduledItems.filter((i) => i.billing_month === m).reduce((s, i) => s + i.amount, 0);
                return (
                  <button
                    key={m}
                    onClick={() => setActiveMonth(m)}
                    className={cn(
                      "flex-1 min-w-[120px] px-3 py-2.5 rounded-xl text-left transition-all duration-150 border",
                      currentMonth === m
                        ? "border-accent bg-accent-muted"
                        : "border-black/[0.05] bg-surface-DEFAULT hover:border-black/[0.08]"
                    )}
                  >
                    <p className={cn("text-xs font-semibold", currentMonth === m ? "text-accent" : "text-text-primary")}>
                      {formatMonth(m)}
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5 font-sans">
                      Rs.{(total / 1000).toFixed(0)}K
                      {count > 0 && <span className="ml-1 text-accent">· {count} pending</span>}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Invoice rows */}
          {!isLoading && currentMonth && (
            <GlassCard padding="none">
              {monthItems.length === 0 ? (
                <div className="py-10 text-center text-sm text-text-muted">
                  No invoices scheduled for {formatMonth(currentMonth)}
                </div>
              ) : (
                monthItems.map((item, idx) => {
                  const isGenerated = item.status === "generated";
                  const isUpdating = updateScheduled.isPending;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-4 px-5 py-4 transition-colors",
                        idx < monthItems.length - 1 && "border-b border-black/[0.05]",
                        isGenerated && "opacity-60"
                      )}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-accent shrink-0"
                        style={{ background: "rgba(253,126,20,0.10)", border: "1px solid rgba(253,126,20,0.15)" }}
                      >
                        {item.client_name.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/clients/${item.client_id}`}
                            className="text-sm font-semibold text-text-primary hover:text-accent transition-colors"
                          >
                            {item.client_name}
                          </Link>
                          <span
                            className={cn(
                              "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                              item.engagement_type === "retainer"
                                ? "text-blue-500 bg-blue-500/10"
                                : "text-purple-500 bg-purple-500/10"
                            )}
                          >
                            {item.engagement_type === "retainer" ? "Retainer" : "Milestone"}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5 truncate">{item.project_name}</p>
                        <p className="text-[10px] text-text-muted mt-0.5 font-sans">
                          Bill {item.scheduled_date.slice(8)} {formatMonth(item.billing_month).split(" ")[0]}
                          <span className="mx-1">·</span>
                          Expected by {new Date(item.expected_payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>

                      <div className="text-right shrink-0 mr-2">
                        <p className="text-sm font-bold font-sans text-text-primary">{item.display_amount}</p>
                        <p className="text-[10px] text-text-muted">{item.currency}</p>
                      </div>

                      {isGenerated ? (
                        <span className="flex items-center gap-1 text-xs text-green-500 font-medium shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Done
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            updateScheduled.mutate({ id: item.id, status: "generated" });
                            setInvoiceClientId(item.client_id);
                            setShowInvoiceModal(true);
                          }}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-semibold text-white transition-all hover:opacity-90"
                          style={{ background: "#fd7e14" }}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <FileText className="w-3 h-3" />
                          )}
                          Create
                        </button>
                      )}
                    </div>
                  );
                })
              )}

              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ background: "rgba(0,0,0,0.02)", borderTop: "1px solid rgba(0,0,0,0.05)" }}
              >
                <span className="text-xs text-text-muted font-medium">{formatMonth(currentMonth)} total</span>
                <span className="text-sm font-bold font-sans text-text-primary">
                  Rs.{(monthTotal / 1000).toFixed(0)}K
                </span>
              </div>
            </GlassCard>
          )}
        </div>

        {/* ── Right col (2/5): Expected Collections ─────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Expected Collections</h2>

          {colLoading ? (
            <GlassCard padding="md">
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-black/[0.04] rounded animate-pulse" />
                ))}
              </div>
            </GlassCard>
          ) : collections.length === 0 ? (
            <GlassCard padding="md">
              <p className="text-sm text-text-muted text-center py-4">No outstanding collections</p>
            </GlassCard>
          ) : (
            <GlassCard padding="none">
              {(["overdue", "due_soon", "upcoming"] as const).map((urgency) => {
                const items = collections.filter((e) => e.urgency === urgency);
                if (items.length === 0) return null;
                const cfg = URGENCY_CONFIG[urgency];
                const Icon = cfg.icon;
                return (
                  <div key={urgency}>
                    <div
                      className="flex items-center gap-2 px-5 py-2.5"
                      style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: cfg.color }} />
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                        {cfg.label}
                      </span>
                      <span className="ml-auto text-[11px] font-sans font-semibold" style={{ color: cfg.color }}>
                        Rs.{(items.reduce((s, e) => s + (e.balance_due ?? 0), 0) / 1000).toFixed(0)}K
                      </span>
                    </div>
                    {items.map((e, idx) => (
                      <Link
                        key={e.id}
                        href={`/invoices/${e.id}`}
                        className={cn(
                          "flex items-center gap-3 px-5 py-3.5 hover:bg-surface-DEFAULT transition-colors",
                          idx < items.length - 1 && "border-b border-black/[0.04]"
                        )}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{ background: `${cfg.color}12`, color: cfg.color }}
                        >
                          {e.client_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-text-primary truncate">{e.client_name}</p>
                          <p className="text-[10px] text-text-muted font-sans">
                            {e.invoice_number ?? e.proforma_ref ?? "Draft"} · {e.days_label}
                          </p>
                        </div>
                        <p className="text-sm font-bold font-sans shrink-0" style={{ color: cfg.color }}>
                          Rs.{(e.balance_due ?? 0).toLocaleString("en-IN")}
                        </p>
                      </Link>
                    ))}
                  </div>
                );
              })}

              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ background: "rgba(0,0,0,0.02)", borderTop: "1px solid rgba(0,0,0,0.05)" }}
              >
                <span className="text-xs text-text-muted">Total outstanding</span>
                <span className="text-sm font-bold font-sans text-text-primary">
                  Rs.{(collections.reduce((s, e) => s + (e.balance_due ?? 0), 0) / 100000).toFixed(2)}L
                </span>
              </div>
            </GlassCard>
          )}

          <Link
            href="/payments"
            className="flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all hover:opacity-80"
            style={{ background: "rgba(253,126,20,0.08)", border: "1px solid rgba(253,126,20,0.15)" }}
          >
            <span className="text-accent font-medium text-xs">View full payment history</span>
            <ArrowRight className="w-3.5 h-3.5 text-accent" />
          </Link>
        </div>
      </div>

      {/* ── 6-month income forecast ─────────────────────────────────────────── */}
      {forecastData.length > 0 && (
        <GlassCard padding="md">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Income Forecast</h2>
              <p className="text-xs text-text-muted mt-0.5">Based on scheduled invoices · Retainer is certain</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm inline-block" style={{ background: "#fd7e14" }} />
                Retainer (certain)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm inline-block" style={{ background: "#3b82f6" }} />
                One-time (projected)
              </span>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v: number, name: string) => [
                    `Rs.${v.toLocaleString("en-IN")}`,
                    name === "retainer" ? "Retainer" : "One-Time",
                  ]}
                />
                <Bar dataKey="retainer" stackId="a" fill="#fd7e14" radius={[0, 0, 0, 0]} />
                <Bar dataKey="one_time" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4 pt-4 border-t border-black/[0.05]">
            {forecastData.map((f) => (
              <div key={f.month} className="text-center">
                <p className="text-[10px] text-text-muted">{f.month}</p>
                <p className="text-xs font-bold font-sans text-text-primary mt-0.5">
                  Rs.{((f.retainer + f.one_time) / 1000).toFixed(0)}K
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
