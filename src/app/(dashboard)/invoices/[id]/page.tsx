"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Send, Download, Plus, CheckCircle2,
  Calendar, Building2, Hash
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatDate } from "@/lib/utils/format";

const INVOICE_DATA: Record<string, {
  id: string;
  invoice_number: string | null;
  invoice_type: "gst" | "international" | "non_gst" | "proforma";
  client: string;
  client_type: string;
  currency: "INR" | "USD" | "AED";
  line_items: Array<{ description: string; amount: number; quantity: number }>;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  invoice_date: string;
  due_date: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  status: "draft" | "sent" | "viewed" | "paid" | "partially_paid" | "overdue" | "cancelled";
  notes: string | null;
  payments: Array<{
    date: string;
    amount: number;
    method: string;
    reference: string;
    tds: number;
    notes: string;
  }>;
}> = {
  "bbbbbbbb-0000-0000-0000-000000000001": {
    id: "bbbbbbbb-0000-0000-0000-000000000001",
    invoice_number: "G00110",
    invoice_type: "gst",
    client: "Nandhini Deluxe Hotel",
    client_type: "indian_gst",
    currency: "INR",
    line_items: [
      { description: "SEO Management - Feb 2026 (Keyword research, on-page optimization, link building)", amount: 55000, quantity: 1 },
      { description: "Google My Business Management - Feb 2026", amount: 10000, quantity: 1 },
    ],
    subtotal: 65000,
    tax_rate: 18,
    tax_amount: 11700,
    total_amount: 76700,
    invoice_date: "2026-02-01",
    due_date: "2026-02-08",
    billing_period_start: "2026-02-01",
    billing_period_end: "2026-02-28",
    status: "paid",
    notes: null,
    payments: [
      { date: "2026-02-10", amount: 76700, method: "Bank Transfer (NEFT)", reference: "NEFT2026021001234", tds: 0, notes: "Full payment received" },
    ],
  },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const invoice = INVOICE_DATA[id] ?? {
    id,
    invoice_number: "G00111",
    invoice_type: "gst" as const,
    client: "Client",
    client_type: "indian_gst",
    currency: "INR" as const,
    line_items: [{ description: "Service", amount: 50000, quantity: 1 }],
    subtotal: 50000,
    tax_rate: 18,
    tax_amount: 9000,
    total_amount: 59000,
    invoice_date: "2026-03-01",
    due_date: "2026-03-08",
    billing_period_start: "2026-03-01",
    billing_period_end: "2026-03-31",
    status: "sent" as const,
    notes: null,
    payments: [],
  };

  const balance = invoice.total_amount - invoice.payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-mono">
              {invoice.invoice_number ?? "Pro Forma"}
            </h1>
            <p className="text-sm text-text-muted mt-1">{invoice.client}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={invoice.status} />
            {invoice.status === "draft" || invoice.status === "sent" ? (
              <>
                <button className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium text-text-secondary bg-surface-DEFAULT border border-white/5 hover:border-white/10 transition-all">
                  <Download className="w-4 h-4" />
                  PDF
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-button text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </>
            ) : (
              <button className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium text-text-secondary bg-surface-DEFAULT border border-white/5 hover:border-white/10 transition-all">
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice preview */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard padding="md">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 pb-6 border-b border-white/5">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                  <Hash className="w-3 h-3" /> Invoice
                </div>
                <p className="text-sm font-mono font-semibold text-text-primary">
                  {invoice.invoice_number ?? "PF-20260115-001"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                  <Calendar className="w-3 h-3" /> Invoice Date
                </div>
                <p className="text-sm font-mono text-text-primary">{formatDate(invoice.invoice_date)}</p>
              </div>
              {invoice.due_date && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                    <Calendar className="w-3 h-3" /> Due Date
                  </div>
                  <p className="text-sm font-mono text-text-primary">{formatDate(invoice.due_date)}</p>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                  <Building2 className="w-3 h-3" /> Bill To
                </div>
                <p className="text-sm text-text-primary">{invoice.client}</p>
              </div>
              {invoice.billing_period_start && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                    <Calendar className="w-3 h-3" /> Billing Period
                  </div>
                  <p className="text-sm font-mono text-text-primary">
                    {formatDate(invoice.billing_period_start)} - {formatDate(invoice.billing_period_end!)}
                  </p>
                </div>
              )}
            </div>

            {/* Line items */}
            <table className="w-full mb-6">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left pb-2 text-xs font-medium uppercase tracking-wider text-text-muted">Description</th>
                  <th className="text-center pb-2 text-xs font-medium uppercase tracking-wider text-text-muted w-12">Qty</th>
                  <th className="text-right pb-2 text-xs font-medium uppercase tracking-wider text-text-muted">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items.map((item, idx) => (
                  <tr key={idx} className={idx < invoice.line_items.length - 1 ? "border-b border-white/5" : ""}>
                    <td className="py-3 pr-4">
                      <p className="text-sm text-text-secondary">{item.description}</p>
                    </td>
                    <td className="py-3 text-center">
                      <p className="text-sm text-text-muted font-mono">{item.quantity}</p>
                    </td>
                    <td className="py-3 text-right">
                      <CurrencyDisplay amount={item.amount * item.quantity} currency={invoice.currency} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex flex-col items-end gap-2 pt-4 border-t border-white/5">
              <div className="flex justify-between w-48">
                <span className="text-sm text-text-muted">Subtotal</span>
                <CurrencyDisplay amount={invoice.subtotal} currency={invoice.currency} size="sm" />
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between w-48">
                  <span className="text-sm text-text-muted">GST ({invoice.tax_rate}%)</span>
                  <CurrencyDisplay amount={invoice.tax_amount} currency={invoice.currency} size="sm" className="text-text-secondary" />
                </div>
              )}
              <div className="flex justify-between w-48 pt-2 border-t border-white/5">
                <span className="text-sm font-bold text-text-primary">Total</span>
                <CurrencyDisplay amount={invoice.total_amount} currency={invoice.currency} size="md" className="text-accent" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Payment sidebar */}
        <div className="space-y-4">
          <GlassCard padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-text-muted">Invoice Total</span>
                <CurrencyDisplay amount={invoice.total_amount} currency={invoice.currency} size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-muted">Received</span>
                <CurrencyDisplay
                  amount={invoice.payments.reduce((s, p) => s + p.amount, 0)}
                  currency={invoice.currency}
                  size="sm"
                  className="text-green-400"
                />
              </div>
              <div className="flex justify-between pt-2 border-t border-white/5">
                <span className="text-sm font-semibold text-text-primary">Balance Due</span>
                <CurrencyDisplay
                  amount={balance}
                  currency={invoice.currency}
                  size="sm"
                  className={balance > 0 ? "text-yellow-400" : "text-green-400"}
                />
              </div>
            </div>
            {invoice.status !== "paid" && invoice.status !== "cancelled" && (
              <button
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
              >
                <Plus className="w-4 h-4" />
                Record Payment
              </button>
            )}
          </GlassCard>

          {/* Payment history */}
          {invoice.payments.length > 0 && (
            <GlassCard padding="md">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Payment History</h3>
              <div className="space-y-3">
                {invoice.payments.map((payment, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-mono font-semibold text-green-400">
                          +Rs.{payment.amount.toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-text-muted">{formatDate(payment.date)}</p>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{payment.method}</p>
                      {payment.tds > 0 && (
                        <p className="text-xs text-yellow-400/80">TDS deducted: Rs.{payment.tds.toLocaleString("en-IN")}</p>
                      )}
                      {payment.notes && (
                        <p className="text-xs text-text-muted mt-0.5">{payment.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
