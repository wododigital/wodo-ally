"use client";

import { useState } from "react";
import { Users, TrendingUp, Clock, Star, BarChart2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkCard } from "@/components/shared/dark-section";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { DateFilter, DateFilterState } from "@/components/shared/date-filter";
import {
  BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  useClientHealthScores,
  useRevenueByClient,
} from "@/lib/hooks/use-analytics";

const CHART_TOOLTIP = {
  backgroundColor: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "#111827",
};

// Color palette for dynamic clients
const CLIENT_COLORS = [
  "#fd7e14", "#3b82f6", "#8b5cf6", "#16a34a",
  "#ec4899", "#ef4444", "#06b6d4", "#f59e0b",
];

function healthColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

function healthLabel(score: number): string {
  if (score >= 80) return "Premium";
  if (score >= 60) return "Growth";
  if (score >= 40) return "Standard";
  return "At Risk";
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ClientAnalyticsPage() {
  const [filterState, setFilterState] = useState<DateFilterState>({ mode: "fy", fyYear: 2025 });

  const { data: healthScores, isLoading: healthLoading } = useClientHealthScores();
  const { data: clientRevenue, isLoading: revenueLoading } = useRevenueByClient();

  const isLoading = healthLoading || revenueLoading;

  // Summary stats
  const totalClients = (healthScores ?? []).length;
  const premiumCount = (healthScores ?? []).filter((c) => Number(c.health_score) >= 80).length;
  const growthCount  = (healthScores ?? []).filter((c) => Number(c.health_score) >= 60 && Number(c.health_score) < 80).length;

  const avgCollection = (() => {
    const rows = (clientRevenue ?? []).filter((r) => r.avg_days_to_payment != null);
    if (rows.length === 0) return null;
    const sum = rows.reduce((s, r) => s + (r.avg_days_to_payment ?? 0), 0);
    return (sum / rows.length).toFixed(1);
  })();

  const bestClient = (healthScores ?? []).reduce<{ name: string; score: number } | null>((best, c) => {
    if (!best || Number(c.health_score) > best.score) return { name: c.client_name, score: Number(c.health_score) };
    return best;
  }, null);

  // Top 6 clients by revenue for bar chart
  const topRevenueClients = (clientRevenue ?? [])
    .filter((c) => c.total_collected > 0)
    .slice(0, 6)
    .map((c, i) => ({
      client: c.client_name.length > 10 ? c.client_name.slice(0, 9) + "." : c.client_name,
      revenue: c.total_collected,
      color: CLIENT_COLORS[i % CLIENT_COLORS.length],
    }));

  // Top 3 for radar - use health score, avg payment, on_time_pct
  const top3 = (healthScores ?? []).slice(0, 3);
  const radarData = [
    { metric: "Revenue",   ...Object.fromEntries(top3.map((c, i) => [`client${i}`, Math.min(100, Math.round((Number(c.total_collected ?? 0) / Math.max(...top3.map((x) => Number(x.total_collected ?? 1)), 1)) * 100))])) },
    { metric: "On Time",   ...Object.fromEntries(top3.map((c, i) => [`client${i}`, Number(c.on_time_pct ?? 0)])) },
    { metric: "Health",    ...Object.fromEntries(top3.map((c, i) => [`client${i}`, Number(c.health_score ?? 0)])) },
    { metric: "Pay Speed", ...Object.fromEntries(top3.map((c, i) => [`client${i}`, Math.max(0, 100 - (Number(c.avg_payment_days ?? 30) / 30) * 100)])) },
    { metric: "Invoices",  ...Object.fromEntries(top3.map((c, i) => [`client${i}`, Math.min(100, Number(c.paid_count ?? 0) * 10)])) },
  ];

  return (
    <div className="space-y-6">

      {/* Client Health Summary */}
      <DarkSection>
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>Client Health Summary</p>
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
                  icon: Users,
                  label: "Premium clients",
                  value: String(premiumCount),
                  sub: `Health score >= 80`,
                  color: "#fd7e14",
                },
                {
                  icon: TrendingUp,
                  label: "Growth clients",
                  value: String(growthCount),
                  sub: `Score 60-79`,
                  color: "#3b82f6",
                },
                {
                  icon: Clock,
                  label: "Avg collection",
                  value: avgCollection != null ? `${avgCollection}d` : "N/A",
                  sub: "Weighted across clients",
                  color: "#22c55e",
                },
                {
                  icon: Star,
                  label: "Best client",
                  value: bestClient?.name ?? "-",
                  sub: bestClient ? `Score ${bestClient.score} - top performer` : "No data",
                  color: "#ec4899",
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

      {/* Revenue by client bar */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue Collected by Client</h3>
        {revenueLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : topRevenueClients.length === 0 ? (
          <EmptyState icon={BarChart2} title="No revenue data" description="Record invoice payments to see client revenue." />
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRevenueClients} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="client" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${v.toLocaleString("en-IN")}`, "Revenue"]} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {topRevenueClients.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client health scores */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Client Health Scores</h3>
          {healthLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (healthScores ?? []).length === 0 ? (
            <EmptyState icon={Users} title="No client data" description="Add clients and invoices to see health scores." />
          ) : (
            <div className="space-y-3">
              {(healthScores ?? []).slice(0, 8).map((c, i) => {
                const color = healthColor(Number(c.health_score));
                const tier = healthLabel(Number(c.health_score));
                return (
                  <div key={c.client_id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ background: CLIENT_COLORS[i % CLIENT_COLORS.length] }}>
                      {c.client_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-text-primary">{c.client_name}</span>
                        <span className="text-xs font-bold font-sans" style={{ color }}>{Math.round(Number(c.health_score))}</span>
                      </div>
                      <div className="h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Number(c.health_score))}%`, background: color }} />
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: `${color}15`, color }}>
                      {tier}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Top-3 radar comparison */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Top Client Comparison</h3>
          {healthLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : top3.length < 2 ? (
            <EmptyState icon={BarChart2} title="Need 2+ clients" description="Add more clients with invoice history to compare." />
          ) : (
            <>
              <p className="text-xs text-text-muted mb-3">
                {top3.map((c) => c.client_name).join(" vs ")}
              </p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(0,0,0,0.07)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                    {top3.map((c, i) => (
                      <Radar
                        key={c.client_id}
                        name={c.client_name}
                        dataKey={`client${i}`}
                        stroke={CLIENT_COLORS[i % CLIENT_COLORS.length]}
                        fill={CLIENT_COLORS[i % CLIENT_COLORS.length]}
                        fillOpacity={0.12}
                      />
                    ))}
                    <Tooltip contentStyle={CHART_TOOLTIP} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 justify-center mt-1">
                {top3.map((c, i) => (
                  <span key={c.client_id} className="text-[10px] text-text-muted flex items-center gap-1">
                    <span className="w-2.5 h-0.5 rounded inline-block" style={{ background: CLIENT_COLORS[i % CLIENT_COLORS.length] }} />
                    {c.client_name}
                  </span>
                ))}
              </div>
            </>
          )}
        </GlassCard>
      </div>

      {/* Payment behaviour matrix */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Payment Behaviour Matrix</h3>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (clientRevenue ?? []).length === 0 ? (
          <EmptyState icon={Users} title="No client data" description="Add clients with invoices to see payment behaviour." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-black/[0.05]">
                  {["Client", "Total Collected", "Invoices", "Avg Pay Days", "On-Time %"].map((h) => (
                    <th key={h} className="text-left font-medium text-text-muted pb-2 pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(clientRevenue ?? []).map((c, i) => {
                  const days = c.avg_days_to_payment;
                  const healthRow = (healthScores ?? []).find((h) => h.client_id === c.client_id);
                  const onTimePct = healthRow ? Number(healthRow.on_time_pct) : null;
                  return (
                    <tr key={c.client_id} className="border-b border-black/[0.04] last:border-0">
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: CLIENT_COLORS[i % CLIENT_COLORS.length] }} />
                          <span className="font-medium text-text-primary">{c.client_name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 font-sans text-text-primary">
                        Rs.{(c.total_collected / 1000).toFixed(0)}K
                      </td>
                      <td className="py-2.5 pr-4 text-text-secondary">{Number(c.invoice_count)}</td>
                      <td className="py-2.5 pr-4 font-sans"
                        style={{ color: days == null ? "#9ca3af" : days <= 10 ? "#22c55e" : days <= 20 ? "#f59e0b" : "#ef4444" }}>
                        {days != null ? `${days}d` : "-"}
                      </td>
                      <td className="py-2.5 font-sans"
                        style={{ color: onTimePct == null ? "#9ca3af" : onTimePct >= 90 ? "#22c55e" : onTimePct >= 70 ? "#f59e0b" : "#ef4444" }}>
                        {onTimePct != null ? `${Math.round(onTimePct)}%` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
