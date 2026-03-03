"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils/cn";

interface LineItem {
  id: string;
  description: string;
  amount: string;
  quantity: number;
}

const CLIENTS = [
  { id: "11111111-0000-0000-0000-000000000001", name: "Nandhini Deluxe Hotel", type: "indian_gst", currency: "INR" },
  { id: "22222222-0000-0000-0000-000000000002", name: "Maximus OIGA", type: "indian_gst", currency: "INR" },
  { id: "33333333-0000-0000-0000-000000000003", name: "Godavari Heritage Hotels", type: "indian_gst", currency: "INR" },
  { id: "44444444-0000-0000-0000-000000000004", name: "Dentique Dental Care", type: "international", currency: "USD" },
  { id: "55555555-0000-0000-0000-000000000005", name: "Sea Wonders Tourism", type: "international", currency: "AED" },
  { id: "66666666-0000-0000-0000-000000000006", name: "Raj Enterprises", type: "indian_non_gst", currency: "INR" },
];

export default function NewInvoicePage() {
  const router = useRouter();
  const [invoiceType, setInvoiceType] = useState<"gst" | "international" | "non_gst" | "proforma">("gst");
  const [selectedClient, setSelectedClient] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", description: "", amount: "", quantity: 1 },
  ]);

  const client = CLIENTS.find((c) => c.id === selectedClient);
  const subtotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0) * item.quantity, 0);
  const taxRate = invoiceType === "gst" ? 18 : 0;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      { id: Date.now().toString(), description: "", amount: "", quantity: 1 },
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

      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); router.push("/invoices"); }}>
        {/* Invoice type */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Invoice Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: "gst", label: "GST Invoice", desc: "G00001 series, 18% GST" },
              { value: "international", label: "International", desc: "G00001 series, 0% tax" },
              { value: "non_gst", label: "Non-GST", desc: "NG00001 series, 0% tax" },
              { value: "proforma", label: "Pro Forma", desc: "PF-YYYYMMDD, no serial" },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setInvoiceType(type.value as typeof invoiceType)}
                className={cn(
                  "p-3 rounded-card text-left border transition-all duration-150",
                  invoiceType === type.value
                    ? "border-accent bg-accent-muted"
                    : "border-white/5 bg-surface-DEFAULT hover:border-white/10"
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

        {/* Client + dates */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Invoice Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Client *</label>
              <select
                className="glass-input"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                required
              >
                <option value="">Select client...</option>
                {CLIENTS.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Invoice Date *</label>
              <input type="date" required className="glass-input" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Due Date</label>
              <input type="date" className="glass-input" />
            </div>
            {invoiceType === "gst" || invoiceType === "non_gst" ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Billing Period Start</label>
                  <input type="date" className="glass-input" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Billing Period End</label>
                  <input type="date" className="glass-input" />
                </div>
              </>
            ) : null}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Notes (shown on invoice)</label>
              <textarea rows={2} className="glass-input resize-none" placeholder="Payment terms, bank details will be added automatically..." />
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

          <div className="space-y-3">
            {lineItems.map((item, idx) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                    placeholder={`Service description ${idx + 1}`}
                    className="glass-input"
                    required
                  />
                </div>
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
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLineItem(item.id)}
                    className="p-2 text-text-muted hover:text-red-400 transition-colors mt-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center justify-between w-56">
                <span className="text-sm text-text-muted">Subtotal</span>
                <span className="text-sm font-sans font-semibold text-text-primary">
                  {client?.currency === "USD" ? "$" : client?.currency === "AED" ? "AED " : "Rs."}{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              {taxRate > 0 && (
                <div className="flex items-center justify-between w-56">
                  <span className="text-sm text-text-muted">GST ({taxRate}%)</span>
                  <span className="text-sm font-sans text-text-secondary">
                    {client?.currency === "USD" ? "$" : "Rs."}{tax.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between w-56 pt-2 border-t border-white/5">
                <span className="text-sm font-semibold text-text-primary">Total</span>
                <span className="text-lg font-sans font-bold text-accent">
                  {client?.currency === "USD" ? "$" : client?.currency === "AED" ? "AED " : "Rs."}{total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Link
            href="/invoices"
            className="px-4 py-2.5 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT hover:bg-surface-hover border border-white/5 transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            name="action"
            value="draft"
            className="px-4 py-2.5 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT hover:bg-surface-hover border border-white/5 transition-all"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-button text-sm font-semibold text-white transition-all duration-200"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
