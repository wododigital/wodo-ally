"use client";

import { useState } from "react";

import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils/cn";

// ─── Raw data ─────────────────────────────────────────────────────────────

const ALL_MONTHS = [
  { month: "Apr", revenue: 218000, expenses: 42000 },
  { month: "May", revenue: 248000, expenses: 48000 },
  { month: "Jun", revenue: 282000, expenses: 51000 },
  { month: "Jul", revenue: 265000, expenses: 44000 },
  { month: "Aug", revenue: 354000, expenses: 62000 },
  { month: "Sep", revenue: 321000, expenses: 55000 },
  { month: "Oct", revenue: 298000, expenses: 49000 },
  { month: "Nov", revenue: 342000, expenses: 58000 },
  { month: "Dec", revenue: 387000, expenses: 67000 },
  { month: "Jan", revenue: 345000, expenses: 54000 },
  { month: "Feb", revenue: 335830, expenses: 29596 },
  { month: "Mar", revenue: 76700, expenses: 0 },
];

// Projected continuation for Apr-Jun 2026
const PROJECTED = [
  { month: "Apr*", revenue: 360000, expenses: 52000, projected: true },
  { month: "May*", revenue: 375000, expenses: 54000, projected: true },
  { month: "Jun*", revenue: 390000, expenses: 56000, projected: true },
];

const REVENUE_BY_SERVICE = [
  { name: "SEO", value: 1890000, color: "#fd7e14" },
  { name: "Web Dev", value: 1265830, color: "#3b82f6" },
  { name: "Branding", value: 450000, color: "#8b5cf6" },
  { name: "Google Ads", value: 240000, color: "#16a34a" },
];

const CLIENT_REVENUE = [
  { client: "Nandhini Hotel", revenue: 921900 },
  { client: "Dentique", revenue: 115830 },
  { client: "Sea Wonders", revenue: 357600 },
  { client: "Maximus OIGA", revenue: 590000 },
  { client: "Godavari", revenue: 100300 },
  { client: "Raj Ent.", revenue: 17500 },
];

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "10px",
  color: "#111827",
  fontSize: "12px",
};

const GRID_STYLE = { stroke: "rgba(0,0,0,0.06)" };
const AXIS_STYLE = { fill: "#9ca3af", fontSize: 11 };

// ─── Period filtering ─────────────────────────────────────────────────────

type Period = "fy" | "q4" | "ytd";

function getChartData(period: Period, showProjection: boolean) {
  let base: typeof ALL_MONTHS;
  if (period === "q4") {
    // Q4 FY 2025-26 = Jan, Feb, Mar
    base = ALL_MONTHS.slice(9);
  } else if (period === "ytd") {
    // YTD = Apr through Feb (11 months with full data; Mar partial excluded)
    base = ALL_MONTHS.slice(0, 11);
  } else {
    base = ALL_MONTHS;
  }
  if (showProjection && period === "fy") {
    return [...base, ...PROJECTED];
  }
  return base;
}

function sumData(data: { revenue: number; expenses: number }[]) {
  return data.reduce(
    (acc, m) => ({
      revenue: acc.revenue + m.revenue,
      expenses: acc.expenses + m.expenses,
    }),
    { revenue: 0, expenses: 0 }
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("fy");
  const [showProjection, setShowProjection] = useState(false);

  const chartData = getChartData(period, showProjection);
  const { revenue: totalRevenue, expenses: totalExpenses } = sumData(
    chartData.filter((m) => !(m as { projected?: boolean }).projected)
  );
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <PageHeader title="Analytics" description="Financial performance - FY 2025-26" />
        <div className="flex flex-wrap gap-2">
          {(["fy", "q4", "ytd"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 rounded-button text-xs font-medium uppercase transition-all",
                period === p
                  ? "bg-accent-muted text-accent border border-accent-light"
                  : "bg-surface-DEFAULT text-text-muted border border-black/[0.05] hover:border-black/[0.08]"
              )}
            >
              {p === "fy" ? "Full Year" : p === "q4" ? "Q4 (Jan-Mar)" : "YTD"}
            </button>
          ))}
          {period === "fy" && (
            <button
              onClick={() => setShowProjection((v) => !v)}
              className={cn(
                "px-3 py-1.5 rounded-button text-xs font-medium transition-all",
                showProjection
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "bg-surface-DEFAULT text-text-muted border border-black/[0.05] hover:border-black/[0.08]"
              )}
            >
              {showProjection ? "Hide" : "Show"} Projection
            </button>
          )}
        </div>
      </div>

      {/* Revenue vs Expenses Chart */}
      <GlassCard padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Revenue vs Expenses</h3>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-[#fd7e14] inline-block" />
              Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-[#ef4444] inline-block" />
              Expenses
            </span>
            {showProjection && (
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-3 h-0.5 rounded bg-blue-400 inline-block" style={{ borderTop: "2px dashed #3b82f6" }} />
                Projected
              </span>
            )}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fd7e14" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fd7e14" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" {...GRID_STYLE} />
              <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(v: number) => [`Rs.${(v as number).toLocaleString("en-IN")}`, ""]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#fd7e14"
                strokeWidth={2}
                fill="url(#revGrad)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#expGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by service */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue by Service</h3>
          <div className="flex items-center gap-6">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={REVENUE_BY_SERVICE} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {REVENUE_BY_SERVICE.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [`Rs.${(v/100000).toFixed(1)}L`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 flex-1">
              {REVENUE_BY_SERVICE.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-sans text-text-primary">Rs.{(item.value/100000).toFixed(1)}L</span>
                  </div>
                  <div className="h-1 bg-black/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(item.value / totalRevenue * 100).toFixed(0)}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Revenue by client */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue by Client</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CLIENT_REVENUE} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="client" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [`Rs.${v.toLocaleString("en-IN")}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#fd7e14" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* P&L Summary */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">
          P&L Summary
          {period === "q4" && " - Q4 (Jan-Mar 2026)"}
          {period === "ytd" && " - YTD (Apr 2025 - Feb 2026)"}
          {period === "fy" && " - FY 2025-26"}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                <th className="text-left py-2 text-xs font-medium uppercase tracking-wider text-text-muted">Item</th>
                <th className="text-right py-2 text-xs font-medium uppercase tracking-wider text-text-muted">Amount (INR)</th>
                <th className="text-right py-2 text-xs font-medium uppercase tracking-wider text-text-muted hidden sm:table-cell">% of Revenue</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Total Revenue", value: totalRevenue, highlight: true, color: "text-text-primary", indent: false },
                { label: "SEO Services", value: Math.round(totalRevenue * 0.489), highlight: false, color: "text-text-secondary", indent: true },
                { label: "Web Development", value: Math.round(totalRevenue * 0.328), highlight: false, color: "text-text-secondary", indent: true },
                { label: "Branding", value: Math.round(totalRevenue * 0.117), highlight: false, color: "text-text-secondary", indent: true },
                { label: "Total Expenses", value: -totalExpenses, highlight: true, color: "text-red-400", indent: false },
                { label: "Software & Tools", value: -Math.round(totalExpenses * 0.054), highlight: false, color: "text-text-secondary", indent: true },
                { label: "Hosting & Infrastructure", value: -Math.round(totalExpenses * 0.124), highlight: false, color: "text-text-secondary", indent: true },
                { label: "Freelancer Payments", value: -Math.round(totalExpenses * 0.299), highlight: false, color: "text-text-secondary", indent: true },
                { label: "Other Expenses", value: -Math.round(totalExpenses * 0.523), highlight: false, color: "text-text-secondary", indent: true },
                { label: "Net Profit", value: netProfit, highlight: true, color: "text-green-400", indent: false },
              ].map((row, idx) => (
                <tr key={idx} className={cn("border-b border-black/[0.05] last:border-0", row.highlight ? "font-semibold" : "")}>
                  <td className={cn("py-2.5 text-sm", row.indent ? "pl-6 text-text-secondary" : "pl-2 text-text-primary")}>
                    {row.label}
                  </td>
                  <td className={cn("py-2.5 text-sm font-sans text-right", row.color)}>
                    {row.value < 0 ? "-" : ""}Rs.{Math.abs(row.value).toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 text-sm font-sans text-right text-text-muted hidden sm:table-cell">
                    {totalRevenue > 0 ? Math.abs(Math.round(row.value / totalRevenue * 100)) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
