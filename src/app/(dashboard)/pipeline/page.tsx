"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText, Clock, AlertCircle, CheckCircle2, Calendar,
  TrendingUp, ArrowRight, Plus,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkLabel, DarkCard } from "@/components/shared/dark-section";
import { cn } from "@/lib/utils/cn";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ─── Mock data ────────────────────────────────────────────────────────────────

const TO_INVOICE: {
  id: string;
  client: string;
  client_id: string;
  project: string;
  type: "retainer" | "milestone";
  billing_month: string;
  scheduled_date: string;
  amount: number;
  currency: string;
  display_amount: string;
  status: "pending" | "generated" | "skipped";
  payment_terms_days: number;
  expected_payment_date: string;
}[] = [
  // Apr 2026
  { id: "si-1", client: "Nandhini Hotel",   client_id: "11111111-0000-0000-0000-000000000001", project: "SEO & GMB Retainer",       type: "retainer",  billing_month: "2026-04", scheduled_date: "2026-04-01", amount: 76700, currency: "INR", display_amount: "Rs.76,700",  status: "pending",   payment_terms_days: 7,  expected_payment_date: "2026-04-08" },
  { id: "si-2", client: "Maximus OIGA",     client_id: "22222222-0000-0000-0000-000000000002", project: "SEO Retainer",              type: "retainer",  billing_month: "2026-04", scheduled_date: "2026-04-01", amount: 59000, currency: "INR", display_amount: "Rs.59,000",  status: "pending",   payment_terms_days: 15, expected_payment_date: "2026-04-16" },
  { id: "si-3", client: "Sea Wonders",      client_id: "55555555-0000-0000-0000-000000000005", project: "SEO & Digital Marketing",   type: "retainer",  billing_month: "2026-04", scheduled_date: "2026-04-01", amount: 89600, currency: "INR", display_amount: "AED 4,000",  status: "pending",   payment_terms_days: 10, expected_payment_date: "2026-04-11" },
  { id: "si-4", client: "Godavari Heritage",client_id: "33333333-0000-0000-0000-000000000003", project: "Brand Identity - Delivery", type: "milestone", billing_month: "2026-04", scheduled_date: "2026-04-15", amount: 85000, currency: "INR", display_amount: "Rs.85,000",  status: "pending",   payment_terms_days: 10, expected_payment_date: "2026-04-25" },
  // May 2026
  { id: "si-5", client: "Nandhini Hotel",   client_id: "11111111-0000-0000-0000-000000000001", project: "SEO & GMB Retainer",       type: "retainer",  billing_month: "2026-05", scheduled_date: "2026-05-01", amount: 76700, currency: "INR", display_amount: "Rs.76,700",  status: "pending",   payment_terms_days: 7,  expected_payment_date: "2026-05-08" },
  { id: "si-6", client: "Maximus OIGA",     client_id: "22222222-0000-0000-0000-000000000002", project: "SEO Retainer",              type: "retainer",  billing_month: "2026-05", scheduled_date: "2026-05-01", amount: 59000, currency: "INR", display_amount: "Rs.59,000",  status: "pending",   payment_terms_days: 15, expected_payment_date: "2026-05-16" },
  { id: "si-7", client: "Sea Wonders",      client_id: "55555555-0000-0000-0000-000000000005", project: "SEO & Digital Marketing",   type: "retainer",  billing_month: "2026-05", scheduled_date: "2026-05-01", amount: 89600, currency: "INR", display_amount: "AED 4,000",  status: "pending",   payment_terms_days: 10, expected_payment_date: "2026-05-11" },
  // Jun 2026
  { id: "si-8", client: "Nandhini Hotel",   client_id: "11111111-0000-0000-0000-000000000001", project: "SEO & GMB Retainer",       type: "retainer",  billing_month: "2026-06", scheduled_date: "2026-06-01", amount: 76700, currency: "INR", display_amount: "Rs.76,700",  status: "pending",   payment_terms_days: 7,  expected_payment_date: "2026-06-08" },
  { id: "si-9", client: "Maximus OIGA",     client_id: "22222222-0000-0000-0000-000000000002", project: "SEO Retainer",              type: "retainer",  billing_month: "2026-06", scheduled_date: "2026-06-01", amount: 59000, currency: "INR", display_amount: "Rs.59,000",  status: "pending",   payment_terms_days: 15, expected_payment_date: "2026-06-16" },
  { id: "si-10", client: "Sea Wonders",     client_id: "55555555-0000-0000-0000-000000000005", project: "SEO & Digital Marketing",  type: "retainer",  billing_month: "2026-06", scheduled_date: "2026-06-01", amount: 89600, currency: "INR", display_amount: "AED 4,000",  status: "pending",   payment_terms_days: 10, expected_payment_date: "2026-06-11" },
];

const EXPECTED_COLLECTIONS: {
  id: string;
  invoice: string;
  client: string;
  client_id: string;
  amount: number;
  display_amount: string;
  due_date: string;
  expected_date: string;
  urgency: "overdue" | "due_soon" | "upcoming";
  days_label: string;
  href: string;
}[] = [
  { id: "ec-1", invoice: "NG00201", client: "Raj Enterprises",    client_id: "66666666-0000-0000-0000-000000000006", amount: 17500,  display_amount: "Rs.17,500",   due_date: "2026-02-22", expected_date: "2026-03-24", urgency: "overdue",  days_label: "8 days overdue",  href: "/invoices/bbbbbbbb-0000-0000-0000-000000000007" },
  { id: "ec-2", invoice: "G00111",  client: "Nandhini Hotel",     client_id: "11111111-0000-0000-0000-000000000001", amount: 76700,  display_amount: "Rs.76,700",   due_date: "2026-03-08", expected_date: "2026-03-10", urgency: "due_soon", days_label: "Due Mar 8",       href: "/invoices/bbbbbbbb-0000-0000-0000-000000000002" },
  { id: "ec-3", invoice: "Proforma",client: "Godavari Heritage",  client_id: "33333333-0000-0000-0000-000000000003", amount: 100300, display_amount: "Rs.1,00,300", due_date: "2026-01-22", expected_date: "2026-03-20", urgency: "due_soon", days_label: "Awaiting approval",href: "/invoices/bbbbbbbb-0000-0000-0000-000000000008" },
  { id: "ec-4", invoice: "Apr inv", client: "Nandhini Hotel",     client_id: "11111111-0000-0000-0000-000000000001", amount: 76700,  display_amount: "Rs.76,700",   due_date: "2026-04-08", expected_date: "2026-04-08", urgency: "upcoming", days_label: "Expected Apr 8",  href: "/pipeline" },
  { id: "ec-5", invoice: "Apr inv", client: "Sea Wonders",        client_id: "55555555-0000-0000-0000-000000000005", amount: 89600,  display_amount: "Rs.89,600",   due_date: "2026-04-11", expected_date: "2026-04-11", urgency: "upcoming", days_label: "Expected Apr 11", href: "/pipeline" },
  { id: "ec-6", invoice: "Apr inv", client: "Maximus OIGA",       client_id: "22222222-0000-0000-0000-000000000002", amount: 53500,  display_amount: "Rs.53,500",   due_date: "2026-04-16", expected_date: "2026-04-16", urgency: "upcoming", days_label: "Expected Apr 16", href: "/pipeline" },
];

const FORECAST: { month: string; retainer: number; one_time: number; current?: boolean }[] = [
  { month: "Mar",  retainer: 76700,  one_time: 100300, current: true },
  { month: "Apr",  retainer: 225300, one_time: 85000  },
  { month: "May",  retainer: 225300, one_time: 0      },
  { month: "Jun",  retainer: 225300, one_time: 0      },
  { month: "Jul",  retainer: 225300, one_time: 0      },
  { month: "Aug",  retainer: 225300, one_time: 0      },
];

const BILLING_MONTHS = ["2026-04", "2026-05", "2026-06"];
const MONTH_LABELS: Record<string, string> = {
  "2026-04": "April 2026",
  "2026-05": "May 2026",
  "2026-06": "June 2026",
};

const URGENCY_CONFIG = {
  overdue:  { color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.15)",   icon: AlertCircle,   label: "Overdue"   },
  due_soon: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.15)",  icon: Clock,         label: "Due Soon"  },
  upcoming: { color: "#3b82f6", bg: "rgba(59,130,246,0.06)",  border: "rgba(59,130,246,0.10)",  icon: Calendar,      label: "Upcoming"  },
};

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "rgba(255,255,255,0.95)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "#111827",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [activeMonth, setActiveMonth] = useState("2026-04");
  const [statuses, setStatuses] = useState<Record<string, "pending" | "generated" | "skipped">>(
    Object.fromEntries(TO_INVOICE.map((i) => [i.id, i.status]))
  );

  const monthItems = TO_INVOICE.filter((i) => i.billing_month === activeMonth);
  const monthTotal = monthItems.reduce((s, i) => s + i.amount, 0);

  const aprTotal      = TO_INVOICE.filter((i) => i.billing_month === "2026-04").reduce((s, i) => s + i.amount, 0);
  const aprExpected   = EXPECTED_COLLECTIONS.filter((e) => e.expected_date.startsWith("2026-04")).reduce((s, e) => s + e.amount, 0);
  const totalPipeline = TO_INVOICE.filter((i) => ["2026-04","2026-05"].includes(i.billing_month)).reduce((s, i) => s + i.amount, 0);
  const overdueAmount = EXPECTED_COLLECTIONS.filter((e) => e.urgency === "overdue").reduce((s, e) => s + e.amount, 0);

  function markGenerated(id: string) {
    setStatuses((prev) => ({ ...prev, [id]: "generated" }));
  }

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── KPI summary ─────────────────────────────────────────────────────── */}
      <DarkSection>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>Pipeline Overview</p>
          <div className="flex items-center gap-2">
            <Link href="/analytics/invoices"
              className="px-2.5 py-1 rounded-button text-xs font-medium transition-all border bg-white/[0.04] text-white/50 border-white/[0.08] hover:border-white/[0.14] hover:text-white/70">
              Analytics
            </Link>
            <Link href="/invoices/new"
              className="flex items-center gap-1.5 px-3 py-1 rounded-button text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "rgba(253,126,20,0.85)" }}>
              <Plus className="w-3 h-3" />
              New Invoice
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: FileText,    label: "Apr - To Invoice",     value: `Rs.${(aprTotal/1000).toFixed(0)}K`,         sub: `${TO_INVOICE.filter(i => i.billing_month === "2026-04").length} invoices to raise`, color: "#fd7e14" },
            { icon: TrendingUp,  label: "Apr - Expected In",    value: `Rs.${(aprExpected/1000).toFixed(0)}K`,      sub: "Based on payment terms",                                                            color: "#22c55e" },
            { icon: Calendar,    label: "Apr + May Pipeline",   value: `Rs.${(totalPipeline/100000).toFixed(2)}L`,  sub: "Retainer + milestone invoices",                                                     color: "#3b82f6" },
            { icon: AlertCircle, label: "Overdue to Collect",   value: `Rs.${(overdueAmount/1000).toFixed(0)}K`,    sub: "Needs immediate follow-up",                                                         color: "#ef4444" },
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

      {/* ── Main two-column layout ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── Left col (3/5): Invoices to Raise ─────────────────────────────── */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Invoices to Raise</h2>
            <Link
              href="/invoices/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
            >
              <Plus className="w-3 h-3" />
              New Invoice
            </Link>
          </div>

          {/* Month tabs */}
          <div className="flex gap-2">
            {BILLING_MONTHS.map((m) => {
              const count = TO_INVOICE.filter((i) => i.billing_month === m && statuses[i.id] === "pending").length;
              const total = TO_INVOICE.filter((i) => i.billing_month === m).reduce((s, i) => s + i.amount, 0);
              return (
                <button
                  key={m}
                  onClick={() => setActiveMonth(m)}
                  className={cn(
                    "flex-1 px-3 py-2.5 rounded-xl text-left transition-all duration-150 border",
                    activeMonth === m
                      ? "border-accent bg-accent-muted"
                      : "border-black/[0.05] bg-surface-DEFAULT hover:border-black/[0.08]"
                  )}
                >
                  <p className={cn("text-xs font-semibold", activeMonth === m ? "text-accent" : "text-text-primary")}>
                    {MONTH_LABELS[m]}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5 font-sans">
                    Rs.{(total / 1000).toFixed(0)}K
                    {count > 0 && <span className="ml-1 text-accent">· {count} pending</span>}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Invoice rows */}
          <GlassCard padding="none">
            {monthItems.map((item, idx) => {
              const status = statuses[item.id];
              const isGenerated = status === "generated";
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 transition-colors",
                    idx < monthItems.length - 1 && "border-b border-black/[0.05]",
                    isGenerated && "opacity-60"
                  )}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-accent shrink-0"
                    style={{ background: "rgba(253,126,20,0.10)", border: "1px solid rgba(253,126,20,0.15)" }}
                  >
                    {item.client.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/clients/${item.client_id}`}
                        className="text-sm font-semibold text-text-primary hover:text-accent transition-colors"
                      >
                        {item.client}
                      </Link>
                      <span
                        className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                          item.type === "retainer"
                            ? "text-blue-500 bg-blue-500/10"
                            : "text-purple-500 bg-purple-500/10"
                        )}
                      >
                        {item.type === "retainer" ? "Retainer" : "Milestone"}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 truncate">{item.project}</p>
                    <p className="text-[10px] text-text-muted mt-0.5 font-sans">
                      Bill {item.scheduled_date.slice(8)} {MONTH_LABELS[item.billing_month].split(" ")[0]}
                      <span className="mx-1">·</span>
                      Expected by {item.expected_payment_date.slice(5).replace("-", " ").replace(/(\d+)/, (d) => {
                        const n = parseInt(d);
                        const s = ["th","st","nd","rd"];
                        const v = n % 100;
                        return n + (s[(v-20)%10] || s[v] || s[0]);
                      })}
                    </p>
                  </div>

                  <div className="text-right shrink-0 mr-2">
                    <p className="text-sm font-bold font-sans text-text-primary">{item.display_amount}</p>
                    <p className="text-[10px] text-text-muted">{item.currency}</p>
                  </div>

                  {isGenerated ? (
                    <span className="flex items-center gap-1 text-xs text-green-500 font-medium shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Done
                    </span>
                  ) : (
                    <Link
                      href={`/invoices/new?client=${item.client_id}`}
                      onClick={() => markGenerated(item.id)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: "#fd7e14" }}
                    >
                      <FileText className="w-3 h-3" />
                      Create
                    </Link>
                  )}
                </div>
              );
            })}

            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ background: "rgba(0,0,0,0.02)", borderTop: "1px solid rgba(0,0,0,0.05)" }}
            >
              <span className="text-xs text-text-muted font-medium">{MONTH_LABELS[activeMonth]} total</span>
              <span className="text-sm font-bold font-sans text-text-primary">
                Rs.{(monthTotal / 1000).toFixed(0)}K
              </span>
            </div>
          </GlassCard>
        </div>

        {/* ── Right col (2/5): Expected Collections ─────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Expected Collections</h2>

          <GlassCard padding="none">
            {(["overdue", "due_soon", "upcoming"] as const).map((urgency) => {
              const items = EXPECTED_COLLECTIONS.filter((e) => e.urgency === urgency);
              if (items.length === 0) return null;
              const cfg = URGENCY_CONFIG[urgency];
              const Icon = cfg.icon;
              return (
                <div key={urgency}>
                  <div
                    className="flex items-center gap-2 px-5 py-2.5"
                    style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: cfg.color }} />
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span className="ml-auto text-[11px] font-sans font-semibold" style={{ color: cfg.color }}>
                      Rs.{(items.reduce((s, e) => s + e.amount, 0) / 1000).toFixed(0)}K
                    </span>
                  </div>
                  {items.map((e, idx) => (
                    <Link
                      key={e.id}
                      href={e.href}
                      className={cn(
                        "flex items-center gap-3 px-5 py-3.5 hover:bg-surface-DEFAULT transition-colors",
                        idx < items.length - 1 && "border-b border-black/[0.04]"
                      )}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ background: `${cfg.color}12`, color: cfg.color }}
                      >
                        {e.client.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-text-primary truncate">{e.client}</p>
                        <p className="text-[10px] text-text-muted font-sans">{e.invoice} · {e.days_label}</p>
                      </div>
                      <p className="text-sm font-bold font-sans shrink-0" style={{ color: cfg.color }}>
                        {e.display_amount}
                      </p>
                    </Link>
                  ))}
                </div>
              );
            })}

            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ background: "rgba(0,0,0,0.02)", borderTop: "1px solid rgba(0,0,0,0.05)" }}
            >
              <span className="text-xs text-text-muted">Total expected</span>
              <span className="text-sm font-bold font-sans text-text-primary">
                Rs.{(EXPECTED_COLLECTIONS.reduce((s, e) => s + e.amount, 0) / 100000).toFixed(2)}L
              </span>
            </div>
          </GlassCard>

          <Link
            href="/payments"
            className="flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all hover:opacity-80"
            style={{ background: "rgba(253,126,20,0.08)", border: "1px solid rgba(253,126,20,0.15)" }}
          >
            <span className="text-accent font-medium text-xs">View full payment history</span>
            <ArrowRight className="w-3.5 h-3.5 text-accent" />
          </Link>
        </div>
      </div>

      {/* ── 6-month income forecast ─────────────────────────────────────────── */}
      <GlassCard padding="md">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-text-primary">6-Month Income Forecast</h2>
            <p className="text-xs text-text-muted mt-0.5">Retainer income is certain · One-time is projected on delivery</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm inline-block" style={{ background: "#fd7e14" }} />
              Retainer (certain)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm inline-block" style={{ background: "#3b82f6" }} />
              One-time (projected)
            </span>
          </div>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={FORECAST} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(v: number, name: string) => [
                  `Rs.${v.toLocaleString("en-IN")}`,
                  name === "retainer" ? "Retainer" : "One-Time",
                ]}
              />
              <Bar dataKey="retainer" stackId="a" fill="#fd7e14" radius={[0, 0, 0, 0]}>
                {FORECAST.map((entry, index) => (
                  <Cell key={index} fill={entry.current ? "#f59e0b" : "#fd7e14"} fillOpacity={entry.current ? 0.7 : 1} />
                ))}
              </Bar>
              <Bar dataKey="one_time" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-6 gap-2 mt-4 pt-4 border-t border-black/[0.05]">
          {FORECAST.map((f) => (
            <div key={f.month} className="text-center">
              <p className="text-[10px] text-text-muted">{f.month}</p>
              <p className="text-xs font-bold font-sans text-text-primary mt-0.5">
                Rs.{((f.retainer + f.one_time) / 1000).toFixed(0)}K
              </p>
              {f.current && (
                <span className="text-[9px] text-yellow-500 font-medium">current</span>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
