"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown, IndianRupee } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkLabel, DarkCard } from "@/components/shared/dark-section";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils/cn";

// ─── Data ────────────────────────────────────────────────────────────────────

const MONTHLY_DATA = [
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
  { month: "Mar", revenue: 76700,  expenses: 0     },
];

const PROJECTED = [
  { month: "Apr*", revenue: 360000, expenses: 52000, projected: true },
  { month: "May*", revenue: 375000, expenses: 54000, projected: true },
  { month: "Jun*", revenue: 390000, expenses: 56000, projected: true },
];

const REVENUE_BY_SERVICE = [
  { name: "SEO",         value: 1890000, color: "#fd7e14" },
  { name: "Web Dev",     value: 1265830, color: "#3b82f6" },
  { name: "Branding",    value: 450000,  color: "#8b5cf6" },
  { name: "Google Ads",  value: 240000,  color: "#16a34a" },
];

const CLIENT_REVENUE = [
  { client: "Nandhini Hotel",  revenue: 921900 },
  { client: "Dentique",        revenue: 115830 },
  { client: "Sea Wonders",     revenue: 357600 },
  { client: "Maximus OIGA",    revenue: 590000 },
  { client: "Godavari",        revenue: 100300 },
  { client: "Raj Ent.",        revenue: 17500  },
];

const CHART_TOOLTIP = {
  backgroundColor: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "10px",
  color: "#111827",
  fontSize: "12px",
};

const GRID = { stroke: "rgba(0,0,0,0.06)" };
const AXIS  = { fill: "#9ca3af", fontSize: 11 };

// ─── Period helpers ───────────────────────────────────────────────────────────

type Period = "month" | "q4" | "q3" | "ytd" | "fy" | "custom";
type MonthIdx = 0|1|2|3|4|5|6|7|8|9|10|11;

const MONTH_LABELS = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];

function getChartData(period: Period, monthIdx: MonthIdx, showProjection: boolean) {
  let base: typeof MONTHLY_DATA;
  if (period === "month")  base = [MONTHLY_DATA[monthIdx]];
  else if (period === "q3") base = MONTHLY_DATA.slice(6, 9);   // Oct Nov Dec
  else if (period === "q4") base = MONTHLY_DATA.slice(9, 12);  // Jan Feb Mar
  else if (period === "ytd") base = MONTHLY_DATA.slice(0, 11);
  else base = MONTHLY_DATA;
  if (showProjection && period === "fy") return [...base, ...PROJECTED];
  return base;
}

function sum(data: { revenue: number; expenses: number }[]) {
  return data.filter(m => !(m as { projected?: boolean }).projected).reduce(
    (a, m) => ({ revenue: a.revenue + m.revenue, expenses: a.expenses + m.expenses }),
    { revenue: 0, expenses: 0 }
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod]         = useState<Period>("fy");
  const [monthIdx, setMonthIdx]     = useState<MonthIdx>(10); // Feb
  const [showProjection, setShowProjection] = useState(false);
  const [customFrom, setCustomFrom] = useState("2025-04-01");
  const [customTo, setCustomTo]     = useState("2026-03-31");

  const chartData = getChartData(period, monthIdx, showProjection);
  const { revenue, expenses } = sum(chartData);
  const netProfit = revenue - expenses;
  const margin    = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

  const PERIODS: { key: Period; label: string }[] = [
    { key: "month", label: "Month" },
    { key: "q3",    label: "Q3 (Oct-Dec)" },
    { key: "q4",    label: "Q4 (Jan-Mar)" },
    { key: "ytd",   label: "YTD" },
    { key: "fy",    label: "Full Year" },
    { key: "custom",label: "Custom" },
  ];

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
            onClick={() => setShowProjection(v => !v)}
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
        {period === "month" && (
          <select
            value={monthIdx}
            onChange={e => setMonthIdx(Number(e.target.value) as MonthIdx)}
            className="glass-input w-auto text-xs py-1.5 pl-3 pr-8"
          >
            {MONTH_LABELS.map((m, i) => (
              <option key={m} value={i}>{m} {i >= 9 ? "2026" : "2025"}</option>
            ))}
          </select>
        )}
        {period === "custom" && (
          <div className="flex items-center gap-2">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="glass-input text-xs py-1.5 w-auto" />
            <span className="text-text-muted text-xs">to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="glass-input text-xs py-1.5 w-auto" />
          </div>
        )}
      </div>

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
              <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${(v as number).toLocaleString("en-IN")}`, ""]} />
              <Area type="monotone" dataKey="revenue"  name="Revenue"  stroke="#fd7e14" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)" />
            </AreaChart>
          </ResponsiveContainer>
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
          <div className="flex items-center gap-4">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={REVENUE_BY_SERVICE} cx="50%" cy="50%" innerRadius={46} outerRadius={72} dataKey="value" paddingAngle={3}>
                    {REVENUE_BY_SERVICE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${(v/100000).toFixed(1)}L`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5 flex-1">
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
                    <div className="h-full rounded-full" style={{ width: `${Math.round(item.value/revenue*100)}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Revenue by Client</h3>
            <Link href="/analytics/clients" className="text-xs text-accent flex items-center gap-1 hover:opacity-80">
              Detail <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CLIENT_REVENUE} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="client" tick={AXIS} axisLine={false} tickLine={false} width={72} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${v.toLocaleString("en-IN")}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#fd7e14" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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

      {/* Dark snapshot section */}
      <DarkSection>
        <DarkLabel>Financial Snapshot</DarkLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Total Revenue",
              value: `Rs.${(revenue/100000).toFixed(2)}L`,
              sub: period === "fy" ? "FY 2025-26" : "Selected period",
              icon: IndianRupee,
              color: "#fd7e14",
            },
            {
              label: "Total Expenses",
              value: `Rs.${(expenses/1000).toFixed(0)}K`,
              sub: `${Math.round(expenses/revenue*100)}% of revenue`,
              icon: TrendingDown,
              color: "#ef4444",
            },
            {
              label: "Net Profit",
              value: `Rs.${(netProfit/100000).toFixed(2)}L`,
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
    </div>
  );
}
