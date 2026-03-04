"use client";

import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, IndianRupee, Percent, BarChart2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkCard } from "@/components/shared/dark-section";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { DateFilter, DateFilterState, resolveDateRange } from "@/components/shared/date-filter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils/cn";
import { useMonthlyPL } from "@/lib/hooks/use-analytics";

const CHART_TOOLTIP = {
  backgroundColor: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "#111827",
};

// ─── Page ──────────────────────────────────────────────────────────────────

export default function PLPage() {
  const [filterState, setFilterState] = useState<DateFilterState>({ mode: "fy", fyYear: 2025 });

  const { data: plRows, isLoading } = useMonthlyPL();

  const allTableData = (plRows ?? []).map((row) => ({
    month: row.month_label,
    month_short: row.month_label.slice(0, 3),
    month_start: row.month_start,
    revenue: row.total_revenue,
    expenses: row.total_expenses,
    gross_profit: row.total_revenue - row.total_expenses,
    net_profit: row.net_profit,
  }));

  const tableData = useMemo(() => {
    const range = resolveDateRange(filterState);
    if (!range) return allTableData;
    return allTableData.filter((row) => {
      const dt = new Date(row.month_start);
      return dt >= range.start && dt <= range.end;
    });
  }, [allTableData, filterState]);

  const chartSlice = tableData.map((row) => ({
    ...row,
    margin: row.revenue > 0 ? Math.round((row.net_profit / row.revenue) * 100) : 0,
  }));

  const totRevenue  = tableData.reduce((s, m) => s + m.revenue, 0);
  const totExpenses = tableData.reduce((s, m) => s + m.expenses, 0);
  const totProfit   = tableData.reduce((s, m) => s + m.net_profit, 0);
  const avgMargin   = totRevenue > 0 ? Math.round((totProfit / totRevenue) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* Profit Summary with filter */}
      <DarkSection>
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
            Profit Summary
          </p>
          <DateFilter value={filterState} onChange={setFilterState} />
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
                  icon: IndianRupee,
                  label: "Total revenue",
                  value: `Rs.${(totRevenue / 100000).toFixed(2)}L`,
                  sub: "Selected period",
                  color: "#fd7e14",
                },
                {
                  icon: TrendingDown,
                  label: "Total expenses",
                  value: `Rs.${(totExpenses / 1000).toFixed(0)}K`,
                  sub: totRevenue > 0 ? `${Math.round((totExpenses / totRevenue) * 100)}% of revenue` : "-",
                  color: "#ef4444",
                },
                {
                  icon: TrendingUp,
                  label: "Net profit",
                  value: `Rs.${(totProfit / 100000).toFixed(2)}L`,
                  sub: "After all deductions",
                  color: "#22c55e",
                },
                {
                  icon: Percent,
                  label: "Avg net margin",
                  value: `${avgMargin}%`,
                  sub: avgMargin >= 60 ? "Healthy margin" : "Watch expenses",
                  color: avgMargin >= 60 ? "#22c55e" : "#f59e0b",
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

      {/* Net profit chart */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly Net Profit</h3>
        {isLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : chartSlice.length === 0 ? (
          <EmptyState icon={BarChart2} title="No data" description="Record invoice payments and upload transactions to see P&L." />
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartSlice} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month_short" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${v.toLocaleString("en-IN")}`, ""]} />
                <ReferenceLine y={0} stroke="rgba(0,0,0,0.1)" />
                <Bar dataKey="revenue"    name="Revenue"    fill="#fd7e14" opacity={0.25} />
                <Bar dataKey="net_profit" name="Net Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      {/* P&L Statement table */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Profit & Loss Statement</h3>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : tableData.length === 0 ? (
          <EmptyState icon={BarChart2} title="No data" description="No financial data found for the selected period." />
        ) : (
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
                  const margin = row.revenue > 0 ? Math.round((row.net_profit / row.revenue) * 100) : 0;
                  return (
                    <tr key={row.month} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.01]">
                      <td className="py-2.5 pr-4 font-medium text-text-primary">{row.month}</td>
                      <td className="py-2.5 pr-4 text-right font-sans text-text-secondary">Rs.{(row.revenue / 1000).toFixed(0)}K</td>
                      <td className="py-2.5 pr-4 text-right font-sans text-red-400/80">Rs.{(row.expenses / 1000).toFixed(0)}K</td>
                      <td className="py-2.5 pr-4 text-right font-sans text-text-primary">Rs.{(row.gross_profit / 1000).toFixed(0)}K</td>
                      <td className="py-2.5 pr-4 text-right font-sans font-semibold text-green-500">Rs.{(row.net_profit / 1000).toFixed(0)}K</td>
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
                  <td className="py-3 pr-4 text-right font-bold font-sans text-text-primary text-xs">Rs.{(totRevenue / 100000).toFixed(2)}L</td>
                  <td className="py-3 pr-4 text-right font-bold font-sans text-red-400 text-xs">Rs.{(totExpenses / 1000).toFixed(0)}K</td>
                  <td className="py-3 pr-4 text-right font-bold font-sans text-text-primary text-xs">Rs.{((totRevenue - totExpenses) / 100000).toFixed(2)}L</td>
                  <td className="py-3 pr-4 text-right font-bold font-sans text-green-500 text-xs">Rs.{(totProfit / 100000).toFixed(2)}L</td>
                  <td className="py-3 text-right font-bold font-sans text-green-500 text-xs">{avgMargin}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
