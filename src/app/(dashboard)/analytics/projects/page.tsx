"use client";

import { useState } from "react";
import { Briefcase, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkLabel, DarkCard } from "@/components/shared/dark-section";
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { cn } from "@/lib/utils/cn";

// ─── Data ──────────────────────────────────────────────────────────────────

const PROJECTS_BY_TYPE = [
  { name: "SEO Retainer",   value: 1890000, color: "#fd7e14", count: 3 },
  { name: "Web Dev",        value: 1265830, color: "#3b82f6", count: 5 },
  { name: "Branding",       value: 450000,  color: "#8b5cf6", count: 4 },
  { name: "Google Ads",     value: 240000,  color: "#16a34a", count: 2 },
];

const STATUS_DATA = [
  { name: "Active",     value: 8,  color: "#22c55e" },
  { name: "Completed",  value: 5,  color: "#3b82f6" },
  { name: "On Hold",    value: 1,  color: "#f59e0b" },
  { name: "Overdue",    value: 1,  color: "#ef4444" },
];

const MRR_TREND = [
  { month: "Apr", mrr: 218000 },
  { month: "May", mrr: 225300 },
  { month: "Jun", mrr: 225300 },
  { month: "Jul", mrr: 225300 },
  { month: "Aug", mrr: 225300 },
  { month: "Sep", mrr: 225300 },
  { month: "Oct", mrr: 225300 },
  { month: "Nov", mrr: 225300 },
  { month: "Dec", mrr: 225300 },
  { month: "Jan", mrr: 225300 },
  { month: "Feb", mrr: 225300 },
];

const ACTIVE_PROJECTS = [
  { name: "Nandhini Hotel - SEO",      client: "Nandhini Hotel",  type: "SEO Retainer", mrr: 76700, status: "active",    completion: 85 },
  { name: "Maximus - SEO + Ads",       client: "Maximus OIGA",    type: "SEO + Ads",    mrr: 59000, status: "active",    completion: 70 },
  { name: "Sea Wonders - Web Dev",     client: "Sea Wonders",     type: "Web Dev",      mrr: 28700, status: "active",    completion: 60 },
  { name: "Dentique - Website",        client: "Dentique",        type: "Web Dev",      mrr: 0,     status: "completed", completion: 100},
  { name: "Godavari - SEO",           client: "Godavari",        type: "SEO Retainer", mrr: 14300, status: "active",    completion: 55 },
  { name: "Raj Ent. - Branding",      client: "Raj Ent.",        type: "Branding",     mrr: 0,     status: "on_hold",   completion: 30 },
];

const CHART_TOOLTIP = {
  backgroundColor: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "#111827",
};

const STATUS_COLORS: Record<string, string> = {
  active:    "#22c55e",
  completed: "#3b82f6",
  on_hold:   "#f59e0b",
  overdue:   "#ef4444",
};

type Period = "ytd" | "q4" | "fy";

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ProjectAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("ytd");

  const mrrData = period === "q4"
    ? MRR_TREND.slice(9)
    : period === "ytd"
    ? MRR_TREND.slice(0, 11)
    : MRR_TREND;

  const totalRevenue = PROJECTS_BY_TYPE.reduce((s, p) => s + p.value, 0);

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
            { label: "Total Project Revenue", value: `Rs.${(totalRevenue/100000).toFixed(2)}L`, color: "#fd7e14" },
            { label: "Active Projects",        value: "8",     color: "#22c55e" },
            { label: "Retainer MRR",           value: "Rs.2.25L", color: "#3b82f6" },
            { label: "Completion Rate",        value: "73%",   color: "#8b5cf6" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5 px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{s.label}</span>
              <span className="text-lg font-bold font-sans" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* MRR trend */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Retainer MRR Trend</h3>
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
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${v.toLocaleString("en-IN")}`, "MRR"]} />
              <Area type="monotone" dataKey="mrr" name="MRR" stroke="#fd7e14" strokeWidth={2} fill="url(#mrrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by type donut */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue by Project Type</h3>
          <div className="flex items-center gap-4">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={PROJECTS_BY_TYPE} cx="50%" cy="50%" innerRadius={44} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {PROJECTS_BY_TYPE.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${(v/100000).toFixed(1)}L`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5 flex-1">
              {PROJECTS_BY_TYPE.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-sans text-text-primary">Rs.{(item.value/100000).toFixed(1)}L</span>
                  </div>
                  <div className="h-1 bg-black/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.round(item.value/totalRevenue*100)}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Status breakdown */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Project Status</h3>
          <div className="flex items-center gap-6">
            <div className="h-40 w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={STATUS_DATA} cx="50%" cy="50%" innerRadius={42} outerRadius={64} dataKey="value" paddingAngle={3}>
                    {STATUS_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`${v} projects`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 flex-1">
              {STATUS_DATA.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  <span className="text-sm font-bold font-sans px-2 py-0.5 rounded-full"
                    style={{ background: `${s.color}18`, color: s.color }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Active projects table */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">All Projects</h3>
        <div className="space-y-3">
          {ACTIVE_PROJECTS.map((p, idx) => (
            <div key={idx} className="flex items-center gap-4 py-2 border-b border-black/[0.04] last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{p.name}</p>
                <p className="text-xs text-text-muted">{p.client} - {p.type}</p>
              </div>
              <div className="w-24 hidden sm:block">
                <div className="h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p.completion}%`, background: STATUS_COLORS[p.status] }} />
                </div>
                <span className="text-[10px] text-text-muted mt-0.5 block">{p.completion}%</span>
              </div>
              {p.mrr > 0 && (
                <span className="text-xs font-sans font-semibold text-text-primary w-16 text-right">
                  Rs.{(p.mrr/1000).toFixed(0)}K/mo
                </span>
              )}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${STATUS_COLORS[p.status]}15`, color: STATUS_COLORS[p.status] }}>
                {p.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Dark section */}
      <DarkSection>
        <DarkLabel>Project Performance</DarkLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Briefcase,    label: "Total projects",   value: "15",       sub: "8 active, 5 completed",       color: "#fd7e14" },
            { icon: TrendingUp,   label: "Retainer revenue", value: "Rs.18.9L", sub: "SEO retainers - 49% share",   color: "#3b82f6" },
            { icon: CheckCircle2, label: "Completion rate",  value: "73%",      sub: "8 of 15 in active delivery",  color: "#22c55e" },
            { icon: Clock,        label: "On-hold projects", value: "1",        sub: "Raj Enterprises branding",    color: "#f59e0b" },
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
