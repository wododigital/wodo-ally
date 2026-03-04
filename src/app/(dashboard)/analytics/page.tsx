"use client";

import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, IndianRupee, BarChart2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkCard } from "@/components/shared/dark-section";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { DateFilter, DateFilterState, resolveDateRange } from "@/components/shared/date-filter";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [filterState, setFilterState] = useState<DateFilterState>({ mode: "fy", fyYear: 2025 });

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

  // Filter by selected period
  const chartData = useMemo(() => {
    const range = resolveDateRange(filterState);
    if (!range) return allChartData;
    return allChartData.filter((d) => {
      const dt = new Date(d.month_start);
      return dt >= range.start && dt <= range.end;
    });
  }, [allChartData, filterState]);

  const revenue   = chartData.reduce((s, m) => s + m.revenue, 0);
  const expenses  = chartData.reduce((s, m) => s + m.expenses, 0);
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

  // Revenue by client - top 6
  const topClients = (clientRows ?? [])
    .filter((c) => c.total_collected > 0)
    .slice(0, 6)
    .map((c) => ({
      client: c.client_name.length > 12 ? c.client_name.slice(0, 11) + "." : c.client_name,
      revenue: c.total_collected,
    }));

  // ─── Forecast calculations ────────────────────────────────────────────────
  // Use last 3 months of actual data to compute growth rate + MRR
  const forecastData = useMemo(() => {
    const history = allChartData.filter((d) => d.revenue > 0);
    if (history.length < 2) return [];

    // Avg monthly revenue from last 3 months
    const recent = history.slice(-3);
    const avgRev = recent.reduce((s, r) => s + r.revenue, 0) / recent.length;

    // Month-over-month growth rate
    const growthRates: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      if (recent[i - 1].revenue > 0) {
        growthRates.push(recent[i].revenue / recent[i - 1].revenue - 1);
      }
    }
    const avgGrowth = growthRates.length > 0
      ? growthRates.reduce((s, r) => s + r, 0) / growthRates.length
      : 0.03; // default 3% growth if no data

    // Cap growth at +15% per month to avoid wild projections
    const clampedGrowth = Math.min(Math.max(avgGrowth, -0.05), 0.15);

    // MRR as the certain floor (retainer)
    const mrr = kpis?.mrr ?? avgRev * 0.6;

    // Project 12 months forward
    const today = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() + i + 1, 1);
      const projected = avgRev * Math.pow(1 + clampedGrowth, i + 1);
      const retainer = Math.min(mrr, projected);
      const variable = Math.max(0, projected - retainer);
      return {
        month: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        retainer: Math.round(retainer),
        variable: Math.round(variable),
        total: Math.round(projected),
      };
    });
  }, [allChartData, kpis]);

  const forecast3m  = forecastData.slice(0, 3).reduce((s, m) => s + m.total, 0);
  const forecast6m  = forecastData.slice(0, 6).reduce((s, m) => s + m.total, 0);
  const forecast12m = forecastData.reduce((s, m) => s + m.total, 0);

  return (
    <div className="space-y-6">

      {/* Dark Financial Snapshot with filter inside */}
      <DarkSection>
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
            Financial Snapshot
          </p>
          <DateFilter value={filterState} onChange={setFilterState} />
        </div>
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
                  sub: filterState.mode === "fy" ? "FY 2025-26" : "Selected period",
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
                  sub: "After all expenses",
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

      {/* ── Forecast Section ─────────────────────────────────────────────────── */}
      {!plLoading && forecastData.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-text-primary">Revenue Forecast</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Based on trailing growth rate and MRR - retainer revenue is certain, variable is projected
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Next 3 Months", value: forecast3m,  sub: "Short-term outlook",  color: "#3b82f6" },
              { label: "Next 6 Months", value: forecast6m,  sub: "Mid-term forecast",   color: "#8b5cf6" },
              { label: "Next 12 Months", value: forecast12m, sub: "Annual projection",   color: "#fd7e14" },
            ].map((item) => (
              <GlassCard key={item.label} padding="md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-text-secondary">{item.label}</p>
                    <p className="text-2xl font-light font-sans mt-1 text-text-primary">
                      Rs.{(item.value / 100000).toFixed(2)}L
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{item.sub}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: `${item.color}15` }}>
                    <TrendingUp className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Forecast bar chart */}
          <GlassCard padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">Monthly Projections</h3>
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded-sm inline-block bg-[#fd7e14]" /> Retainer (certain)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded-sm inline-block bg-[#3b82f6]" /> Variable (projected)
                </span>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP}
                    formatter={(v: number, name: string) => [
                      `Rs.${v.toLocaleString("en-IN")}`,
                      name === "retainer" ? "Retainer" : "Variable",
                    ]}
                  />
                  <Bar dataKey="retainer" name="retainer" stackId="a" fill="#fd7e14" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="variable" name="variable" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
