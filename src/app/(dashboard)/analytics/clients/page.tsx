"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, Clock, Star } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkLabel, DarkCard } from "@/components/shared/dark-section";
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils/cn";

// ─── Data ──────────────────────────────────────────────────────────────────

const CLIENTS = [
  { name: "Nandhini Hotel", revenue: 921900, invoices: 12, avg_payment_days: 7.2,  on_time_pct: 100, health: 98, color: "#fd7e14", tier: "Premium",  services: ["SEO", "Web Dev"] },
  { name: "Maximus OIGA",   revenue: 590000, invoices: 6,  avg_payment_days: 18.5, on_time_pct: 72,  health: 74, color: "#3b82f6", tier: "Growth",   services: ["SEO", "Google Ads"] },
  { name: "Sea Wonders",    revenue: 357600, invoices: 4,  avg_payment_days: 11.3, on_time_pct: 90,  health: 85, color: "#8b5cf6", tier: "Growth",   services: ["Web Dev", "Branding"] },
  { name: "Dentique",       revenue: 115830, invoices: 3,  avg_payment_days: 9.0,  on_time_pct: 95,  health: 88, color: "#16a34a", tier: "Standard", services: ["Web Dev"] },
  { name: "Godavari",       revenue: 100300, invoices: 2,  avg_payment_days: 14.0, on_time_pct: 85,  health: 72, color: "#ec4899", tier: "Standard", services: ["SEO"] },
  { name: "Raj Ent.",       revenue: 17500,  invoices: 1,  avg_payment_days: 31.0, on_time_pct: 50,  health: 42, color: "#ef4444", tier: "At Risk",  services: ["Branding"] },
];

const MONTHLY_CLIENT_REVENUE = [
  { month: "Apr", nandhini: 76700, maximus: 59000, seawonders: 28700, dentique: 21700, other: 32000 },
  { month: "May", nandhini: 76700, maximus: 59000, seawonders: 28700, dentique: 21700, other: 62200 },
  { month: "Jun", nandhini: 76700, maximus: 59000, seawonders: 28700, dentique: 21700, other: 96200 },
  { month: "Jul", nandhini: 76700, maximus: 59000, seawonders: 28700, dentique: 21700, other: 79200 },
  { month: "Aug", nandhini: 76700, maximus: 59000, seawonders: 28700, dentique: 21700, other: 168200},
  { month: "Sep", nandhini: 76700, maximus: 59000, seawonders: 28700, dentique: 21700, other: 135200},
  { month: "Oct", nandhini: 76700, maximus: 59000, seawonders: 28700, dentique: 0,     other: 133600},
  { month: "Nov", nandhini: 76700, maximus: 59000, seawonders: 28700, dentique: 0,     other: 177900},
  { month: "Dec", nandhini: 76700, maximus: 59000, seawonders: 28700, dentique: 0,     other: 224900},
  { month: "Jan", nandhini: 76700, maximus: 59000, seawonders: 28700, dentique: 0,     other: 180600},
  { month: "Feb", nandhini: 76700, maximus: 59000, seawonders: 28700, dentique: 115830,other: 55630},
];

const RADAR_DATA = [
  { metric: "Revenue",   nandhini: 100, maximus: 64, seawonders: 39 },
  { metric: "Retention", nandhini: 98,  maximus: 72, seawonders: 85 },
  { metric: "Pay Speed", nandhini: 95,  maximus: 60, seawonders: 80 },
  { metric: "Growth",    nandhini: 70,  maximus: 85, seawonders: 65 },
  { metric: "Services",  nandhini: 80,  maximus: 75, seawonders: 70 },
];

const CHART_TOOLTIP = {
  backgroundColor: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "#111827",
};

const TIER_COLORS: Record<string, string> = {
  Premium:  "#fd7e14",
  Growth:   "#3b82f6",
  Standard: "#22c55e",
  "At Risk":"#ef4444",
};

type Period = "month" | "ytd" | "q4" | "fy";

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ClientAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("ytd");
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("period");
    if (p === "month" || p === "q4" || p === "ytd" || p === "fy") setPeriod(p as Period);
  }, []);

  const chartData = period === "month"
    ? MONTHLY_CLIENT_REVENUE.slice(-1)
    : period === "q4"
    ? MONTHLY_CLIENT_REVENUE.slice(9)
    : period === "ytd"
    ? MONTHLY_CLIENT_REVENUE.slice(0, 11)
    : MONTHLY_CLIENT_REVENUE;

  const totalRevenue = CLIENTS.reduce((s, c) => s + c.revenue, 0);

  const PERIODS: { key: Period; label: string }[] = [
    { key: "month", label: "This Month" },
    { key: "q4",    label: "Q4 (Jan-Mar)" },
    { key: "ytd",   label: "YTD" },
    { key: "fy",    label: "Full Year" },
  ];

  return (
    <div className="space-y-6">

      {/* Client Health Summary */}
      <DarkSection>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>Client Health Summary</p>
          <div className="flex items-center gap-2">
            {PERIODS.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={cn(
                  "px-2.5 py-1 rounded-button text-xs font-medium transition-all border",
                  period === p.key
                    ? "bg-white/[0.12] text-white border-white/[0.2]"
                    : "bg-white/[0.04] text-white/40 border-white/[0.08] hover:border-white/[0.14]"
                )}>{p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Users,      label: "Premium clients", value: "1",        sub: "Nandhini - 45% of revenue",  color: "#fd7e14" },
            { icon: TrendingUp, label: "Growth clients",  value: "2",        sub: "Maximus + Sea Wonders",       color: "#3b82f6" },
            { icon: Clock,      label: "Avg collection",  value: "14.2d",    sub: "Weighted across all clients", color: "#22c55e" },
            { icon: Star,       label: "Best client",     value: "Nandhini", sub: "Score 98 - Prompt payer",     color: "#ec4899" },
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

      {/* Stacked revenue by client */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly Revenue by Client</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${v.toLocaleString("en-IN")}`, ""]} />
              <Bar dataKey="nandhini"   name="Nandhini"    fill="#fd7e14" stackId="a" />
              <Bar dataKey="maximus"    name="Maximus"     fill="#3b82f6" stackId="a" />
              <Bar dataKey="seawonders" name="Sea Wonders" fill="#8b5cf6" stackId="a" />
              <Bar dataKey="dentique"   name="Dentique"    fill="#16a34a" stackId="a" />
              <Bar dataKey="other"      name="Others"      fill="#9ca3af" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client health scores */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Client Health Scores</h3>
          <div className="space-y-3">
            {CLIENTS.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{ background: c.color }}>
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-text-primary">{c.name}</span>
                    <span className="text-xs font-bold font-sans" style={{ color: c.color }}>{c.health}</span>
                  </div>
                  <div className="h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${c.health}%`, background: c.color }} />
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: `${TIER_COLORS[c.tier]}15`, color: TIER_COLORS[c.tier] }}>
                  {c.tier}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Top-3 radar comparison */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Top Client Comparison</h3>
          <p className="text-xs text-text-muted mb-3">Nandhini vs Maximus vs Sea Wonders</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="rgba(0,0,0,0.07)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <Radar name="Nandhini"    dataKey="nandhini"   stroke="#fd7e14" fill="#fd7e14" fillOpacity={0.15} />
                <Radar name="Maximus"     dataKey="maximus"    stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.10} />
                <Radar name="Sea Wonders" dataKey="seawonders" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.10} />
                <Tooltip contentStyle={CHART_TOOLTIP} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 justify-center mt-1">
            {[
              { name: "Nandhini", color: "#fd7e14" },
              { name: "Maximus", color: "#3b82f6" },
              { name: "Sea Wonders", color: "#8b5cf6" },
            ].map(l => (
              <span key={l.name} className="text-[10px] text-text-muted flex items-center gap-1">
                <span className="w-2.5 h-0.5 rounded inline-block" style={{ background: l.color }} />
                {l.name}
              </span>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Payment behaviour matrix */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Payment Behaviour Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black/[0.05]">
                {["Client", "Total Revenue", "Invoices", "Avg Pay Days", "On-Time %", "Services", "Status"].map(h => (
                  <th key={h} className="text-left font-medium text-text-muted pb-2 pr-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLIENTS.map((c) => (
                <tr key={c.name} className="border-b border-black/[0.04] last:border-0">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                      <span className="font-medium text-text-primary">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 font-sans text-text-primary">Rs.{(c.revenue/1000).toFixed(0)}K</td>
                  <td className="py-2.5 pr-4 text-text-secondary">{c.invoices}</td>
                  <td className="py-2.5 pr-4 font-sans" style={{ color: c.avg_payment_days <= 10 ? "#22c55e" : c.avg_payment_days <= 20 ? "#f59e0b" : "#ef4444" }}>
                    {c.avg_payment_days}d
                  </td>
                  <td className="py-2.5 pr-4 font-sans" style={{ color: c.on_time_pct >= 90 ? "#22c55e" : c.on_time_pct >= 70 ? "#f59e0b" : "#ef4444" }}>
                    {c.on_time_pct}%
                  </td>
                  <td className="py-2.5 pr-4 text-text-muted">{c.services.join(", ")}</td>
                  <td className="py-2.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${TIER_COLORS[c.tier]}15`, color: TIER_COLORS[c.tier] }}>
                      {c.tier}
                    </span>
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
