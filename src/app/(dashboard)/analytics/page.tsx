"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, IndianRupee } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { cn } from "@/lib/utils/cn";

const MONTHLY_REVENUE = [
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

const TOTAL_REVENUE = MONTHLY_REVENUE.reduce((s, m) => s + m.revenue, 0);
const TOTAL_EXPENSES = MONTHLY_REVENUE.reduce((s, m) => s + m.expenses, 0);
const NET_PROFIT = TOTAL_REVENUE - TOTAL_EXPENSES;

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "10px",
  color: "#111827",
  fontSize: "12px",
};

const GRID_STYLE = { stroke: "rgba(0,0,0,0.06)" };
const AXIS_STYLE = { fill: "#9ca3af", fontSize: 11 };

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"fy" | "q4" | "ytd">("fy");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <PageHeader title="Analytics" description="Financial performance - FY 2025-26" />
        <div className="flex gap-2">
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
              {p === "fy" ? "Full Year" : p === "q4" ? "Q4" : "YTD"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`Rs.${(TOTAL_REVENUE / 100000).toFixed(1)}L`} icon={IndianRupee} trend="up" change="+23% vs FY 24-25" />
        <StatCard title="Total Expenses" value={`Rs.${(TOTAL_EXPENSES / 1000).toFixed(0)}K`} icon={TrendingDown} trend="neutral" change="Operating costs" />
        <StatCard title="Net Profit" value={`Rs.${(NET_PROFIT / 100000).toFixed(1)}L`} icon={TrendingUp} trend="up" change={`${Math.round(NET_PROFIT / TOTAL_REVENUE * 100)}% margin`} />
        <StatCard title="MRR" value="Rs.3.85L" icon={BarChart3} trend="up" change="+12% MoM" />
      </div>

      {/* Revenue vs Expenses Chart */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue vs Expenses - Monthly</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
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
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [`Rs.${v.toLocaleString("en-IN")}`, ""]} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#fd7e14" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)" />
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
                    <div className="h-full rounded-full" style={{ width: `${(item.value / TOTAL_REVENUE * 100).toFixed(0)}%`, backgroundColor: item.color }} />
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
        <h3 className="text-sm font-semibold text-text-primary mb-4">P&L Summary - FY 2025-26</h3>
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
                { label: "Total Revenue", value: TOTAL_REVENUE, highlight: true, color: "text-text-primary" },
                { label: "  SEO Services", value: 1890000, highlight: false, color: "text-text-secondary" },
                { label: "  Web Development", value: 1265830, highlight: false, color: "text-text-secondary" },
                { label: "  Branding", value: 450000, highlight: false, color: "text-text-secondary" },
                { label: "Total Expenses", value: -TOTAL_EXPENSES, highlight: true, color: "text-red-400" },
                { label: "  Software & Tools", value: -32388, highlight: false, color: "text-text-secondary" },
                { label: "  Hosting & Infrastructure", value: -74400, highlight: false, color: "text-text-secondary" },
                { label: "  Freelancer Payments", value: -180000, highlight: false, color: "text-text-secondary" },
                { label: "  Other Expenses", value: -313212, highlight: false, color: "text-text-secondary" },
                { label: "Net Profit", value: NET_PROFIT, highlight: true, color: "text-green-400" },
              ].map((row, idx) => (
                <tr key={idx} className={cn("border-b border-black/[0.05] last:border-0", row.highlight ? "font-semibold" : "")}>
                  <td className={cn("py-2.5 text-sm pl-2", row.highlight ? "text-text-primary" : "text-text-secondary")}>{row.label}</td>
                  <td className={cn("py-2.5 text-sm font-sans text-right", row.color)}>
                    {row.value < 0 ? "-" : ""}Rs.{Math.abs(row.value).toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 text-sm font-sans text-right text-text-muted hidden sm:table-cell">
                    {Math.abs(Math.round(row.value / TOTAL_REVENUE * 100))}%
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
