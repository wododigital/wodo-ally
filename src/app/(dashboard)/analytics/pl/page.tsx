"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, IndianRupee, Percent } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkLabel, DarkCard } from "@/components/shared/dark-section";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils/cn";

// ─── Data ──────────────────────────────────────────────────────────────────

const PL_MONTHLY = [
  { month: "Apr 2025", revenue: 218000, expenses: 42000, gross_profit: 176000, net_profit: 134000 },
  { month: "May 2025", revenue: 248000, expenses: 48000, gross_profit: 200000, net_profit: 152000 },
  { month: "Jun 2025", revenue: 282000, expenses: 51000, gross_profit: 231000, net_profit: 177000 },
  { month: "Jul 2025", revenue: 265000, expenses: 44000, gross_profit: 221000, net_profit: 165000 },
  { month: "Aug 2025", revenue: 354000, expenses: 62000, gross_profit: 292000, net_profit: 218000 },
  { month: "Sep 2025", revenue: 321000, expenses: 55000, gross_profit: 266000, net_profit: 193000 },
  { month: "Oct 2025", revenue: 298000, expenses: 49000, gross_profit: 249000, net_profit: 184000 },
  { month: "Nov 2025", revenue: 342000, expenses: 58000, gross_profit: 284000, net_profit: 202000 },
  { month: "Dec 2025", revenue: 387000, expenses: 67000, gross_profit: 320000, net_profit: 241000 },
  { month: "Jan 2026", revenue: 345000, expenses: 54000, gross_profit: 291000, net_profit: 214000 },
  { month: "Feb 2026", revenue: 335830, expenses: 29596, gross_profit: 306234, net_profit: 229634 },
];

const CHART_DATA = PL_MONTHLY.map(m => ({
  ...m,
  month_short: m.month.slice(0, 3),
  margin: Math.round((m.net_profit / m.revenue) * 100),
}));

const CHART_TOOLTIP = {
  backgroundColor: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "#111827",
};

type Period = "ytd" | "q4" | "fy";

// ─── Page ──────────────────────────────────────────────────────────────────

export default function PLPage() {
  const [period, setPeriod] = useState<Period>("ytd");

  const tableData = period === "q4"
    ? PL_MONTHLY.slice(9)
    : period === "ytd"
    ? PL_MONTHLY.slice(0, 11)
    : PL_MONTHLY;

  const chartSlice = period === "q4"
    ? CHART_DATA.slice(9)
    : period === "ytd"
    ? CHART_DATA.slice(0, 11)
    : CHART_DATA;

  const totRevenue  = tableData.reduce((s, m) => s + m.revenue, 0);
  const totExpenses = tableData.reduce((s, m) => s + m.expenses, 0);
  const totProfit   = tableData.reduce((s, m) => s + m.net_profit, 0);
  const avgMargin   = Math.round((totProfit / totRevenue) * 100);

  const PERIODS: { key: Period; label: string }[] = [
    { key: "q4",  label: "Q4 (Jan-Mar)" },
    { key: "ytd", label: "YTD" },
    { key: "fy",  label: "Full Year" },
  ];

  return (
    <div className="space-y-6">

      {/* Period filter */}
      <div className="flex items-center gap-2">
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={cn(
              "px-3 py-1.5 rounded-button text-xs font-medium transition-all border",
              period === p.key
                ? "bg-accent-muted text-accent border-accent-light"
                : "bg-surface-DEFAULT text-text-muted border-black/[0.05] hover:border-black/[0.08]"
            )}>{p.label}
          </button>
        ))}
      </div>

      {/* Summary bar */}
      <GlassCard padding="md">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.05]">
          {[
            { label: "Total Revenue",   value: `Rs.${(totRevenue/100000).toFixed(2)}L`,  color: "#fd7e14" },
            { label: "Total Expenses",  value: `Rs.${(totExpenses/1000).toFixed(0)}K`,   color: "#ef4444" },
            { label: "Net Profit",      value: `Rs.${(totProfit/100000).toFixed(2)}L`,   color: "#22c55e" },
            { label: "Net Margin",      value: `${avgMargin}%`,                           color: avgMargin >= 60 ? "#22c55e" : "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5 px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{s.label}</span>
              <span className="text-lg font-bold font-sans" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Net profit chart */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly Net Profit</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartSlice} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="month_short" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${v.toLocaleString("en-IN")}`, ""]} />
              <ReferenceLine y={0} stroke="rgba(0,0,0,0.1)" />
              <Bar dataKey="revenue"    name="Revenue"    fill="#fd7e14" opacity={0.25} stackId={undefined} />
              <Bar dataKey="net_profit" name="Net Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* P&L Statement table */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Profit & Loss Statement</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="text-left font-semibold text-text-muted pb-2 pr-4">Month</th>
                <th className="text-right font-semibold text-text-muted pb-2 pr-4">Revenue</th>
                <th className="text-right font-semibold text-text-muted pb-2 pr-4">Expenses</th>
                <th className="text-right font-semibold text-text-muted pb-2 pr-4">Gross Profit</th>
                <th className="text-right font-semibold text-text-muted pb-2 pr-4">Net Profit</th>
                <th className="text-right font-semibold text-text-muted pb-2">Margin</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => {
                const margin = Math.round((row.net_profit / row.revenue) * 100);
                return (
                  <tr key={row.month} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.01]">
                    <td className="py-2.5 pr-4 font-medium text-text-primary">{row.month}</td>
                    <td className="py-2.5 pr-4 text-right font-sans text-text-secondary">Rs.{(row.revenue/1000).toFixed(0)}K</td>
                    <td className="py-2.5 pr-4 text-right font-sans text-red-400/80">Rs.{(row.expenses/1000).toFixed(0)}K</td>
                    <td className="py-2.5 pr-4 text-right font-sans text-text-primary">Rs.{(row.gross_profit/1000).toFixed(0)}K</td>
                    <td className="py-2.5 pr-4 text-right font-sans font-semibold text-green-500">Rs.{(row.net_profit/1000).toFixed(0)}K</td>
                    <td className="py-2.5 text-right">
                      <span className={cn(
                        "font-sans font-semibold text-[11px]",
                        margin >= 60 ? "text-green-500" : margin >= 40 ? "text-yellow-500" : "text-red-400"
                      )}>{margin}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black/[0.08]">
                <td className="py-3 pr-4 font-bold text-text-primary text-xs">Total / Avg</td>
                <td className="py-3 pr-4 text-right font-bold font-sans text-text-primary text-xs">Rs.{(totRevenue/100000).toFixed(2)}L</td>
                <td className="py-3 pr-4 text-right font-bold font-sans text-red-400 text-xs">Rs.{(totExpenses/1000).toFixed(0)}K</td>
                <td className="py-3 pr-4 text-right font-bold font-sans text-text-primary text-xs">Rs.{((totRevenue-totExpenses)/100000).toFixed(2)}L</td>
                <td className="py-3 pr-4 text-right font-bold font-sans text-green-500 text-xs">Rs.{(totProfit/100000).toFixed(2)}L</td>
                <td className="py-3 text-right font-bold font-sans text-green-500 text-xs">{avgMargin}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </GlassCard>

      {/* Dark section */}
      <DarkSection>
        <DarkLabel>Profit Summary</DarkLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: IndianRupee, label: "Total revenue",    value: `Rs.${(totRevenue/100000).toFixed(2)}L`, sub: "FY 2025-26",              color: "#fd7e14" },
            { icon: TrendingDown,label: "Total expenses",   value: `Rs.${(totExpenses/1000).toFixed(0)}K`,  sub: `${Math.round(totExpenses/totRevenue*100)}% of revenue`,  color: "#ef4444" },
            { icon: TrendingUp,  label: "Net profit",       value: `Rs.${(totProfit/100000).toFixed(2)}L`,  sub: "After all deductions",    color: "#22c55e" },
            { icon: Percent,     label: "Avg net margin",   value: `${avgMargin}%`,                          sub: avgMargin >= 60 ? "Healthy margin" : "Watch expenses", color: avgMargin >= 60 ? "#22c55e" : "#f59e0b" },
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
    </div>
  );
}
