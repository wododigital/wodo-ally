"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown, IndianRupee, BarChart2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkLabel, DarkCard } from "@/components/shared/dark-section";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/loading-skeleton";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils/cn";
import {
  useMonthlyPL,
  useRevenueByService,
  useRevenueByClient,
  useDashboardKPIs,
} from "@/lib/hooks/use-analytics";

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_TOOLTIP = {
  backgroundColor: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "10px",
  color: "#111827",
  fontSize: "12px",
};

const GRID = { stroke: "rgba(0,0,0,0.06)" };
const AXIS  = { fill: "#9ca3af", fontSize: 11 };

type Period = "month" | "q4" | "q3" | "ytd" | "fy" | "custom";

const PERIODS: { key: Period; label: string }[] = [
  { key: "month", label: "Month" },
  { key: "q3",    label: "Q3 (Oct-Dec)" },
  { key: "q4",    label: "Q4 (Jan-Mar)" },
  { key: "ytd",   label: "YTD" },
  { key: "fy",    label: "Full Year" },
  { key: "custom",label: "Custom" },
];

// Map month labels to fiscal quarter (Apr=Q1 ... Mar=Q4 in FY Apr-Mar)
function isQ3Month(label: string) {
  return ["Oct", "Nov", "Dec"].some((m) => label.startsWith(m));
}
function isQ4Month(label: string) {
  return ["Jan", "Feb", "Mar"].some((m) => label.startsWith(m));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod]         = useState<Period>("fy");
  const [showProjection, setShowProjection] = useState(false);
  const [customFrom] = useState("2025-04-01");
  const [customTo]   = useState("2026-03-31");

  const { data: plRows, isLoading: plLoading } = useMonthlyPL();
  const { data: serviceRows, isLoading: serviceLoading } = useRevenueByService();
  const { data: clientRows, isLoading: clientLoading } = useRevenueByClient();
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();

  const isLoading = plLoading || serviceLoading || clientLoading || kpisLoading;

  // Build chart data from PL view rows
  const allChartData = (plRows ?? []).map((row) => ({
    month: row.month_label.slice(0, 3),
    monthFull: row.month_label,
    month_start: row.month_start,
    revenue: row.total_revenue,
    expenses: row.total_expenses,
  }));

  // Filter by period
  const chartData = (() => {
    if (!allChartData.length) return [];
    if (period === "month")  return allChartData.slice(-1);
    if (period === "q3")     return allChartData.filter((d) => isQ3Month(d.month));
    if (period === "q4")     return allChartData.filter((d) => isQ4Month(d.month));
    if (period === "ytd")    return allChartData.slice(0, -1);
    return allChartData; // fy + custom
  })();

  const revenue  = chartData.reduce((s, m) => s + m.revenue, 0);
  const expenses = chartData.reduce((s, m) => s + m.expenses, 0);
  const netProfit = revenue - expenses;
  const margin    = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

  // Revenue by service - for donut
  const activeServices = (serviceRows ?? []).filter((s) => s.total_line_item_revenue > 0 || s.monthly_retainer_value > 0);
  const totalServiceRevenue = activeServices.reduce(
    (s, r) => s + r.total_line_item_revenue + r.monthly_retainer_value,
    0
  );
  const serviceDonutData = activeServices.slice(0, 6).map((s) => ({
    name: s.service_name,
    value: s.total_line_item_revenue + s.monthly_retainer_value,
    color: s.color || "#fd7e14",
  }));

  // Revenue by client - top 5
  const topClients = (clientRows ?? [])
    .filter((c) => c.total_collected > 0)
    .slice(0, 6)
    .map((c) => ({
      client: c.client_name.length > 12 ? c.client_name.slice(0, 11) + "." : c.client_name,
      revenue: c.total_collected,
    }));

  return (
    <div className="space-y-6">

      {/* Date filter toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              "px-3 py-1.5 rounded-button text-xs font-medium transition-all border",
              period === p.key
                ? "bg-accent-muted text-accent border-accent-light"
                : "bg-surface-DEFAULT text-text-muted border-black/[0.05] hover:border-black/[0.08]"
            )}
          >
            {p.label}
          </button>
        ))}
        {period === "fy" && (
          <button
            onClick={() => setShowProjection((v) => !v)}
            className={cn(
              "px-3 py-1.5 rounded-button text-xs font-medium transition-all border",
              showProjection
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-surface-DEFAULT text-text-muted border-black/[0.05]"
            )}
          >
            {showProjection ? "Hide" : "Show"} Projection
          </button>
        )}
      </div>

      {/* Dark Financial Snapshot */}
      <DarkSection>
        <DarkLabel>Financial Snapshot</DarkLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <DarkCard key={i} className="p-5 space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-20" />
                </DarkCard>
              ))
            : [
                {
                  label: "Total Revenue",
                  value: `Rs.${(revenue / 100000).toFixed(2)}L`,
                  sub: period === "fy" ? "FY 2025-26" : "Selected period",
                  icon: IndianRupee,
                  color: "#fd7e14",
                },
                {
                  label: "Total Expenses",
                  value: `Rs.${(expenses / 1000).toFixed(0)}K`,
                  sub: revenue > 0 ? `${Math.round((expenses / revenue) * 100)}% of revenue` : "-",
                  icon: TrendingDown,
                  color: "#ef4444",
                },
                {
                  label: "Net Profit",
                  value: `Rs.${(netProfit / 100000).toFixed(2)}L`,
                  sub: period === "fy" ? "After all expenses" : "For period",
                  icon: TrendingUp,
                  color: "#22c55e",
                },
                {
                  label: "Profit Margin",
                  value: `${margin}%`,
                  sub: margin >= 70 ? "Healthy margin" : "Watch expenses",
                  icon: TrendingUp,
                  color: margin >= 70 ? "#22c55e" : "#f59e0b",
                },
              ].map((stat) => (
                <DarkCard key={stat.label} className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: `${stat.color}18` }}>
                      <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                    </div>
                    <span className="text-[11px] uppercase tracking-wider font-bold"
                      style={{ color: "rgba(255,255,255,0.3)" }}>
                      {stat.label}
                    </span>
                  </div>
                  <p className="text-2xl font-light font-sans mb-1" style={{ color: "rgba(255,255,255,0.92)" }}>
                    {stat.value}
                  </p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{stat.sub}</p>
                </DarkCard>
              ))}
        </div>
      </DarkSection>

      {/* Main chart */}
      <GlassCard padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Revenue vs Expenses</h3>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-[#fd7e14] inline-block" /> Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-[#ef4444] inline-block" /> Expenses
            </span>
          </div>
        </div>
        <div className="h-56">
          {plLoading ? (
            <Skeleton className="w-full h-full" />
          ) : chartData.length === 0 ? (
            <EmptyState icon={BarChart2} title="No data for this period" description="Add invoice payments or transactions to see the chart." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#fd7e14" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fd7e14" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" {...GRID} />
                <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${(v as number).toLocaleString("en-IN")}`, ""]} />
                <Area type="monotone" dataKey="revenue"  name="Revenue"  stroke="#fd7e14" strokeWidth={2} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>

      {/* Service + Client side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Revenue by Service</h3>
            <Link href="/analytics/invoices" className="text-xs text-accent flex items-center gap-1 hover:opacity-80">
              Detail <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {serviceLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-44 w-44 shrink-0 rounded-full" />
              <div className="flex-1 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            </div>
          ) : serviceDonutData.length === 0 ? (
            <EmptyState icon={BarChart2} title="No service revenue" description="Tag line items with services to see breakdown." />
          ) : (
            <div className="flex items-center gap-4">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={serviceDonutData} cx="50%" cy="50%" innerRadius={46} outerRadius={72} dataKey="value" paddingAngle={3}>
                      {serviceDonutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${(v / 100000).toFixed(1)}L`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5 flex-1">
                {serviceDonutData.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-sans text-text-primary">
                        Rs.{(item.value / 100000).toFixed(1)}L
                      </span>
                    </div>
                    <div className="h-1 bg-black/[0.04] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${totalServiceRevenue > 0 ? Math.round((item.value / totalServiceRevenue) * 100) : 0}%`,
                        backgroundColor: item.color,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Revenue by Client</h3>
            <Link href="/analytics/clients" className="text-xs text-accent flex items-center gap-1 hover:opacity-80">
              Detail <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {clientLoading ? (
            <Skeleton className="h-44 w-full" />
          ) : topClients.length === 0 ? (
            <EmptyState icon={BarChart2} title="No client revenue" description="Record invoice payments to see client revenue." />
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClients} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="client" tick={AXIS} axisLine={false} tickLine={false} width={72} />
                  <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${v.toLocaleString("en-IN")}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#fd7e14" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Sub-page quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { href: "/analytics/expenses", label: "Expenses",    sub: "Cost breakdown"     },
          { href: "/analytics/projects", label: "Projects",    sub: "By type & status"   },
          { href: "/analytics/pl",       label: "P&L",         sub: "Profit & loss"      },
          { href: "/analytics/balance",  label: "Balance",     sub: "Balance sheet"      },
          { href: "/reports",            label: "Reports",     sub: "Investor reports"   },
        ].map((link) => (
          <Link key={link.href} href={link.href}
            className="p-4 rounded-card border border-black/[0.05] bg-surface-DEFAULT hover:border-black/[0.08] hover:bg-surface-hover transition-all group"
          >
            <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{link.label}</p>
            <p className="text-xs text-text-muted mt-0.5">{link.sub}</p>
          </Link>
        ))}
      </div>

    </div>
  );
}
