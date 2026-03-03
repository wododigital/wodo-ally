"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Search } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";

import { CurrencyDisplay } from "@/components/shared/currency-display";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

// ─── Mock data ─────────────────────────────────────────────────────────────

const PAYMENTS = [
  {
    id: "1",
    invoice_number: "G00110",
    client: "Nandhini Deluxe Hotel",
    payment_date: "2026-02-10",
    amount_received: 76700,
    currency: "INR" as const,
    tds_amount: 0,
    skydo_margin: 0,
    payment_method: "bank_transfer",
    reference: "NEFT2026021001234",
    notes: "Full payment received",
  },
  {
    id: "2",
    invoice_number: "G00112",
    client: "Maximus OIGA",
    payment_date: "2026-02-09",
    amount_received: 53500,
    currency: "INR" as const,
    tds_amount: 5500,
    skydo_margin: 0,
    payment_method: "bank_transfer",
    reference: "NEFT2026020901234",
    notes: "TDS @10% deducted under 194J",
  },
  {
    id: "3",
    invoice_number: "G00109",
    client: "Sea Wonders Tourism",
    payment_date: "2026-02-18",
    amount_received: 89600,
    currency: "INR" as const,
    tds_amount: 0,
    skydo_margin: 2400,
    payment_method: "skydo_aed",
    reference: "SKYDO-FEB-001",
    notes: "AED 4,000 via Skydo, INR credited after conversion",
  },
  {
    id: "4",
    invoice_number: "G00108",
    client: "Dentique Dental Care",
    payment_date: "2025-12-18",
    amount_received: 115830,
    currency: "INR" as const,
    tds_amount: 0,
    skydo_margin: 1170,
    payment_method: "skydo_usd",
    reference: "SKYDO-DEC-001",
    notes: "$1,350 via Skydo",
  },
  {
    id: "5",
    invoice_number: "G00107",
    client: "Nandhini Deluxe Hotel",
    payment_date: "2026-01-10",
    amount_received: 76700,
    currency: "INR" as const,
    tds_amount: 0,
    skydo_margin: 0,
    payment_method: "bank_transfer",
    reference: "NEFT2026011001234",
    notes: "Full payment",
  },
];

// Client payment behaviour table data
const CLIENT_BEHAVIOR = [
  { client: "Nandhini Hotel",   avg_days: 7.2,  on_time_pct: 100, label: "Prompt",         color: "#16a34a" },
  { client: "Dentique",         avg_days: 9.0,  on_time_pct: 95,  label: "Prompt",         color: "#16a34a" },
  { client: "Sea Wonders",      avg_days: 11.3, on_time_pct: 90,  label: "On time",         color: "#3b82f6" },
  { client: "Godavari Heritage",avg_days: 14.0, on_time_pct: 85,  label: "On time",         color: "#3b82f6" },
  { client: "Maximus OIGA",     avg_days: 18.5, on_time_pct: 72,  label: "Occasional delays",color: "#f59e0b" },
  { client: "Raj Enterprises",  avg_days: 31.0, on_time_pct: 50,  label: "Slow payer",     color: "#ef4444" },
];

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  skydo_usd: "Skydo (USD)",
  skydo_aed: "Skydo (AED)",
  skydo_gbp: "Skydo (GBP)",
  upi: "UPI",
  other: "Other",
};

const OVERDUE_INVOICES = [
  { client: "Raj Enterprises", invoice: "NG00201", amount: 17500, days_overdue: 8 },
  { client: "Nandhini Hotel",  invoice: "G00111",  amount: 76700, days_due: 5 },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [search, setSearch] = useState("");

  const filtered = PAYMENTS.filter((p) =>
    p.client.toLowerCase().includes(search.toLowerCase()) ||
    p.invoice_number.toLowerCase().includes(search.toLowerCase())
  );

  const totalReceived = PAYMENTS.reduce((s, p) => s + p.amount_received, 0);
  const totalTds      = PAYMENTS.reduce((s, p) => s + p.tds_amount, 0);
  const totalSkydo    = PAYMENTS.reduce((s, p) => s + p.skydo_margin, 0);
  const totalOutstanding = 94200; // 76.7K + 17.5K

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Payments"
        description="Track all incoming payments and deductions"
      />

      {/* Compact summary bar - replaces 4 stat cards */}
      <GlassCard padding="md">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.05]">
          {[
            { label: "Total Received",  value: `Rs.${(totalReceived / 100000).toFixed(1)}L`, color: "#16a34a" },
            { label: "Outstanding",     value: `Rs.${(totalOutstanding / 1000).toFixed(0)}K`, color: "#f59e0b" },
            { label: "TDS Deducted",    value: `Rs.${totalTds.toLocaleString("en-IN")}`, color: "#6b7280" },
            { label: "Skydo Fees",      value: `Rs.${totalSkydo.toLocaleString("en-IN")}`, color: "#6b7280" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-0.5 px-4 first:pl-0 last:pr-0 py-1 sm:py-0">
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{item.label}</span>
              <span className="text-lg font-bold font-sans" style={{ color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search payments..."
              className="glass-input pl-9"
            />
          </div>

          <GlassCard padding="none">
            {filtered.map((payment, idx) => (
              <div
                key={payment.id}
                className={cn(
                  "flex items-start gap-4 px-5 py-4",
                  idx < filtered.length - 1 && "border-b border-black/[0.05]"
                )}
              >
                <div
                  className="w-9 h-9 rounded-button flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
                >
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{payment.client}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {payment.invoice_number} - {METHOD_LABELS[payment.payment_method]}
                      </p>
                      {payment.reference && (
                        <p className="text-xs text-text-muted font-sans mt-0.5">{payment.reference}</p>
                      )}
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
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Needs follow-up */}
          <GlassCard padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Needs Follow-Up</h3>
            <div className="space-y-3">
              {OVERDUE_INVOICES.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-card"
                  style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}
                >
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary">{item.client}</p>
                    <p className="text-xs text-text-muted">{item.invoice}</p>
                    <p className="text-xs font-sans font-semibold text-red-400 mt-1">
                      Rs.{item.amount.toLocaleString("en-IN")}
                    </p>
                    {"days_overdue" in item && (
                      <p className="text-xs text-red-400/70">{item.days_overdue} days overdue</p>
                    )}
                    {"days_due" in item && (
                      <p className="text-xs text-yellow-400/70">Due in {item.days_due} days</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Monthly summary */}
          <GlassCard padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Monthly Summary</h3>
            <div className="space-y-2">
              {[
                { month: "Mar 2026", amount: 76700, status: "partial", label: "Partial" },
                { month: "Feb 2026", amount: 335830, status: "complete", label: "All paid" },
                { month: "Jan 2026", amount: 76700, status: "complete", label: "All paid" },
                { month: "Dec 2025", amount: 115830, status: "complete", label: "All paid" },
              ].map((item) => (
                <div key={item.month} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-text-secondary">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-sans text-text-primary">
                      Rs.{(item.amount / 1000).toFixed(0)}K
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-full",
                        item.status === "complete"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Client payment behaviour */}
          <GlassCard padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Payment Behaviour</h3>
            <div className="space-y-2.5">
              {CLIENT_BEHAVIOR.map((c) => (
                <div key={c.client} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{c.client}</p>
                    <p className="text-[10px] text-text-muted font-sans">avg {c.avg_days}d - {c.on_time_pct}% on time</p>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                    style={{
                      background: `${c.color}15`,
                      color: c.color,
                    }}
                  >
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
