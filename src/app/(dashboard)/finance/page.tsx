"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Search, Upload, TrendingDown, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkLabel, DarkCard } from "@/components/shared/dark-section";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

// ─── Data ─────────────────────────────────────────────────────────────────

const PAYMENTS = [
  { id: "1", invoice_number: "G00110", client: "Nandhini Deluxe Hotel",  payment_date: "2026-02-10", amount_received: 76700,  currency: "INR" as const, tds_amount: 0,    skydo_margin: 0,    payment_method: "bank_transfer", reference: "NEFT2026021001234",  notes: "Full payment received" },
  { id: "2", invoice_number: "G00112", client: "Maximus OIGA",           payment_date: "2026-02-09", amount_received: 53500,  currency: "INR" as const, tds_amount: 5500, skydo_margin: 0,    payment_method: "bank_transfer", reference: "NEFT2026020901234",  notes: "TDS @10% deducted under 194J" },
  { id: "3", invoice_number: "G00109", client: "Sea Wonders Tourism",    payment_date: "2026-02-18", amount_received: 89600,  currency: "INR" as const, tds_amount: 0,    skydo_margin: 2400, payment_method: "skydo_aed",     reference: "SKYDO-FEB-001",      notes: "AED 4,000 via Skydo" },
  { id: "4", invoice_number: "G00108", client: "Dentique Dental Care",   payment_date: "2025-12-18", amount_received: 115830, currency: "INR" as const, tds_amount: 0,    skydo_margin: 1170, payment_method: "skydo_usd",     reference: "SKYDO-DEC-001",      notes: "$1,350 via Skydo" },
  { id: "5", invoice_number: "G00107", client: "Nandhini Deluxe Hotel",  payment_date: "2026-01-10", amount_received: 76700,  currency: "INR" as const, tds_amount: 0,    skydo_margin: 0,    payment_method: "bank_transfer", reference: "NEFT2026011001234",  notes: "Full payment" },
];

const EXPENSES = [
  { id: "1",  date: "2026-02-28", particulars: "Google Workspace Monthly",           amount: 1499,  category: "Software & Tools",        auto: true  },
  { id: "2",  date: "2026-02-25", particulars: "DigitalOcean Singapore - Droplets",  amount: 6200,  category: "Hosting & Infrastructure", auto: true  },
  { id: "3",  date: "2026-02-22", particulars: "Freelancer Payment - Ravi Kumar",    amount: 15000, category: "Freelancer Payments",       auto: false },
  { id: "4",  date: "2026-02-20", particulars: "Bank Charges - NEFT Fee",            amount: 17.7,  category: "Banking & Finance",         auto: true  },
  { id: "5",  date: "2026-02-15", particulars: "Notion Team Monthly",                amount: 1200,  category: "Software & Tools",          auto: true  },
  { id: "6",  date: "2026-02-12", particulars: "Zomato Business - Team Lunch",       amount: 1850,  category: "Office & Admin",            auto: true  },
  { id: "7",  date: "2026-01-28", particulars: "DigitalOcean Singapore - Droplets",  amount: 6200,  category: "Hosting & Infrastructure", auto: true  },
  { id: "8",  date: "2026-01-25", particulars: "Freelancer Payment - Design Work",   amount: 20000, category: "Freelancer Payments",       auto: false },
  { id: "9",  date: "2026-01-08", particulars: "AWS Mumbai - Server Fees",           amount: 4500,  category: "Hosting & Infrastructure", auto: true  },
];

const OVERDUE_INVOICES = [
  { client: "Raj Enterprises", invoice: "NG00201", amount: 17500, days_overdue: 8 },
  { client: "Nandhini Hotel",  invoice: "G00111",  amount: 76700, days_due: 5 },
];

const CASH_FLOW = [
  { month: "Oct", inflow: 298000, outflow: 49000 },
  { month: "Nov", inflow: 342000, outflow: 58000 },
  { month: "Dec", inflow: 387000, outflow: 67000 },
  { month: "Jan", inflow: 345000, outflow: 54000 },
  { month: "Feb", inflow: 335830, outflow: 29596 },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Software & Tools":        "#3b82f6",
  "Hosting & Infrastructure":"#8b5cf6",
  "Freelancer Payments":     "#ec4899",
  "Office & Admin":          "#16a34a",
  "Banking & Finance":       "#9ca3af",
  "Travel & Conveyance":     "#f59e0b",
};

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  skydo_usd: "Skydo (USD)",
  skydo_aed: "Skydo (AED)",
  upi: "UPI",
  other: "Other",
};

type Tab = "payments" | "expenses";

// ─── Page ──────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [tab, setTab]       = useState<Tab>("payments");
  const [search, setSearch] = useState("");

  const totalReceived    = PAYMENTS.reduce((s, p) => s + p.amount_received, 0);
  const totalTds         = PAYMENTS.reduce((s, p) => s + p.tds_amount, 0);
  const totalSkydo       = PAYMENTS.reduce((s, p) => s + p.skydo_margin, 0);
  const totalOutstanding = 94200;

  const totalExpenses    = EXPENSES.reduce((s, e) => s + e.amount, 0);
  const netCashFlow      = totalReceived - totalExpenses;

  const filteredPayments = PAYMENTS.filter((p) =>
    p.client.toLowerCase().includes(search.toLowerCase()) ||
    p.invoice_number.toLowerCase().includes(search.toLowerCase())
  );

  const filteredExpenses = EXPENSES.filter((e) =>
    e.particulars.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {[
          { key: "payments" as Tab, label: "Payments" },
          { key: "expenses" as Tab, label: "Expenses" },
        ].map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); }}
            className={cn(
              "px-3.5 py-1.5 rounded-button text-xs font-semibold transition-all border",
              tab === t.key
                ? "bg-accent-muted text-accent border-accent-light"
                : "bg-surface-DEFAULT text-text-muted border-black/[0.05] hover:border-black/[0.08]"
            )}>
            {t.label}
          </button>
        ))}
        {tab === "expenses" && (
          <Link href="/expenses/upload"
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium bg-surface-DEFAULT border border-black/[0.05] text-text-muted hover:border-black/[0.08] transition-all">
            <Upload className="w-3 h-3" />
            Upload Statement
          </Link>
        )}
        {tab === "payments" && (
          <Link href="/analytics/invoices"
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium bg-surface-DEFAULT border border-black/[0.05] text-text-muted hover:border-black/[0.08] transition-all">
            <LinkIcon className="w-3 h-3" />
            Invoice Analytics
          </Link>
        )}
      </div>

      {/* Summary bar - changes based on tab */}
      <GlassCard padding="md">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.05]">
          {(tab === "payments" ? [
            { label: "Total Received",  value: `Rs.${(totalReceived/100000).toFixed(1)}L`,              color: "#16a34a" },
            { label: "Outstanding",     value: `Rs.${(totalOutstanding/1000).toFixed(0)}K`,              color: "#f59e0b" },
            { label: "TDS Deducted",    value: `Rs.${totalTds.toLocaleString("en-IN")}`,                 color: "#6b7280" },
            { label: "Skydo Fees",      value: `Rs.${totalSkydo.toLocaleString("en-IN")}`,               color: "#6b7280" },
          ] : [
            { label: "Total Expenses",  value: `Rs.${(totalExpenses/1000).toFixed(1)}K`,                 color: "#ef4444" },
            { label: "Net Cash Flow",   value: `Rs.${(netCashFlow/100000).toFixed(2)}L`,                  color: "#22c55e" },
            { label: "Biggest Item",    value: "Freelancers",                                             color: "#ec4899" },
            { label: "Avg Monthly",     value: `Rs.${Math.round(totalExpenses/2/1000)}K`,                 color: "#9ca3af" },
          ]).map((item) => (
            <div key={item.label} className="flex flex-col gap-0.5 px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{item.label}</span>
              <span className="text-lg font-bold font-sans" style={{ color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "payments" ? "Search payments..." : "Search expenses..."}
          className="glass-input pl-9"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main list */}
        <div className="lg:col-span-2">
          {tab === "payments" ? (
            <GlassCard padding="none">
              {filteredPayments.map((payment, idx) => (
                <div key={payment.id}
                  className={cn("flex items-start gap-4 px-5 py-4", idx < filteredPayments.length - 1 && "border-b border-black/[0.05]")}>
                  <div className="w-9 h-9 rounded-button flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{payment.client}</p>
                        <p className="text-xs text-text-muted mt-0.5">{payment.invoice_number} - {METHOD_LABELS[payment.payment_method]}</p>
                        {payment.reference && <p className="text-xs text-text-muted font-sans mt-0.5">{payment.reference}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <CurrencyDisplay amount={payment.amount_received} currency={payment.currency} size="sm" className="text-green-400" />
                        <p className="text-xs text-text-muted mt-0.5">{formatDate(payment.payment_date)}</p>
                      </div>
                    </div>
                    {(payment.tds_amount > 0 || payment.skydo_margin > 0) && (
                      <div className="flex items-center gap-3 mt-2">
                        {payment.tds_amount > 0 && (
                          <span className="text-xs text-yellow-400/80 bg-yellow-500/10 px-2 py-0.5 rounded">
                            TDS: -Rs.{payment.tds_amount.toLocaleString("en-IN")}
                          </span>
                        )}
                        {payment.skydo_margin > 0 && (
                          <span className="text-xs text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded">
                            Skydo fee: -Rs.{payment.skydo_margin.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </GlassCard>
          ) : (
            <GlassCard padding="none">
              {filteredExpenses.map((exp, idx) => (
                <div key={exp.id}
                  className={cn("flex items-start gap-4 px-5 py-4", idx < filteredExpenses.length - 1 && "border-b border-black/[0.05]")}>
                  <div className="w-9 h-9 rounded-button flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${CATEGORY_COLORS[exp.category] ?? "#9ca3af"}15` }}>
                    <TrendingDown className="w-4 h-4" style={{ color: CATEGORY_COLORS[exp.category] ?? "#9ca3af" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{exp.particulars}</p>
                        <p className="text-xs text-text-muted mt-0.5">{exp.category}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold font-sans text-red-400">-Rs.{exp.amount.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-text-muted mt-0.5">{formatDate(exp.date)}</p>
                      </div>
                    </div>
                    {exp.auto && (
                      <span className="text-[10px] text-blue-400/70 bg-blue-500/10 px-2 py-0.5 rounded mt-1.5 inline-block">
                        Auto-categorized
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </GlassCard>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Needs follow-up (shown for payments tab) */}
          {tab === "payments" && (
            <GlassCard padding="md">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Needs Follow-Up</h3>
              <div className="space-y-3">
                {OVERDUE_INVOICES.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-card"
                    style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}>
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary">{item.client}</p>
                      <p className="text-xs text-text-muted">{item.invoice}</p>
                      <p className="text-xs font-sans font-semibold text-red-400 mt-1">Rs.{item.amount.toLocaleString("en-IN")}</p>
                      {"days_overdue" in item && (
                        <p className="text-xs text-red-400/70">{item.days_overdue} days overdue</p>
                      )}
                      {"days_due" in item && (
                        <p className="text-xs text-yellow-400/70">Due in {(item as { days_due: number }).days_due} days</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Monthly cash flow (shown for both tabs) */}
          <GlassCard padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Monthly Cash Flow</h3>
            <div className="space-y-2">
              {CASH_FLOW.map((m) => {
                const net = m.inflow - m.outflow;
                return (
                  <div key={m.month} className="py-1.5 border-b border-black/[0.04] last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary font-medium">{m.month}</span>
                      <span className="text-xs font-bold font-sans text-green-500">+Rs.{(net/1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-text-muted">
                      <span className="text-green-400">In: Rs.{(m.inflow/1000).toFixed(0)}K</span>
                      <span>-</span>
                      <span className="text-red-400">Out: Rs.{(m.outflow/1000).toFixed(0)}K</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Expense category breakdown (shown for expenses tab) */}
          {tab === "expenses" && (
            <GlassCard padding="md">
              <h3 className="text-sm font-semibold text-text-primary mb-3">By Category</h3>
              <div className="space-y-2">
                {Object.entries(
                  EXPENSES.reduce<Record<string, number>>((acc, e) => {
                    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
                    return acc;
                  }, {})
                ).sort(([, a], [, b]) => b - a).map(([cat, amt]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] ?? "#9ca3af" }} />
                      {cat}
                    </span>
                    <span className="text-xs font-sans font-semibold text-text-primary">
                      Rs.{amt.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Dark section */}
      <DarkSection>
        <DarkLabel>Cash Flow Overview</DarkLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: CheckCircle2,  label: "Total received",  value: `Rs.${(totalReceived/100000).toFixed(1)}L`,  sub: "Last 5 payments tracked",    color: "#22c55e" },
            { icon: TrendingDown,  label: "Total expenses",  value: `Rs.${(totalExpenses/1000).toFixed(1)}K`,    sub: "Feb + Jan 2026",              color: "#ef4444" },
            { icon: AlertCircle,   label: "Outstanding",     value: "Rs.94.2K",                                  sub: "2 invoices - follow-up needed",color: "#f59e0b" },
            { icon: TrendingDown,  label: "Net TDS loss",    value: `Rs.${totalTds.toLocaleString("en-IN")}`,    sub: "194J - Maximus OIGA",         color: "#9ca3af" },
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
