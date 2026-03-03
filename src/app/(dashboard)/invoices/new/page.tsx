"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils/cn";
import { useClients } from "@/lib/hooks/use-clients";
import { useCreateInvoice } from "@/lib/hooks/use-invoices";
import type { Database } from "@/types/database";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

interface LineItem {
  id: string;
  service_id: string;
  description: string;
  amount: string;
  quantity: number;
}

// Matches the services catalogue in Settings
const SERVICES = [
  { id: "s1", name: "SEO",                color: "#fd7e14" },
  { id: "s2", name: "Google My Business", color: "#f59e0b" },
  { id: "s3", name: "Web Development",    color: "#3b82f6" },
  { id: "s4", name: "Branding",           color: "#8b5cf6" },
  { id: "s5", name: "Google Ads",         color: "#22c55e" },
  { id: "s6", name: "Social Media",       color: "#ec4899" },
  { id: "s7", name: "UI/UX Design",       color: "#06b6d4" },
  { id: "s8", name: "Content Marketing",  color: "#84cc16" },
];

function getInvoiceTypeFromClient(
  client: ClientRow
): "gst" | "non_gst" | "international" {
  if (client.client_type === "indian_gst") return "gst";
  if (client.client_type === "indian_non_gst") return "non_gst";
  return "international";
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const createInvoice = useCreateInvoice();

  const [invoiceType, setInvoiceType] = useState<"gst" | "international" | "non_gst" | "proforma">("gst");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [billingPeriodStart, setBillingPeriodStart] = useState("");
  const [billingPeriodEnd, setBillingPeriodEnd] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", service_id: "", description: "", amount: "", quantity: 1 },
  ]);

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  // Auto-determine type when client changes
  function handleClientChange(clientId: string) {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client && invoiceType !== "proforma") {
      setInvoiceType(getInvoiceTypeFromClient(client));
    }
  }

  const effectiveCurrency = selectedClient?.currency ?? "INR";
  const taxRate = invoiceType === "gst" ? 18 : 0;
  const subtotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0) * item.quantity, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const currencyPrefix =
    effectiveCurrency === "USD" ? "$" :
    effectiveCurrency === "AED" ? "AED " :
    effectiveCurrency === "GBP" ? "GBP " :
    "Rs.";

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      { id: Date.now().toString(), service_id: "", description: "", amount: "", quantity: 1 },
    ]);
  }

  function removeLineItem(id: string) {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  }

  function updateLineItem(id: string, field: keyof LineItem, value: string | number) {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function getFormattedDescription(item: LineItem): string {
    const svc = SERVICES.find((s) => s.id === item.service_id);
    if (svc && item.description.trim()) return `${svc.name}: ${item.description.trim()}`;
    return item.description.trim();
  }

  function handleSubmit(e: React.FormEvent, asDraft: boolean) {
    e.preventDefault();
    if (!selectedClientId) return;

    const finalLineItems = lineItems
      .filter((item) => item.description.trim() && parseFloat(item.amount) > 0)
      .map((item) => ({
        description: getFormattedDescription(item),
        amount: parseFloat(item.amount) || 0,
        quantity: item.quantity,
      }));

    if (finalLineItems.length === 0) return;

    createInvoice.mutate(
      {
        invoice: {
          invoice_type: invoiceType,
          client_id: selectedClientId,
          currency: effectiveCurrency,
          subtotal,
          tax_rate: taxRate,
          tax_amount: tax,
          total_amount: total,
          balance_due: total,
          invoice_date: invoiceDate,
          due_date: dueDate || null,
          notes: notes || null,
          billing_period_start: billingPeriodStart || null,
          billing_period_end: billingPeriodEnd || null,
          status: asDraft ? "draft" : "draft",
        },
        lineItems: finalLineItems,
      },
      {
        onSuccess: (newInvoice) => {
          router.push(`/invoices/${newInvoice.id}`);
        },
      }
    );
  }

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
        <PageHeader title="New Invoice" description="Create a new invoice" />
      </div>

      <form className="space-y-6" onSubmit={(e) => handleSubmit(e, false)}>

        {/* Invoice type */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Invoice Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: "gst",           label: "GST Invoice",   desc: "G-series, 18% GST"      },
              { value: "international", label: "International", desc: "G-series, 0% tax"        },
              { value: "non_gst",       label: "Non-GST",       desc: "NG-series, 0% tax"       },
              { value: "proforma",      label: "Pro Forma",     desc: "PF-YYYYMMDD, no serial"  },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setInvoiceType(type.value as typeof invoiceType)}
                className={cn(
                  "p-3 rounded-card text-left border transition-all duration-150",
                  invoiceType === type.value
                    ? "border-accent bg-accent-muted"
                    : "border-black/[0.05] bg-surface-DEFAULT hover:border-black/[0.08]"
                )}
              >
                <p className={cn("text-sm font-medium", invoiceType === type.value ? "text-accent" : "text-text-primary")}>
                  {type.label}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{type.desc}</p>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Invoice details */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Invoice Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Invoice Number</label>
              <input
                type="text"
                readOnly
                value="Assigned on finalization"
                className="glass-input font-sans opacity-50 cursor-default text-text-muted text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Client *</label>
              <select
                className="glass-input"
                value={selectedClientId}
                onChange={(e) => handleClientChange(e.target.value)}
                required
                disabled={clientsLoading}
              >
                <option value="">
                  {clientsLoading ? "Loading clients..." : "Select client..."}
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>

            {selectedClient && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Currency</label>
                <input
                  type="text"
                  readOnly
                  value={`${effectiveCurrency} (from client)`}
                  className="glass-input font-sans opacity-60 cursor-default"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Invoice Date *</label>
              <input
                type="date"
                required
                className="glass-input"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                className="glass-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Billing Period Start</label>
              <input
                type="date"
                className="glass-input"
                value={billingPeriodStart}
                onChange={(e) => setBillingPeriodStart(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Billing Period End</label>
              <input
                type="date"
                className="glass-input"
                value={billingPeriodEnd}
                onChange={(e) => setBillingPeriodEnd(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Notes (shown on invoice)</label>
              <textarea
                rows={2}
                className="glass-input resize-none"
                placeholder="Payment terms, bank details will be added automatically..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </GlassCard>

        {/* Line items */}
        <GlassCard padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Line Items</h3>
            <button
              type="button"
              onClick={addLineItem}
              className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add item
            </button>
          </div>

          {/* Column headers */}
          <div className="hidden sm:flex items-center gap-2 mb-2 px-0.5">
            <div className="w-36 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Service</div>
            <div className="flex-1        text-[10px] font-semibold uppercase tracking-wider text-text-muted">Description</div>
            <div className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-text-muted text-center">Qty</div>
            <div className="w-36 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-text-muted text-right">Amount</div>
            {lineItems.length > 1 && <div className="w-8 shrink-0" />}
          </div>

          <div className="space-y-3">
            {lineItems.map((item) => {
              const svc = SERVICES.find((s) => s.id === item.service_id);
              const previewText = getFormattedDescription(item);
              const showPreview = !!svc && !!item.description.trim();

              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-start gap-2">
                    {/* Service dropdown */}
                    <div className="w-36 shrink-0">
                      <select
                        value={item.service_id}
                        onChange={(e) => updateLineItem(item.id, "service_id", e.target.value)}
                        className="glass-input text-xs py-2"
                        style={svc ? { borderColor: `${svc.color}40`, color: svc.color } : undefined}
                      >
                        <option value="">-- service --</option>
                        {SERVICES.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                        placeholder="Description"
                        className="glass-input"
                        required
                      />
                    </div>

                    {/* Quantity */}
                    <div className="w-16 shrink-0">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                        min="1"
                        className="glass-input text-center"
                        placeholder="Qty"
                      />
                    </div>

                    {/* Amount */}
                    <div className="w-36 shrink-0">
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateLineItem(item.id, "amount", e.target.value)}
                        placeholder="Amount"
                        className="glass-input font-sans"
                        required
                      />
                    </div>

                    {/* Delete */}
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="p-2 text-text-muted hover:text-red-400 transition-colors mt-0.5 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* PDF preview */}
                  {showPreview && (
                    <p className="text-[11px] text-text-muted ml-0.5 flex items-center gap-1">
                      <span className="text-[10px] uppercase tracking-wider font-semibold">PDF:</span>
                      <span className="font-sans" style={{ color: svc?.color }}>
                        &quot;{previewText}&quot;
                      </span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-black/[0.05]">
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center justify-between w-56">
                <span className="text-sm text-text-muted">Subtotal</span>
                <span className="text-sm font-sans font-semibold text-text-primary">
                  {currencyPrefix}{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              {taxRate > 0 && (
                <div className="flex items-center justify-between w-56">
                  <span className="text-sm text-text-muted">GST ({taxRate}%)</span>
                  <span className="text-sm font-sans text-text-secondary">
                    Rs.{tax.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between w-56 pt-2 border-t border-black/[0.05]">
                <span className="text-sm font-semibold text-text-primary">Total</span>
                <span className="text-lg font-sans font-bold text-accent">
                  {currencyPrefix}{total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Link
            href="/invoices"
            className="px-4 py-2.5 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT hover:bg-surface-hover border border-black/[0.05] transition-all"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
            disabled={createInvoice.isPending || !selectedClientId}
            className="px-4 py-2.5 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT hover:bg-surface-hover border border-black/[0.05] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {createInvoice.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save as Draft
          </button>
          <button
            type="submit"
            disabled={createInvoice.isPending || !selectedClientId}
            className="px-6 py-2.5 rounded-button text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            {createInvoice.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
