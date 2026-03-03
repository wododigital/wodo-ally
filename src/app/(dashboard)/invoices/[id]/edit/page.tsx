"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  { id: "11111111-0000-0000-0000-000000000001", name: "Nandhini Deluxe Hotel", currency: "INR" },
  { id: "22222222-0000-0000-0000-000000000002", name: "Maximus OIGA", currency: "INR" },
  { id: "33333333-0000-0000-0000-000000000003", name: "Godavari Heritage Hotels", currency: "INR" },
  { id: "44444444-0000-0000-0000-000000000004", name: "Dentique Dental Care", currency: "USD" },
  { id: "55555555-0000-0000-0000-000000000005", name: "Sea Wonders Tourism", currency: "AED" },
  { id: "66666666-0000-0000-0000-000000000006", name: "Raj Enterprises", currency: "INR" },
];

const PROJECTS_BY_CLIENT: Record<string, Array<{ id: string; name: string }>> = {
  "11111111-0000-0000-0000-000000000001": [
    { id: "proj-1a", name: "SEO Management" },
    { id: "proj-1b", name: "Google My Business" },
  ],
  "22222222-0000-0000-0000-000000000002": [
    { id: "proj-2a", name: "Performance Marketing" },
    { id: "proj-2b", name: "Social Media Management" },
  ],
  "33333333-0000-0000-0000-000000000003": [
    { id: "proj-3a", name: "Digital PR" },
  ],
  "44444444-0000-0000-0000-000000000004": [
    { id: "proj-4a", name: "Website Redesign" },
    { id: "proj-4b", name: "SEO Consulting" },
  ],
  "55555555-0000-0000-0000-000000000005": [
    { id: "proj-5a", name: "Content Strategy" },
  ],
  "66666666-0000-0000-0000-000000000006": [
    { id: "proj-6a", name: "Local SEO" },
  ],
};

const INVOICE_DEFAULTS: Record<string, {
  invoice_number: string | null;
  invoice_type: "gst" | "international" | "non_gst" | "proforma";
  client_id: string;
  invoice_date: string;
  due_date: string;
  status: string;
  notes: string;
  line_items: Array<{ description: string; amount: number; quantity: number }>;
}> = {
  "bbbbbbbb-0000-0000-0000-000000000001": {
    invoice_number: "G00110",
    invoice_type: "gst",
    client_id: "11111111-0000-0000-0000-000000000001",
    invoice_date: "2026-02-01",
    due_date: "2026-02-08",
    status: "paid",
    notes: "",
    line_items: [
      { description: "SEO Management - Feb 2026 (Keyword research, on-page optimization, link building)", amount: 55000, quantity: 1 },
      { description: "Google My Business Management - Feb 2026", amount: 10000, quantity: 1 },
    ],
  },
  "bbbbbbbb-0000-0000-0000-000000000002": {
    invoice_number: "G00111",
    invoice_type: "gst",
    client_id: "11111111-0000-0000-0000-000000000001",
    invoice_date: "2026-03-01",
    due_date: "2026-03-08",
    status: "sent",
    notes: "",
    line_items: [
      { description: "SEO Management - Mar 2026", amount: 55000, quantity: 1 },
      { description: "Google My Business Management - Mar 2026", amount: 10000, quantity: 1 },
    ],
  },
  "bbbbbbbb-0000-0000-0000-000000000003": {
    invoice_number: "G00112",
    invoice_type: "gst",
    client_id: "22222222-0000-0000-0000-000000000002",
    invoice_date: "2026-02-01",
    due_date: "2026-02-08",
    status: "paid",
    notes: "",
    line_items: [
      { description: "Performance Marketing - Feb 2026", amount: 50000, quantity: 1 },
    ],
  },
  "bbbbbbbb-0000-0000-0000-000000000004": {
    invoice_number: "G00113",
    invoice_type: "gst",
    client_id: "22222222-0000-0000-0000-000000000002",
    invoice_date: "2026-03-01",
    due_date: "2026-03-08",
    status: "draft",
    notes: "",
    line_items: [
      { description: "Performance Marketing - Mar 2026", amount: 50000, quantity: 1 },
    ],
  },
  "bbbbbbbb-0000-0000-0000-000000000005": {
    invoice_number: "G00108",
    invoice_type: "international",
    client_id: "44444444-0000-0000-0000-000000000004",
    invoice_date: "2025-12-01",
    due_date: "2025-12-15",
    status: "paid",
    notes: "",
    line_items: [
      { description: "Website Redesign - Phase 1", amount: 115830, quantity: 1 },
    ],
  },
  "bbbbbbbb-0000-0000-0000-000000000006": {
    invoice_number: "G00109",
    invoice_type: "international",
    client_id: "55555555-0000-0000-0000-000000000005",
    invoice_date: "2026-02-01",
    due_date: "2026-02-15",
    status: "paid",
    notes: "",
    line_items: [
      { description: "Content Strategy - Feb 2026", amount: 89600, quantity: 1 },
    ],
  },
  "bbbbbbbb-0000-0000-0000-000000000007": {
    invoice_number: "NG00201",
    invoice_type: "non_gst",
    client_id: "66666666-0000-0000-0000-000000000006",
    invoice_date: "2026-02-15",
    due_date: "2026-02-22",
    status: "overdue",
    notes: "",
    line_items: [
      { description: "Local SEO - Feb 2026", amount: 17500, quantity: 1 },
    ],
  },
  "bbbbbbbb-0000-0000-0000-000000000008": {
    invoice_number: null,
    invoice_type: "proforma",
    client_id: "33333333-0000-0000-0000-000000000003",
    invoice_date: "2026-01-15",
    due_date: "2026-01-22",
    status: "sent",
    notes: "",
    line_items: [
      { description: "Digital PR - Jan 2026", amount: 100300, quantity: 1 },
    ],
  },
};

const STATUS_OPTIONS = ["draft", "sent", "paid", "overdue", "cancelled"];

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const defaults = INVOICE_DEFAULTS[id] ?? {
    invoice_number: "",
    invoice_type: "gst" as const,
    client_id: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    status: "draft",
    notes: "",
    line_items: [{ description: "", amount: 0, quantity: 1 }],
  };

  const [invoiceType, setInvoiceType] = useState<"gst" | "international" | "non_gst" | "proforma">(defaults.invoice_type);
  const [invoiceNumber, setInvoiceNumber] = useState(defaults.invoice_number ?? "");
  const [selectedClient, setSelectedClient] = useState(defaults.client_id);
  const [status, setStatus] = useState(defaults.status);
  const [lineItems, setLineItems] = useState<LineItem[]>(
    defaults.line_items.map((item, i) => ({
      id: String(i + 1),
      description: item.description,
      amount: String(item.amount),
      quantity: item.quantity,
    }))
  );
  const [saved, setSaved] = useState(false);

  const client = CLIENTS.find((c) => c.id === selectedClient);
  const clientProjects = selectedClient ? (PROJECTS_BY_CLIENT[selectedClient] ?? []) : [];
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => router.push(`/invoices/${id}`), 800);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <Link
          href={`/invoices/${id}`}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoice
        </Link>
        <PageHeader title="Edit Invoice" description="Update invoice details" />
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Invoice type */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Invoice Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: "gst", label: "GST Invoice", desc: "G-series, 18% GST" },
              { value: "international", label: "International", desc: "G-series, 0% tax" },
              { value: "non_gst", label: "Non-GST", desc: "NG-series, 0% tax" },
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
            {/* Invoice number - editable */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="glass-input font-sans"
                placeholder="e.g. G00114"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Status</label>
              <select
                className="glass-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Client */}
            <div className="space-y-1.5">
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

            {/* Project */}
            {clientProjects.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Project</label>
                <select className="glass-input" defaultValue="">
                  <option value="">Select project (optional)...</option>
                  {clientProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Invoice Date *</label>
              <input type="date" required defaultValue={defaults.invoice_date} className="glass-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Due Date</label>
              <input type="date" defaultValue={defaults.due_date} className="glass-input" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Notes (shown on invoice)</label>
              <textarea rows={2} defaultValue={defaults.notes} className="glass-input resize-none" placeholder="Payment terms, additional notes..." />
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
          <div className="mt-6 pt-4 border-t border-black/[0.05]">
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
                    Rs.{tax.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between w-56 pt-2 border-t border-black/[0.05]">
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
            href={`/invoices/${id}`}
            className="px-4 py-2.5 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT hover:bg-surface-hover border border-black/[0.05] transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saved}
            className="px-6 py-2.5 rounded-button text-sm font-semibold text-white transition-all duration-200 disabled:opacity-70"
            style={{ background: saved ? "#16a34a" : "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
