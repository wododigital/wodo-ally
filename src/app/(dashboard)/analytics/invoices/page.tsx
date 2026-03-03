"use client";

import { useState } from "react";
import { FileText, Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkLabel, DarkCard } from "@/components/shared/dark-section";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { cn } from "@/lib/utils/cn";

// ─── Data ──────────────────────────────────────────────────────────────────

const MONTHLY_INVOICED = [
  { month: "Apr", retainer: 218000, one_time: 0     },
  { month: "May", retainer: 225300, one_time: 22700 },
  { month: "Jun", retainer: 225300, one_time: 56700 },
  { month: "Jul", retainer: 225300, one_time: 39700 },
  { month: "Aug", retainer: 225300, one_time: 128700},
  { month: "Sep", retainer: 225300, one_time: 95700 },
  { month: "Oct", retainer: 225300, one_time: 72700 },
  { month: "Nov", retainer: 225300, one_time: 116700},
  { month: "Dec", retainer: 225300, one_time: 161700},
  { month: "Jan", retainer: 225300, one_time: 119700},
  { month: "Feb", retainer: 225300, one_time: 110530},
  { month: "Mar", retainer: 76700,  one_time: 0     },
];

const STATUS_DIST = [
  { name: "Paid",          value: 18, color: "#22c55e" },
  { name: "Sent",          value: 4,  color: "#3b82f6"  },
  { name: "Overdue",       value: 2,  color: "#ef4444"  },
  { name: "Draft",         value: 3,  color: "#9ca3af"  },
];

const AVG_PAYMENT_TIME = [
  { client: "Nandhini",  days: 7.2  },
  { client: "Dentique",  days: 9.0  },
  { client: "Sea Wonders",days: 11.3},
  { client: "Godavari",  days: 14.0 },
  { client: "Maximus",   days: 18.5 },
  { client: "Raj Ent.",  days: 31.0 },
];

const CHART_TOOLTIP = {
  backgroundColor: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "#111827",
};

type Period = "ytd" | "q4" | "fy";

// ─── Page ──────────────────────────────────────────────────────────────────

export default function InvoiceAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("ytd");

  const chartData = period === "q4"
    ? MONTHLY_INVOICED.slice(9)
    : period === "ytd"
    ? MONTHLY_INVOICED.slice(0, 11)
    : MONTHLY_INVOICED;

  const totalInvoiced = chartData.reduce((s, m) => s + m.retainer + m.one_time, 0);
  const retainerTotal = chartData.reduce((s, m) => s + m.retainer, 0);
  const retainerPct   = Math.round((retainerTotal / totalInvoiced) * 100);

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
            { label: "Invoiced",     value: `Rs.${(totalInvoiced/100000).toFixed(2)}L`, color: "#fd7e14" },
            { label: "Retainer %",  value: `${retainerPct}%`,   color: "#22c55e" },
            { label: "Overdue",     value: "2 invoices",          color: "#ef4444" },
            { label: "Avg pay time",value: "14.2 days",           color: "#3b82f6" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5 px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{s.label}</span>
              <span className="text-lg font-bold font-sans" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Revenue mix chart */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly Invoice Volume - Retainer vs One-Time</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${v.toLocaleString("en-IN")}`, ""]} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="retainer"  name="Retainer"  fill="#fd7e14" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="one_time"  name="One-Time"  fill="#3b82f6" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status distribution */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Invoice Status Distribution</h3>
          <div className="flex items-center gap-6">
            <div className="h-40 w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={STATUS_DIST} cx="50%" cy="50%" innerRadius={42} outerRadius={64} dataKey="value" paddingAngle={3}>
                    {STATUS_DIST.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`${v} invoices`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 flex-1">
              {STATUS_DIST.map((s) => (
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

        {/* Average payment time */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Avg. Days to Payment by Client</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={AVG_PAYMENT_TIME} layout="vertical" margin={{ left: 0, right: 32, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 35]} tickFormatter={v => `${v}d`} />
                <YAxis type="category" dataKey="client" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`${v} days`, ""]} />
                <Bar dataKey="days" radius={[0, 4, 4, 0]}
                  fill="#fd7e14"
                  label={{ position: "right", fontSize: 11, fill: "#9ca3af", formatter: (v: number) => `${v}d` }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Dark section - Invoice Health */}
      <DarkSection>
        <DarkLabel>Invoice Health</DarkLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: CheckCircle2, label: "Collection rate",    value: "94%",      sub: "18 of 27 invoices paid",    color: "#22c55e" },
            { icon: Clock,        label: "Avg settlement",     value: "14.2d",     sub: "Across all clients",         color: "#3b82f6" },
            { icon: AlertCircle,  label: "Overdue amount",     value: "Rs.94,200", sub: "2 invoices need follow-up",  color: "#ef4444" },
            { icon: TrendingUp,   label: "Retainer MRR",       value: "Rs.3.10L",  sub: "3 retainer clients",         color: "#fd7e14" },
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
