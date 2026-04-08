"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes";
import { toast } from "sonner";
import { GlassCard } from "@/components/shared/glass-card";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { cn } from "@/lib/utils/cn";
import { useServices } from "@/lib/hooks/use-services";
import { useClients } from "@/lib/hooks/use-clients";
import { useProjects } from "@/lib/hooks/use-projects";
import { useInvoice, useUpdateInvoice, useDeleteInvoice } from "@/lib/hooks/use-invoices";

interface LineItem {
  id: string;
  service_id: string;
  description: string;
  amount: string;
  quantity: number;
}

const STATUS_OPTIONS = ["draft", "sent", "paid", "overdue", "cancelled"];

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────

function DeleteModal({ onConfirm, onCancel, isPending }: { onConfirm: () => void; onCancel: () => void; isPending: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.10)" }}>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Delete Invoice?</h3>
            <p className="text-xs text-gray-500">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">Only draft invoices can be deleted. Sent/paid invoices must be cancelled first.</p>
        <div className="flex items-center gap-3 pt-1">
          <button onClick={onCancel} disabled={isPending} className="flex-1 px-4 py-2 rounded-button text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isPending} className="flex-1 px-4 py-2 rounded-button text-sm font-semibold text-white disabled:opacity-70 flex items-center justify-center gap-2" style={{ background: "#ef4444" }}>
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isPending ? "Deleting..." : "Delete Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: servicesData = [] } = useServices();
  const services = servicesData.map((s) => ({ id: s.id, name: s.name, color: s.color ?? "#888888" }));
  const { data: clients = [] } = useClients();

  const { data: invoice, isLoading } = useInvoice(id);
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();

  const [invoiceType, setInvoiceType] = useState<"gst" | "international" | "non_gst" | "proforma">("gst");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", service_id: "", description: "", amount: "", quantity: 1 },
  ]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useUnsavedChanges(isDirty);

  const { data: projects = [] } = useProjects(selectedClientId || undefined);

  // Pre-fill from fetched invoice
  useEffect(() => {
    if (invoice && !initialized) {
      setInvoiceType(invoice.invoice_type as typeof invoiceType);
      setInvoiceNumber(invoice.invoice_number ?? "");
      setSelectedClientId(invoice.client_id ?? "");
      setStatus(invoice.status);
      setInvoiceDate(invoice.invoice_date ?? "");
      setDueDate(invoice.due_date ?? "");
      setNotes(invoice.notes ?? "");
      setSelectedProjectId((invoice.project_ids ?? [])[0] ?? "");
      if (invoice.line_items && invoice.line_items.length > 0) {
        setLineItems(
          invoice.line_items.map((item, i) => ({
            id: String(i + 1),
            service_id: "",
            description: item.description ?? "",
            amount: String(item.amount ?? ""),
            quantity: item.quantity ?? 1,
          }))
        );
      }
      setInitialized(true);
    }
  }, [invoice, initialized]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const effectiveCurrency = selectedClient?.currency ?? invoice?.currency ?? "INR";
  const subtotal = Math.round(lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0) * item.quantity, 0) * 100) / 100;
  const taxRate = invoiceType === "gst" ? 18 : 0;
  const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  const currencyPrefix = effectiveCurrency === "USD" ? "$" : effectiveCurrency === "AED" ? "AED " : "Rs.";

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      { id: Date.now().toString(), service_id: "", description: "", amount: "", quantity: 1 },
    ]);
  }

  function removeLineItem(itemId: string) {
    setLineItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  function updateLineItem(itemId: string, field: keyof LineItem, value: string | number) {
    setLineItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClientId) {
      toast.error("Please select a client");
      return;
    }
    const validItems = lineItems.filter((item) => item.description.trim() && parseFloat(item.amount) > 0);
    if (validItems.length === 0) {
      toast.error("Add at least one line item with description and amount");
      return;
    }

    updateInvoice.mutate(
      {
        id,
        data: {
          invoice_type: invoiceType,
          invoice_number: invoiceNumber || null,
          client_id: selectedClientId,
          project_ids: selectedProjectId ? [selectedProjectId] : [],
          status: status as "draft" | "sent" | "paid" | "overdue" | "cancelled",
          invoice_date: invoiceDate,
          due_date: dueDate || null,
          notes: notes || null,
          subtotal,
          tax_rate: taxRate,
          tax_amount: tax,
          total_amount: total,
          currency: effectiveCurrency,
        },
        lineItems: validItems.map((item, idx) => ({
          description: item.description.trim(),
          amount: parseFloat(item.amount) || 0,
          quantity: item.quantity,
          service_id: item.service_id || null,
          sort_order: idx,
        })),
      },
      {
        onSuccess: () => router.push(`/invoices/${id}`),
      }
    );
  }

  function handleDelete() {
    deleteInvoice.mutate(id, {
      onSuccess: () => router.push("/invoices"),
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="rounded-xl px-4 py-3 text-sm text-red-500 border border-red-500/20 bg-red-500/[0.06]">
        Invoice not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[
        { label: "Invoices", href: "/invoices" },
        { label: invoice?.invoice_number ?? "Invoice", href: `/invoices/${id}` },
        { label: "Edit" },
      ]} />

      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          isPending={deleteInvoice.isPending}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Edit Invoice</h2>
          <p className="text-sm text-text-muted mt-0.5">
            {invoice.invoice_number ?? invoice.proforma_ref ?? "Draft"} - {invoice.client?.company_name ?? ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium transition-all"
          style={{ color: "#ef4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit} onChange={() => setIsDirty(true)}>
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Client *</label>
              <select
                className="glass-input"
                value={selectedClientId}
                onChange={(e) => { setSelectedClientId(e.target.value); setSelectedProjectId(""); }}
                required
              >
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>

            {selectedClientId && projects.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Project</label>
                <select
                  className="glass-input"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">No project (optional)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

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
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="glass-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="glass-input"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Notes (shown on invoice)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass-input resize-none"
                placeholder="Payment terms, additional notes..."
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

          <div className="space-y-3">
            {lineItems.map((item, idx) => {
              const svc = services.find((s) => s.id === item.service_id);
              return (
                <div key={item.id} className="flex items-start gap-2">
                  <div className="w-36 shrink-0">
                    <select
                      value={item.service_id}
                      onChange={(e) => updateLineItem(item.id, "service_id", e.target.value)}
                      className="glass-input text-xs py-2"
                      style={svc ? { borderColor: `${svc.color}40`, color: svc.color } : undefined}
                    >
                      <option value="">-- service --</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                      placeholder={`Description ${idx + 1}`}
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
          <button
            type="button"
            onClick={() => router.push(`/invoices/${id}`)}
            className="px-4 py-2.5 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT hover:bg-surface-hover border border-black/[0.05] transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateInvoice.isPending}
            className="px-6 py-2.5 rounded-button text-sm font-semibold text-white transition-all duration-200 disabled:opacity-70 flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            {updateInvoice.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {updateInvoice.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
