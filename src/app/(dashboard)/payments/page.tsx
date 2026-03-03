"use client";

import { useState } from "react";
import { CreditCard, TrendingUp, AlertCircle, CheckCircle2, Search, Filter } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

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
  { client: "Nandhini Hotel", invoice: "G00111", amount: 76700, days_due: 5 },
];

export default function PaymentsPage() {
  const [search, setSearch] = useState("");

  const filtered = PAYMENTS.filter((p) =>
    p.client.toLowerCase().includes(search.toLowerCase()) ||
    p.invoice_number.toLowerCase().includes(search.toLowerCase())
  );

  const totalReceived = PAYMENTS.reduce((s, p) => s + p.amount_received, 0);
  const totalTds = PAYMENTS.reduce((s, p) => s + p.tds_amount, 0);
  const totalSkydo = PAYMENTS.reduce((s, p) => s + p.skydo_margin, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Payments"
        description="Track all incoming payments and deductions"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Received"
          value={`Rs.${(totalReceived / 100000).toFixed(1)}L`}
          icon={CheckCircle2}
          trend="up"
          change="This FY"
        />
        <StatCard
          title="Outstanding"
          value="Rs.94.2K"
          icon={AlertCircle}
          trend="neutral"
          change="2 invoices"
        />
        <StatCard
          title="TDS Deducted"
          value={`Rs.${totalTds.toLocaleString("en-IN")}`}
          icon={TrendingUp}
          trend="neutral"
          change="From clients"
        />
        <StatCard
          title="Skydo Fees"
          value={`Rs.${totalSkydo.toLocaleString("en-IN")}`}
          icon={CreditCard}
          trend="neutral"
          change="Conversion charges"
        />
      </div>

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

        {/* Overdue / pending sidebar */}
        <div className="space-y-4">
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

          <GlassCard padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Monthly Summary</h3>
            <div className="space-y-2">
              {[
                { month: "Mar 2026", amount: 76700, status: "partial" },
                { month: "Feb 2026", amount: 335830, status: "complete" },
                { month: "Jan 2026", amount: 76700, status: "complete" },
                { month: "Dec 2025", amount: 115830, status: "complete" },
              ].map((item) => (
                <div key={item.month} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-text-secondary">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-sans text-text-primary">
                      Rs.{(item.amount / 1000).toFixed(0)}K
                    </span>
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        item.status === "complete" ? "bg-green-400" : "bg-yellow-400"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
