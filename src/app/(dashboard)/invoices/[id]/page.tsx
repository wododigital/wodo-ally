"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Send, Download, Plus, CheckCircle2,
  Calendar, Building2, Hash, X, Pencil
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { cn } from "@/lib/utils/cn";
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

interface RecordPaymentForm {
  payment_date: string;
  amount_received: string;
  payment_method: string;
  reference: string;
  tds_amount: string;
  notes: string;
}

function RecordPaymentModal({
  invoiceTotal,
  balanceDue,
  currency,
  onClose,
  onSave,
}: {
  invoiceTotal: number;
  balanceDue: number;
  currency: "INR" | "USD" | "AED";
  onClose: () => void;
  onSave: (form: RecordPaymentForm) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<RecordPaymentForm>({
    payment_date: today,
    amount_received: String(balanceDue),
    payment_method: "bank_transfer",
    reference: "",
    tds_amount: "0",
    notes: "",
  });

  function update(field: keyof RecordPaymentForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  const currencySymbol = currency === "USD" ? "$" : currency === "AED" ? "AED " : "Rs.";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 space-y-5"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Record Payment</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-text-muted hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Balance info */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: "rgba(253,126,20,0.06)", border: "1px solid rgba(253,126,20,0.15)" }}
        >
          <span className="text-sm text-text-secondary">Balance due</span>
          <span className="text-base font-bold font-sans text-accent">
            {currencySymbol}{balanceDue.toLocaleString("en-IN")}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Payment Date *</label>
              <input
                type="date"
                required
                value={form.payment_date}
                onChange={(e) => update("payment_date", e.target.value)}
                className="glass-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Amount Received *</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={form.amount_received}
                onChange={(e) => update("amount_received", e.target.value)}
                className="glass-input font-sans"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Payment Method *</label>
            <select
              required
              value={form.payment_method}
              onChange={(e) => update("payment_method", e.target.value)}
              className="glass-input"
            >
              <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value="upi">UPI</option>
              <option value="skydo_usd">Skydo (USD)</option>
              <option value="skydo_aed">Skydo (AED)</option>
              <option value="skydo_gbp">Skydo (GBP)</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Transaction Reference</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => update("reference", e.target.value)}
              className="glass-input font-sans"
              placeholder="UTR / SKYDO-ID / UPI Ref"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">TDS Deducted (if any)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.tds_amount}
              onChange={(e) => update("tds_amount", e.target.value)}
              className="glass-input font-sans"
              placeholder="0"
            />
            <p className="text-xs text-text-muted">Leave as 0 if no TDS was deducted</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="glass-input resize-none"
              placeholder="e.g. Full payment received / partial payment"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT border border-black/[0.05] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-button text-sm font-semibold text-white transition-all duration-200"
              style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [localPayments, setLocalPayments] = useState<Array<{
    date: string; amount: number; method: string; reference: string; tds: number; notes: string;
  }>>([]);

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

  const allPayments = [...invoice.payments, ...localPayments];
  const balance = invoice.total_amount - allPayments.reduce((s, p) => s + p.amount, 0);

  function handleSavePayment(form: RecordPaymentForm) {
    const METHOD_LABELS: Record<string, string> = {
      bank_transfer: "Bank Transfer (NEFT)",
      upi: "UPI",
      skydo_usd: "Skydo (USD)",
      skydo_aed: "Skydo (AED)",
      skydo_gbp: "Skydo (GBP)",
      other: "Other",
    };
    setLocalPayments((prev) => [
      ...prev,
      {
        date: form.payment_date,
        amount: parseFloat(form.amount_received) || 0,
        method: METHOD_LABELS[form.payment_method] ?? form.payment_method,
        reference: form.reference,
        tds: parseFloat(form.tds_amount) || 0,
        notes: form.notes,
      },
    ]);
    setShowPaymentModal(false);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {showPaymentModal && (
        <RecordPaymentModal
          invoiceTotal={invoice.total_amount}
          balanceDue={Math.max(0, balance)}
          currency={invoice.currency}
          onClose={() => setShowPaymentModal(false)}
          onSave={handleSavePayment}
        />
      )}
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
            <h1 className="text-2xl font-bold text-text-primary font-sans">
              {invoice.invoice_number ?? "Pro Forma"}
            </h1>
            <p className="text-sm text-text-muted mt-1">{invoice.client}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={invoice.status} />
            <Link
              href={`/invoices/${id}/edit`}
              className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.08] hover:text-accent transition-all"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
            {invoice.status === "draft" || invoice.status === "sent" ? (
              <>
                <button className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.08] transition-all">
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
              <button className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.08] transition-all">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 pb-6 border-b border-black/[0.05]">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                  <Hash className="w-3 h-3" /> Invoice
                </div>
                <p className="text-sm font-sans font-semibold text-text-primary">
                  {invoice.invoice_number ?? "PF-20260115-001"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                  <Calendar className="w-3 h-3" /> Invoice Date
                </div>
                <p className="text-sm font-sans text-text-primary">{formatDate(invoice.invoice_date)}</p>
              </div>
              {invoice.due_date && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                    <Calendar className="w-3 h-3" /> Due Date
                  </div>
                  <p className="text-sm font-sans text-text-primary">{formatDate(invoice.due_date)}</p>
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
                  <p className="text-sm font-sans text-text-primary">
                    {formatDate(invoice.billing_period_start)} - {formatDate(invoice.billing_period_end!)}
                  </p>
                </div>
              )}
            </div>

            {/* Line items */}
            <table className="w-full mb-6">
              <thead>
                <tr className="border-b border-black/[0.05]">
                  <th className="text-left pb-2 text-xs font-medium uppercase tracking-wider text-text-muted">Description</th>
                  <th className="text-center pb-2 text-xs font-medium uppercase tracking-wider text-text-muted w-12">Qty</th>
                  <th className="text-right pb-2 text-xs font-medium uppercase tracking-wider text-text-muted">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items.map((item, idx) => (
                  <tr key={idx} className={idx < invoice.line_items.length - 1 ? "border-b border-black/[0.05]" : ""}>
                    <td className="py-3 pr-4">
                      <p className="text-sm text-text-secondary">{item.description}</p>
                    </td>
                    <td className="py-3 text-center">
                      <p className="text-sm text-text-muted font-sans">{item.quantity}</p>
                    </td>
                    <td className="py-3 text-right">
                      <CurrencyDisplay amount={item.amount * item.quantity} currency={invoice.currency} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex flex-col items-end gap-2 pt-4 border-t border-black/[0.05]">
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
              <div className="flex justify-between w-48 pt-2 border-t border-black/[0.05]">
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
                  amount={allPayments.reduce((s, p) => s + p.amount, 0)}
                  currency={invoice.currency}
                  size="sm"
                  className="text-green-400"
                />
              </div>
              <div className="flex justify-between pt-2 border-t border-black/[0.05]">
                <span className="text-sm font-semibold text-text-primary">Balance Due</span>
                <CurrencyDisplay
                  amount={balance}
                  currency={invoice.currency}
                  size="sm"
                  className={balance > 0 ? "text-yellow-400" : "text-green-400"}
                />
              </div>
            </div>
            {balance > 0 && invoice.status !== "cancelled" && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
              >
                <Plus className="w-4 h-4" />
                Record Payment
              </button>
            )}
          </GlassCard>

          {/* Payment history */}
          {allPayments.length > 0 && (
            <GlassCard padding="md">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Payment History</h3>
              <div className="space-y-3">
                {allPayments.map((payment, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-sans font-semibold text-green-400">
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
