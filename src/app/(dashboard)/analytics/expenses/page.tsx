"use client";

import { useState, useMemo } from "react";
import { TrendingDown, BarChart2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkCard } from "@/components/shared/dark-section";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { DateFilter, DateFilterState, resolveDateRange } from "@/components/shared/date-filter";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useExpensesByCategory } from "@/lib/hooks/use-analytics";

const CHART_TOOLTIP = {
  backgroundColor: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "#111827",
};

const CATEGORY_PALETTE = [
  "#ec4899", "#8b5cf6", "#3b82f6", "#16a34a", "#9ca3af",
  "#f59e0b", "#06b6d4", "#ef4444", "#84cc16", "#6366f1",
];

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ExpenseAnalyticsPage() {
  const [filterState, setFilterState] = useState<DateFilterState>({ mode: "fy", fyYear: 2025 });

  const { data: expenseRows, isLoading } = useExpensesByCategory(12);

  const allCategories = Array.from(new Set((expenseRows ?? []).map((r) => r.category)));
  const categoryColorMap = Object.fromEntries(
    allCategories.map((cat, i) => [cat, CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]])
  );

  const categoryKeys = allCategories.map((cat) => ({
    key: cat.toLowerCase().replace(/[^a-z0-9]/g, "_"),
    label: cat,
    color: categoryColorMap[cat] ?? "#9ca3af",
  }));

  // Build per-month aggregated rows
  type MonthRow = Record<string, string | number>;
  const allMonthData: MonthRow[] = useMemo(() => {
    const monthMap: Record<string, MonthRow> = {};
    for (const row of expenseRows ?? []) {
      if (!monthMap[row.month_start]) {
        monthMap[row.month_start] = { month_label: row.month_label, month_start: row.month_start };
      }
      const key = row.category.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const prev = monthMap[row.month_start][key];
      monthMap[row.month_start][key] = (typeof prev === "number" ? prev : 0) + row.total_amount;
    }
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [expenseRows]);

  // Filter by selected period
  const chartData = useMemo(() => {
    const range = resolveDateRange(filterState);
    if (!range) return allMonthData;
    return allMonthData.filter((row) => {
      const dt = new Date(String(row.month_start));
      return dt >= range.start && dt <= range.end;
    });
  }, [allMonthData, filterState]);

  const totalExpenses = chartData.reduce((sum, row) => {
    return sum + categoryKeys.reduce((s, ck) => s + Number(row[ck.key] ?? 0), 0);
  }, 0);

  const pieData = categoryKeys
    .map((ck) => ({
      name: ck.label,
      value: chartData.reduce((s, row) => s + Number(row[ck.key] ?? 0), 0),
      color: ck.color,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const burnRate   = chartData.length > 0 ? Math.round(totalExpenses / chartData.length) : 0;
  const topCategory = pieData[0];

  return (
    <div className="space-y-6">

      {/* Cost Analysis with filter inside */}
      <DarkSection>
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
            Cost Analysis
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
                  icon: TrendingDown,
                  label: "Total expenses",
                  value: `Rs.${(totalExpenses / 1000).toFixed(0)}K`,
                  sub: "All categories combined",
                  color: "#ef4444",
                },
                {
                  icon: BarChart2,
                  label: "Top category",
                  value: topCategory ? topCategory.name : "-",
                  sub: topCategory
                    ? `Rs.${(topCategory.value / 1000).toFixed(0)}K (${totalExpenses > 0 ? Math.round((topCategory.value / totalExpenses) * 100) : 0}%)`
                    : "No data",
                  color: topCategory?.color ?? "#9ca3af",
                },
                {
                  icon: TrendingDown,
                  label: "Burn rate (avg)",
                  value: `Rs.${(burnRate / 1000).toFixed(1)}K`,
                  sub: "Per month",
                  color: "#f59e0b",
                },
                {
                  icon: BarChart2,
                  label: "Categories",
                  value: String(pieData.length),
                  sub: "Active expense categories",
                  color: "#3b82f6",
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

      {/* Stacked bar by category */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly Expenses by Category</h3>
        {isLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : chartData.length === 0 ? (
          <EmptyState icon={BarChart2} title="No expense data" description="Upload bank statements or select a different period." />
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month_label" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${v.toLocaleString("en-IN")}`, ""]} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                {categoryKeys.map((ck, i) => (
                  <Bar
                    key={ck.key}
                    dataKey={ck.key}
                    name={ck.label}
                    fill={ck.color}
                    stackId="a"
                    radius={i === categoryKeys.length - 1 ? [4, 4, 0, 0] : undefined}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category donut */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Category Breakdown</h3>
          {isLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-44 w-44 rounded-full shrink-0" />
              <div className="flex-1 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            </div>
          ) : pieData.length === 0 ? (
            <EmptyState icon={BarChart2} title="No category data" description="Categorise your transactions to see the breakdown." />
          ) : (
            <div className="flex items-center gap-4">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={70} dataKey="value" paddingAngle={3}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${v.toLocaleString("en-IN")}`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5 flex-1">
                {pieData.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-sans text-text-primary">Rs.{(item.value / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="h-1 bg-black/[0.04] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${totalExpenses > 0 ? Math.round((item.value / totalExpenses) * 100) : 0}%`,
                        background: item.color,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        {/* Cost Centers */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Cost Centers</h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : pieData.length === 0 ? (
            <EmptyState icon={BarChart2} title="No data" description="No expense categories found." />
          ) : (
            <div className="space-y-3">
              {pieData.slice(0, 6).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-black/[0.05] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.name}</p>
                    <p className="text-xs text-text-muted">
                      {totalExpenses > 0 ? Math.round((item.value / totalExpenses) * 100) : 0}% of expenses
                    </p>
                  </div>
                  <span className="text-sm font-sans font-semibold text-text-primary">
                    Rs.{item.value.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
