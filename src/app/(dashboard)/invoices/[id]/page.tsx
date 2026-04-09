"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Send, Download, Plus, CheckCircle2,
  Calendar, Building2, Hash, X, Pencil, Eye, Loader2, Mail, Clock, AlertCircle, Bell
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/shared/glass-card";
import { InvoiceDetailSkeleton } from "@/components/shared/boneyard-skeletons";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PdfPreviewModal } from "@/components/shared/pdf-preview-modal";
import { SendInvoiceEmailModal } from "@/components/invoices/send-invoice-email-modal";
import { StatusChangeDropdown } from "@/components/invoices/status-change-dropdown";
import { SendInvoiceDropdown } from "@/components/invoices/send-invoice-dropdown";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { paymentSchema } from "@/lib/validations/invoice";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import {
  useInvoice,
  useInvoicePayments,
  useRecordPayment,
  useFinalizeInvoice,
  useUpdateInvoice,
  useConvertProformaToInvoice,
} from "@/lib/hooks/use-invoices";
import { useInvoiceEmailActivity, useRecordEmailActivity } from "@/lib/hooks/use-email-activity";
// generateInvoicePdf and downloadBlob are loaded dynamically on demand to avoid bundling @react-pdf/renderer upfront
import type { Database } from "@/types/database";

type PaymentMethod = Database["public"]["Tables"]["invoice_payments"]["Row"]["payment_method"];

interface RecordPaymentForm {
  payment_date: string;
  amount_received: string;
  payment_method: string;
  reference: string;
  tds_amount: string;
  notes: string;
}

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer (NEFT)",
  upi: "UPI",
  skydo_usd: "Skydo (USD)",
  skydo_aed: "Skydo (AED)",
  skydo_gbp: "Skydo (GBP)",
  other: "Other",
};

function RecordPaymentModal({
  invoiceId,
  invoiceTotal,
  balanceDue,
  currency,
  onClose,
}: {
  invoiceId: string;
  invoiceTotal: number;
  balanceDue: number;
  currency: string;
  onClose: () => void;
}) {
  const recordPayment = useRecordPayment();
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

    const amountReceived = parseFloat(form.amount_received) || 0;
    const tdsAmount = parseFloat(form.tds_amount) || 0;

    // Validate with Zod schema
    const validation = paymentSchema.safeParse({
      amount_received: amountReceived,
      payment_date: form.payment_date,
      payment_method: form.payment_method,
      tds_deducted: tdsAmount,
      notes: form.notes || null,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    recordPayment.mutate(
      {
        payment: {
          invoice_id: invoiceId,
          payment_date: form.payment_date,
          amount_received: amountReceived,
          currency,
          tds_amount: tdsAmount,
          payment_method: form.payment_method as PaymentMethod,
          reference_number: form.reference || null,
          notes: form.notes || null,
        },
      },
      {
        onSuccess: () => onClose(),
      }
    );
  }

  const currencySymbol = currency === "USD" ? "$" : currency === "AED" ? "AED " : "Rs.";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
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
              disabled={recordPayment.isPending}
              className="px-6 py-2.5 rounded-button text-sm font-semibold text-white transition-all duration-200 disabled:opacity-70 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
            >
              {recordPayment.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Build PDF props helper ───────────────────────────────────────────────────

function buildPdfProps(
  invoice: NonNullable<ReturnType<typeof useInvoice>["data"]>
) {
  const client = invoice.client;
  return {
    invoice: {
      invoice_number: invoice.invoice_number,
      proforma_ref: invoice.proforma_ref,
      invoice_type: invoice.invoice_type,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      tax_rate: invoice.tax_rate,
      tax_amount: invoice.tax_amount,
      total_amount: invoice.total_amount,
      notes: invoice.notes,
      billing_period_start: invoice.billing_period_start,
      billing_period_end: invoice.billing_period_end,
    },
    client: {
      company_name: client?.company_name ?? "Unknown Client",
      address: client?.address ?? null,
      city: client?.city ?? null,
      state: client?.state ?? null,
      pincode: client?.pincode ?? null,
      country: client?.country ?? "India",
      gstin: client?.gstin ?? null,
      tax_number: client?.tax_number ?? null,
      tax_number_label: client?.tax_number_label ?? null,
    },
    lineItems: invoice.line_items.map((li) => ({
      description: li.description,
      amount: li.amount,
      quantity: li.quantity,
    })),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendEmailType, setSendEmailType] = useState<"invoice" | "reminder" | "followup">("invoice");

  const { data: invoice, isLoading } = useInvoice(id);
  const { data: payments = [] } = useInvoicePayments(id);
  const { data: emailActivityResponse } = useInvoiceEmailActivity(id);
  const finalizeInvoice = useFinalizeInvoice();
  const updateInvoice = useUpdateInvoice();
  const convertProforma = useConvertProformaToInvoice();
  const recordEmailActivity = useRecordEmailActivity();

  const emailLog = emailActivityResponse?.activities ?? [];

  const balance = invoice?.balance_due ?? 0;

  async function handlePreviewPdf() {
    if (!invoice) return;
    setIsPdfGenerating(true);
    try {
      const { generateInvoicePdf } = await import("@/lib/pdf");
      const props = buildPdfProps(invoice);
      const blob = await generateInvoicePdf(props);
      const url = URL.createObjectURL(blob);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(url);
      setShowPdfModal(true);
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsPdfGenerating(false);
    }
  }

  function handleClosePdfModal() {
    setShowPdfModal(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(undefined);
    }
  }

  async function handleDownloadPdf() {
    if (!invoice) return;
    setIsPdfGenerating(true);
    try {
      const { generateInvoicePdf, downloadBlob } = await import("@/lib/pdf");
      const props = buildPdfProps(invoice);
      const blob = await generateInvoicePdf(props);
      const ref = invoice.invoice_type === "proforma"
        ? (invoice.proforma_ref ?? "proforma")
        : (invoice.invoice_number ?? "invoice");
      downloadBlob(blob, `WODO-${ref}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsPdfGenerating(false);
    }
  }

  if (isLoading) {
    return <InvoiceDetailSkeleton />;
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="w-12 h-12 text-text-muted" />
        <h2 className="text-lg font-semibold text-text-primary">Invoice not found</h2>
        <p className="text-text-muted text-sm">The invoice you are looking for does not exist or has been deleted.</p>
        <Link href="/invoices" className="text-accent hover:underline text-sm">Back to Invoices</Link>
      </div>
    );
  }

  const displayRef =
    invoice.invoice_type === "proforma"
      ? (invoice.proforma_ref ?? "Pro Forma")
      : (invoice.invoice_number ?? "DRAFT");

  const clientName = invoice.client?.company_name ?? "Unknown Client";
  const pdfTitle = `Invoice ${displayRef} - ${clientName}`;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Breadcrumbs items={[
        { label: "Invoices", href: "/invoices" },
        { label: displayRef },
      ]} />

      <PdfPreviewModal
        isOpen={showPdfModal}
        onClose={handleClosePdfModal}
        title={pdfTitle}
        pdfUrl={pdfUrl}
        onDownload={handleDownloadPdf}
      />

      {showSendModal && invoice.client && (
        <SendInvoiceEmailModal
          isOpen={showSendModal}
          invoiceId={id}
          type={sendEmailType}
          onClose={() => setShowSendModal(false)}
          onSent={() => {
            recordEmailActivity.mutate({
              invoiceId: id,
              action_type: sendEmailType === "invoice" ? "sent" : "resent",
              email_recipient: invoice.client?.billing_emails?.[0] ?? "client@example.com",
              email_template: `invoice_${sendEmailType}`,
            });
          }}
          clientEmail={invoice.client?.billing_emails?.[0] ?? ""}
        />
      )}

      {showPaymentModal && invoice && (
        <RecordPaymentModal
          invoiceId={id}
          invoiceTotal={invoice.total_amount}
          balanceDue={balance}
          currency={invoice.currency}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      <div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-sans">
              {displayRef}
            </h1>
            <p className="text-sm text-text-muted mt-1">{clientName}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <StatusChangeDropdown
              status={invoice.status}
              invoiceType={invoice.invoice_type}
              onChange={(s) => updateInvoice.mutate({ id, data: { status: s as any, ...(s === "paid" ? { paid_at: new Date().toISOString() } : {}), ...(s === "sent" ? { sent_at: new Date().toISOString() } : {}) } })}
              onConvertProforma={() => convertProforma.mutate(id)}
            />
            <Link
              href={`/invoices/${id}/edit`}
              className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.08] hover:text-accent transition-all"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
            <button
              onClick={handlePreviewPdf}
              disabled={isPdfGenerating}
              className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.08] hover:text-accent transition-all disabled:opacity-60"
            >
              {isPdfGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Preview PDF
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isPdfGenerating}
              className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.08] transition-all disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            {invoice.status === "draft" && (
              <button
                onClick={() => finalizeInvoice.mutate({ id })}
                disabled={finalizeInvoice.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-button text-sm font-semibold text-white disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
              >
                {finalizeInvoice.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
                Finalize
              </button>
            )}
            {(["sent", "overdue", "viewed", "paid", "partially_paid"].includes(invoice.status) || (invoice.status === "draft" && invoice.invoice_number)) && (
              <SendInvoiceDropdown
                invoiceStatus={invoice.status}
                invoiceId={id}
                onSendClick={(type) => {
                  setSendEmailType(type);
                  setShowSendModal(true);
                }}
              />
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
                  {displayRef}
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
                <p className="text-sm text-text-primary">{clientName}</p>
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
                      <CurrencyDisplay
                        amount={item.amount * item.quantity}
                        currency={invoice.currency as "INR" | "USD" | "AED"}
                        size="sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex flex-col items-end gap-2 pt-4 border-t border-black/[0.05]">
              <div className="flex justify-between w-48">
                <span className="text-sm text-text-muted">Subtotal</span>
                <CurrencyDisplay amount={invoice.subtotal} currency={invoice.currency as "INR" | "USD" | "AED"} size="sm" />
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between w-48">
                  <span className="text-sm text-text-muted">GST ({invoice.tax_rate}%)</span>
                  <CurrencyDisplay amount={invoice.tax_amount} currency={invoice.currency as "INR" | "USD" | "AED"} size="sm" className="text-text-secondary" />
                </div>
              )}
              <div className="flex justify-between w-48 pt-2 border-t border-black/[0.05]">
                <span className="text-sm font-bold text-text-primary">Total</span>
                <CurrencyDisplay amount={invoice.total_amount} currency={invoice.currency as "INR" | "USD" | "AED"} size="md" className="text-accent" />
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
                <CurrencyDisplay amount={invoice.total_amount} currency={invoice.currency as "INR" | "USD" | "AED"} size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-muted">Received</span>
                <CurrencyDisplay
                  amount={invoice.total_received ?? 0}
                  currency={invoice.currency as "INR" | "USD" | "AED"}
                  size="sm"
                  className="text-green-400"
                />
              </div>
              <div className="flex justify-between pt-2 border-t border-black/[0.05]">
                <span className="text-sm font-semibold text-text-primary">Balance Due</span>
                <CurrencyDisplay
                  amount={balance}
                  currency={invoice.currency as "INR" | "USD" | "AED"}
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
          {payments.length > 0 && (
            <GlassCard padding="md">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Payment History</h3>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-sans font-semibold text-green-400">
                          +{payment.currency === "USD" ? "$" : payment.currency === "AED" ? "AED " : "Rs."}
                          {(payment.amount_received ?? 0).toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-text-muted">{formatDate(payment.payment_date)}</p>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {payment.payment_method ? METHOD_LABELS[payment.payment_method] ?? payment.payment_method : ""}
                      </p>
                      {(payment.tds_amount ?? 0) > 0 && (
                        <p className="text-xs text-yellow-400/80">
                          TDS deducted: Rs.{(payment.tds_amount ?? 0).toLocaleString("en-IN")}
                        </p>
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

          {/* Email activity + reminders */}
          <GlassCard padding="md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary">Email Activity</h3>
              {invoice.sent_at && (
                <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full font-medium">Sent</span>
              )}
            </div>

            {/* Timeline */}
            <div className="space-y-2 mb-3">
              {invoice.sent_at && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-secondary">Invoice sent</p>
                    <p className="text-[11px] text-text-muted font-sans">{formatDate(invoice.sent_at.slice(0, 10))}</p>
                  </div>
                </div>
              )}
              {invoice.viewed_at && (
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-secondary">Viewed by client</p>
                    <p className="text-[11px] text-text-muted font-sans">{formatDate(invoice.viewed_at.slice(0, 10))}</p>
                  </div>
                </div>
              )}
              {invoice.paid_at && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-secondary">Payment received</p>
                    <p className="text-[11px] text-text-muted font-sans">{formatDate(invoice.paid_at.slice(0, 10))}</p>
                  </div>
                </div>
              )}
              {emailLog.map((entry, i) => (
                <div key={entry.id} className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-secondary">
                      {entry.action_type === "sent" ? "Sent to" : entry.action_type === "viewed" ? "Viewed by" : "Resent to"} {entry.email_recipient}
                      {entry.resent_count > 0 && ` (${entry.resent_count} times)`}
                    </p>
                    <p className="text-[11px] text-text-muted font-sans">{formatDate(entry.sent_at.slice(0, 10))}</p>
                  </div>
                </div>
              ))}
              {!invoice.sent_at && emailLog.length === 0 && (
                <p className="text-xs text-text-muted text-center py-2">No emails sent yet</p>
              )}
            </div>

            {/* Past due reminder buttons */}
            {balance > 0 && !["cancelled", "draft", "archived", "paid"].includes(invoice.status as string) && (
              <div className="space-y-2 pt-3 border-t border-black/[0.05]">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">Send Reminder</p>
                <button
                  onClick={() => {
                    setSendEmailType("reminder");
                    setShowSendModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-button text-xs font-medium text-white"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Send Reminder
                </button>
                {invoice.status === "overdue" && (
                  <button
                    onClick={() => {
                      setSendEmailType("followup");
                      setShowSendModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-button text-xs font-medium"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#ef4444",
                    }}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Overdue Follow-up
                  </button>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
