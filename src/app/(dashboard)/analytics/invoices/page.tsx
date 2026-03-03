"use client";

import { useState, useEffect } from "react";
import { FileText, Clock, CheckCircle2, AlertCircle, TrendingUp, BarChart2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkCard } from "@/components/shared/dark-section";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/loading-skeleton";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { cn } from "@/lib/utils/cn";
import {
  useInvoiceStatusSummary,
  useRevenueByClient,
  useDashboardKPIs,
} from "@/lib/hooks/use-analytics";

const CHART_TOOLTIP = {
  backgroundColor: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "#111827",
};

const STATUS_COLORS: Record<string, string> = {
  paid:          "#22c55e",
  sent:          "#3b82f6",
  overdue:       "#ef4444",
  draft:         "#9ca3af",
  viewed:        "#8b5cf6",
  partially_paid:"#f59e0b",
  cancelled:     "#6b7280",
};

type Period = "month" | "ytd" | "q4" | "fy";

// ─── Page ──────────────────────────────────────────────────────────────────

export default function InvoiceAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("ytd");
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("period");
    if (p === "month" || p === "q4" || p === "ytd" || p === "fy") setPeriod(p as Period);
  }, []);

  const { data: statusRows, isLoading: statusLoading } = useInvoiceStatusSummary();
  const { data: clientRows, isLoading: clientLoading } = useRevenueByClient();
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();

  const isLoading = statusLoading || clientLoading || kpisLoading;

  // Derived invoice stats from status summary
  const totalInvoices = (statusRows ?? []).reduce((s, r) => s + Number(r.invoice_count), 0);
  const paidCount     = (statusRows ?? []).find((r) => r.status === "paid")?.invoice_count ?? 0;
  const overdueCount  = (statusRows ?? []).find((r) => r.status === "overdue")?.invoice_count ?? 0;
  const overdueValue  = (statusRows ?? []).find((r) => r.status === "overdue")?.total_value ?? 0;

  const collectionRate = totalInvoices > 0 ? Math.round((Number(paidCount) / totalInvoices) * 100) : 0;

  // Avg settlement - from client health scores avg_days_to_payment weighted
  const avgSettlement = (() => {
    const rows = clientRows ?? [];
    const weighted = rows.filter((r) => r.avg_days_to_payment != null);
    if (weighted.length === 0) return null;
    const sum = weighted.reduce((s, r) => s + (r.avg_days_to_payment ?? 0), 0);
    return (sum / weighted.length).toFixed(1);
  })();

  // Donut data for status distribution
  const statusDonutData = (statusRows ?? [])
    .filter((r) => Number(r.invoice_count) > 0)
    .map((r) => ({
      name: r.status.charAt(0).toUpperCase() + r.status.slice(1).replace(/_/g, " "),
      value: Number(r.invoice_count),
      color: STATUS_COLORS[r.status] ?? "#9ca3af",
    }));

  // Avg days to payment by client bar
  const clientPaymentDays = (clientRows ?? [])
    .filter((r) => r.avg_days_to_payment != null)
    .sort((a, b) => (a.avg_days_to_payment ?? 0) - (b.avg_days_to_payment ?? 0))
    .slice(0, 8)
    .map((r) => ({
      client: r.client_name.length > 12 ? r.client_name.slice(0, 11) + "." : r.client_name,
      days: r.avg_days_to_payment ?? 0,
    }));

  const PERIODS: { key: Period; label: string }[] = [
    { key: "month", label: "This Month" },
    { key: "q4",    label: "Q4 (Jan-Mar)" },
    { key: "ytd",   label: "YTD" },
    { key: "fy",    label: "Full Year" },
  ];

  return (
    <div className="space-y-6">

      {/* Invoice Health */}
      <DarkSection>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>Invoice Health</p>
          <div className="flex items-center gap-2">
            {PERIODS.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={cn(
                  "px-2.5 py-1 rounded-button text-xs font-medium transition-all border",
                  period === p.key
                    ? "bg-white/[0.12] text-white border-white/[0.2]"
                    : "bg-white/[0.04] text-white/40 border-white/[0.08] hover:border-white/[0.14]"
                )}>{p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <DarkCard key={i} className="p-5 space-y-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-3 w-32" />
                </DarkCard>
              ))
            : [
                {
                  icon: CheckCircle2,
                  label: "Collection rate",
                  value: `${collectionRate}%`,
                  sub: `${paidCount} of ${totalInvoices} invoices paid`,
                  color: "#22c55e",
                },
                {
                  icon: Clock,
                  label: "Avg settlement",
                  value: avgSettlement != null ? `${avgSettlement}d` : "N/A",
                  sub: "Across all clients",
                  color: "#3b82f6",
                },
                {
                  icon: AlertCircle,
                  label: "Overdue amount",
                  value: `Rs.${(Number(overdueValue) / 1000).toFixed(1)}K`,
                  sub: `${overdueCount} invoice${Number(overdueCount) !== 1 ? "s" : ""} need follow-up`,
                  color: "#ef4444",
                },
                {
                  icon: TrendingUp,
                  label: "MRR (retainers)",
                  value: kpis ? `Rs.${(kpis.mrr / 100000).toFixed(2)}L` : "-",
                  sub: "Active retainer projects",
                  color: "#fd7e14",
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

      {/* Revenue mix: retainer vs one-time via client bar chart */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue Collected by Client</h3>
        {clientLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : (clientRows ?? []).filter((c) => c.total_collected > 0).length === 0 ? (
          <EmptyState icon={FileText} title="No payment data" description="Record invoice payments to see client revenue." />
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(clientRows ?? []).filter((c) => c.total_collected > 0).slice(0, 8).map((c) => ({
                  client: c.client_name.length > 10 ? c.client_name.slice(0, 9) + "." : c.client_name,
                  collected: c.total_collected,
                  invoiced: c.total_invoiced,
                }))}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="client" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${v.toLocaleString("en-IN")}`, ""]} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="invoiced"  name="Invoiced"   fill="#fd7e14" opacity={0.4} radius={[0, 0, 0, 0]} />
                <Bar dataKey="collected" name="Collected"  fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status distribution */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Invoice Status Distribution</h3>
          {statusLoading ? (
            <div className="flex items-center gap-6">
              <Skeleton className="h-40 w-40 rounded-full shrink-0" />
              <div className="flex-1 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            </div>
          ) : statusDonutData.length === 0 ? (
            <EmptyState icon={FileText} title="No invoices yet" description="Create invoices to see status distribution." />
          ) : (
            <div className="flex items-center gap-6">
              <div className="h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDonutData} cx="50%" cy="50%" innerRadius={42} outerRadius={64} dataKey="value" paddingAngle={3}>
                      {statusDonutData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`${v} invoices`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 flex-1">
                {statusDonutData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      {s.name}
                    </span>
                    <span className="text-sm font-bold font-sans px-2 py-0.5 rounded-full"
                      style={{ background: `${s.color}18`, color: s.color }}>
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        {/* Avg payment days by client */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Avg. Days to Payment by Client</h3>
          {clientLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : clientPaymentDays.length === 0 ? (
            <EmptyState icon={BarChart2} title="No payment data" description="Payment timing data will appear once invoices are paid." />
          ) : (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientPaymentDays} layout="vertical" margin={{ left: 0, right: 32, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}d`} />
                  <YAxis type="category" dataKey="client" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`${v} days`, ""]} />
                  <Bar dataKey="days" radius={[0, 4, 4, 0]}
                    fill="#fd7e14"
                    label={{ position: "right", fontSize: 11, fill: "#9ca3af", formatter: (v: number) => `${v}d` }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
