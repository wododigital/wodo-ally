"use client";

import { useState } from "react";
import { TrendingDown, Server, Users, Laptop } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkLabel, DarkCard } from "@/components/shared/dark-section";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { cn } from "@/lib/utils/cn";

// ─── Data ──────────────────────────────────────────────────────────────────

const MONTHLY_EXPENSES = [
  { month: "Apr", software: 2699, hosting: 10700, freelancer: 20000, office: 5600, other: 3000 },
  { month: "May", software: 2699, hosting: 10700, freelancer: 25000, office: 5600, other: 4000 },
  { month: "Jun", software: 2699, hosting: 10700, freelancer: 28000, office: 5600, other: 4000 },
  { month: "Jul", software: 2699, hosting: 6400,  freelancer: 20000, office: 5600, other: 9300 },
  { month: "Aug", software: 2699, hosting: 10700, freelancer: 35000, office: 5600, other: 8001 },
  { month: "Sep", software: 2699, hosting: 10700, freelancer: 28000, office: 5600, other: 8001 },
  { month: "Oct", software: 2699, hosting: 10700, freelancer: 20000, office: 5600, other: 10001},
  { month: "Nov", software: 2699, hosting: 10700, freelancer: 28000, office: 5600, other: 11001},
  { month: "Dec", software: 2699, hosting: 10700, freelancer: 35000, office: 5600, other: 13001},
  { month: "Jan", software: 1499, hosting: 10700, freelancer: 20000, office: 4300, other: 17501},
  { month: "Feb", software: 2699, hosting: 6200,  freelancer: 15000, office: 4300, other: 1397 },
];

const CATEGORY_COLORS = {
  software:   "#3b82f6",
  hosting:    "#8b5cf6",
  freelancer: "#ec4899",
  office:     "#16a34a",
  other:      "#9ca3af",
};

const TOP_ITEMS = [
  { name: "Freelancer Payments",      amount: 254000, pct: 45 },
  { name: "Hosting & Infrastructure", amount: 113900, pct: 20 },
  { name: "Software & Tools",         amount: 31889,  pct: 6  },
  { name: "Office & Admin",           amount: 57700,  pct: 10 },
  { name: "Other",                    amount: 99807,  pct: 18 },
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

export default function ExpenseAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("ytd");

  const chartData = period === "q4"
    ? MONTHLY_EXPENSES.slice(9)
    : period === "ytd"
    ? MONTHLY_EXPENSES.slice(0, 11)
    : MONTHLY_EXPENSES;

  const totalExpenses = chartData.reduce((s, m) =>
    s + m.software + m.hosting + m.freelancer + m.office + m.other, 0);

  const pieData = Object.entries(CATEGORY_COLORS).map(([key, color]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: chartData.reduce((s, m) => s + (m as unknown as Record<string, number>)[key], 0),
    color,
  }));

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
            { label: "Total Expenses",   value: `Rs.${(totalExpenses/1000).toFixed(0)}K`,  color: "#ef4444" },
            { label: "Biggest Category", value: "Freelancers",  color: "#ec4899" },
            { label: "MoM Change",       value: "-24.3%",       color: "#22c55e" },
            { label: "Avg Monthly",      value: `Rs.${Math.round(totalExpenses/chartData.length/1000)}K`, color: "#9ca3af" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5 px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{s.label}</span>
              <span className="text-lg font-bold font-sans" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Stacked bar by category */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly Expenses by Category</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`Rs.${v.toLocaleString("en-IN")}`, ""]} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="freelancer" name="Freelancers"  fill={CATEGORY_COLORS.freelancer} stackId="a" />
              <Bar dataKey="hosting"   name="Hosting"       fill={CATEGORY_COLORS.hosting}    stackId="a" />
              <Bar dataKey="software"  name="Software"      fill={CATEGORY_COLORS.software}   stackId="a" />
              <Bar dataKey="office"    name="Office"        fill={CATEGORY_COLORS.office}     stackId="a" />
              <Bar dataKey="other"     name="Other"         fill={CATEGORY_COLORS.other}      stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category donut */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Category Breakdown</h3>
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
                    <span className="font-sans text-text-primary">Rs.{(item.value/1000).toFixed(0)}K</span>
                  </div>
                  <div className="h-1 bg-black/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.round(item.value/totalExpenses*100)}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Top items */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Cost Centers</h3>
          <div className="space-y-3">
            {TOP_ITEMS.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-black/[0.05] last:border-0">
                <div>
                  <p className="text-sm font-medium text-text-primary">{item.name}</p>
                  <p className="text-xs text-text-muted">{item.pct}% of expenses</p>
                </div>
                <span className="text-sm font-sans font-semibold text-text-primary">
                  Rs.{item.amount.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Dark section - Cost Analysis */}
      <DarkSection>
        <DarkLabel>Cost Analysis</DarkLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Users,        label: "Freelancer spend",   value: "Rs.2.54L", sub: "45% of total expenses",    color: "#ec4899" },
            { icon: Server,       label: "Infrastructure",     value: "Rs.1.14L", sub: "20% - hosting + cloud",     color: "#8b5cf6" },
            { icon: Laptop,       label: "Software tools",     value: "Rs.31.9K", sub: "6% - SaaS subscriptions",   color: "#3b82f6" },
            { icon: TrendingDown, label: "Burn rate (avg)",    value: "Rs.51.3K", sub: "Per month, FY 2025-26",     color: "#ef4444" },
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
