"use client";

import { useState, useMemo } from "react";
import { Briefcase, TrendingUp, CheckCircle2, Clock, BarChart2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkCard } from "@/components/shared/dark-section";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { DateFilter, DateFilterState, resolveDateRange } from "@/components/shared/date-filter";
import {
  PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  useProjectRevenueByType,
  useMonthlyPL,
  useDashboardKPIs,
} from "@/lib/hooks/use-analytics";

const CHART_TOOLTIP = {
  backgroundColor: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "#111827",
};

// Palette for project types
const TYPE_COLORS = [
  "#fd7e14", "#3b82f6", "#8b5cf6", "#16a34a",
  "#ec4899", "#f59e0b", "#06b6d4", "#ef4444",
];

function formatProjectType(t: string): string {
  return t
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ProjectAnalyticsPage() {
  const [filterState, setFilterState] = useState<DateFilterState>({ mode: "fy", fyYear: 2025 });

  const { data: revenueByType, isLoading: typeLoading } = useProjectRevenueByType();
  const { data: plRows, isLoading: plLoading } = useMonthlyPL();
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();

  const isLoading = typeLoading || plLoading || kpisLoading;

  const mrrData = useMemo(() => {
    const range = resolveDateRange(filterState);
    const rows = (plRows ?? []).filter((row) => {
      if (!range) return true;
      const dt = new Date(row.month_start);
      return dt >= range.start && dt <= range.end;
    });
    return rows.map((row) => ({ month: row.month_label.slice(0, 3), mrr: row.total_revenue }));
  }, [plRows, filterState]);

  // Revenue by type for donut
  const typeDonutData = (revenueByType ?? [])
    .filter((r) => r.total_collected != null && Number(r.total_collected) > 0)
    .map((r, i) => ({
      name: formatProjectType(r.project_type),
      value: Number(r.total_collected ?? 0),
      count: Number(r.project_count),
      color: TYPE_COLORS[i % TYPE_COLORS.length],
    }));

  const totalRevenue = typeDonutData.reduce((s, r) => s + r.value, 0);
  const totalProjects = typeDonutData.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6">

      {/* Project Performance */}
      <DarkSection>
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>Project Performance</p>
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
                  icon: Briefcase,
                  label: "Service types",
                  value: String(typeDonutData.length),
                  sub: `${totalProjects} project${totalProjects !== 1 ? "s" : ""} generating revenue`,
                  color: "#fd7e14",
                },
                {
                  icon: TrendingUp,
                  label: "Total collected",
                  value: totalRevenue > 0 ? `Rs.${(totalRevenue / 100000).toFixed(2)}L` : "-",
                  sub: "Across all project types",
                  color: "#3b82f6",
                },
                {
                  icon: CheckCircle2,
                  label: "Active clients",
                  value: String(kpis?.active_clients ?? 0),
                  sub: "Status = active",
                  color: "#22c55e",
                },
                {
                  icon: Clock,
                  label: "MRR",
                  value: kpis ? `Rs.${(kpis.mrr / 1000).toFixed(0)}K` : "-",
                  sub: "Active retainer projects",
                  color: "#f59e0b",
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

      {/* Revenue trend chart */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly Revenue Trend</h3>
        {plLoading ? (
          <Skeleton className="h-44 w-full" />
        ) : mrrData.length === 0 ? (
          <EmptyState icon={BarChart2} title="No data" description="Record payments to see revenue trend." />
        ) : (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#fd7e14" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fd7e14" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${v.toLocaleString("en-IN")}`, "Revenue"]} />
                <Area type="monotone" dataKey="mrr" name="Revenue" stroke="#fd7e14" strokeWidth={2} fill="url(#mrrGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by type donut */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue by Project Type</h3>
          {typeLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-44 w-44 rounded-full shrink-0" />
              <div className="flex-1 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            </div>
          ) : typeDonutData.length === 0 ? (
            <EmptyState icon={BarChart2} title="No project revenue" description="Revenue will appear once invoice payments are recorded." />
          ) : (
            <div className="flex items-center gap-4">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={typeDonutData} cx="50%" cy="50%" innerRadius={44} outerRadius={70} dataKey="value" paddingAngle={3}>
                      {typeDonutData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${(v / 100000).toFixed(1)}L`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5 flex-1">
                {typeDonutData.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-sans text-text-primary">Rs.{(item.value / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="h-1 bg-black/[0.04] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${totalRevenue > 0 ? Math.round((item.value / totalRevenue) * 100) : 0}%`,
                        background: item.color,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        {/* Revenue breakdown table */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue Breakdown</h3>
          {typeLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : typeDonutData.length === 0 ? (
            <EmptyState icon={BarChart2} title="No data" description="No project revenue data found." />
          ) : (
            <div className="space-y-3">
              {typeDonutData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-black/[0.04] last:border-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{item.name}</p>
                    <p className="text-xs text-text-muted">{item.count} project{item.count !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-sans font-semibold text-text-primary">
                      Rs.{(item.value / 1000).toFixed(0)}K
                    </span>
                    <p className="text-xs text-text-muted">
                      {totalRevenue > 0 ? Math.round((item.value / totalRevenue) * 100) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
