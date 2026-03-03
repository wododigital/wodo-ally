"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { useClients } from "@/lib/hooks/use-clients";
import { useServices } from "@/lib/hooks/use-services";
import { useProjects } from "@/lib/hooks/use-projects";
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

function getInvoiceTypeFromClient(client: ClientRow): "gst" | "non_gst" | "international" {
  if (client.client_type === "indian_gst") return "gst";
  if (client.client_type === "indian_non_gst") return "non_gst";
  return "international";
}

export function NewInvoiceModal({
  onClose,
  preselectedClientId = "",
  preselectedType = null,
}: {
  onClose: () => void;
  preselectedClientId?: string;
  preselectedType?: string | null;
}) {
  const router = useRouter();

  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [invoiceType, setInvoiceType] = useState<"gst" | "international" | "non_gst" | "proforma">("proforma");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", service_id: "", description: "", amount: "", quantity: 1 },
  ]);

  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: servicesData = [] } = useServices();
  const { data: projects = [] } = useProjects(selectedClientId || undefined);
  const createInvoice = useCreateInvoice();

  const services = servicesData.map((s) => ({ id: s.id, name: s.name, color: s.color ?? "#888888" }));

  useEffect(() => { setSelectedProjectId(""); }, [selectedClientId]);

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  function handleClientChange(clientId: string) {
    setSelectedClientId(clientId);
    if (invoiceType !== "proforma") {
      const client = clients.find((c) => c.id === clientId);
      if (client) setInvoiceType(getInvoiceTypeFromClient(client));
    }
  }

  const effectiveCurrency = selectedClient?.currency ?? "INR";
  const effectiveTaxType = invoiceType === "proforma"
    ? (selectedClient ? getInvoiceTypeFromClient(selectedClient) : "gst")
    : invoiceType;
  const taxRate = effectiveTaxType === "gst" ? 18 : 0;
  const subtotal = lineItems.reduce((s, item) => s + (parseFloat(item.amount) || 0) * item.quantity, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  const currencyPrefix = effectiveCurrency === "USD" ? "$" : effectiveCurrency === "AED" ? "AED " : effectiveCurrency === "GBP" ? "GBP " : "Rs.";

  function addLineItem() {
    setLineItems((p) => [...p, { id: Date.now().toString(), service_id: "", description: "", amount: "", quantity: 1 }]);
  }
  function removeLineItem(id: string) { setLineItems((p) => p.filter((i) => i.id !== id)); }
  function updateLineItem(id: string, field: keyof LineItem, value: string | number) {
    setLineItems((p) => p.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }
  function getFormattedDescription(item: LineItem) {
    const svc = services.find((s) => s.id === item.service_id);
    if (svc && item.description.trim()) return `${svc.name}: ${item.description.trim()}`;
    return item.description.trim();
  }

  function handleSubmit(asDraft: boolean) {
    if (!selectedClientId) { toast.error("Please select a client"); return; }
    const finalLineItems = lineItems
      .filter((i) => i.description.trim() && parseFloat(i.amount) > 0)
      .map((i) => ({ description: getFormattedDescription(i), amount: parseFloat(i.amount) || 0, quantity: i.quantity }));
    if (finalLineItems.length === 0) { toast.error("Add at least one line item with a description and amount"); return; }
    if (!invoiceDate) { toast.error("Invoice date is required"); return; }

    createInvoice.mutate(
      {
        invoice: {
          invoice_type: invoiceType,
          client_id: selectedClientId,
          project_ids: selectedProjectId ? [selectedProjectId] : [],
          currency: effectiveCurrency,
          subtotal, tax_rate: taxRate, tax_amount: tax,
          total_amount: total, balance_due: total,
          invoice_date: invoiceDate,
          due_date: dueDate || null,
          notes: notes || null,
          billing_period_start: null, billing_period_end: null,
          status: "draft",
        },
        lineItems: finalLineItems,
      },
      { onSuccess: (newInvoice) => { onClose(); router.push(`/invoices/${newInvoice.id}`); } }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }} onClick={onClose} />
      <div
        className="relative w-full max-w-3xl rounded-2xl flex flex-col"
        style={{
          maxHeight: "90vh",
          background: "rgba(255,255,255,0.98)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
        }}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">New Invoice</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {invoiceType === "proforma" ? "Creating Pro Forma invoice" : "Create a new invoice for a client"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Invoice type */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice Type</p>
              {invoiceType === "proforma" && (
                <button
                  type="button"
                  onClick={() => {
                    const client = clients.find((c) => c.id === selectedClientId);
                    setInvoiceType(client ? getInvoiceTypeFromClient(client) : "gst");
                  }}
                  className="text-xs text-gray-400 hover:text-accent transition-colors underline underline-offset-2"
                >
                  Switch to direct invoice
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { value: "gst",           label: "GST Invoice",   desc: "G-series, 18% GST"     },
                { value: "international", label: "International", desc: "G-series, 0% tax"       },
                { value: "non_gst",       label: "Non-GST",       desc: "NG-series, 0% tax"      },
                { value: "proforma",      label: "Pro Forma",     desc: "PF-YYYYMMDD, no serial" },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setInvoiceType(type.value as typeof invoiceType)}
                  className={cn(
                    "p-3 rounded-xl text-left border transition-all duration-150",
                    invoiceType === type.value
                      ? "border-accent bg-orange-50"
                      : "border-gray-100 bg-gray-50 hover:border-gray-200"
                  )}
                >
                  <p className={cn("text-sm font-medium", invoiceType === type.value ? "text-accent" : "text-gray-800")}>{type.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Invoice details */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Invoice Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">Invoice Number</label>
                <input type="text" readOnly value="Assigned on finalization"
                  className="glass-input opacity-50 cursor-default text-text-muted text-xs" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">Client *</label>
                <select className="glass-input" value={selectedClientId} onChange={(e) => handleClientChange(e.target.value)} disabled={clientsLoading}>
                  <option value="">{clientsLoading ? "Loading..." : "Select client..."}</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>

              {selectedClientId && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">Project (optional)</label>
                  <select className="glass-input" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
                    <option value="">No project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}

              {selectedClient && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">Currency</label>
                  <input type="text" readOnly value={`${effectiveCurrency} (from client)`}
                    className="glass-input opacity-60 cursor-default" />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">Invoice Date *</label>
                <input type="date" className="glass-input" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">Due Date</label>
                <input type="date" className="glass-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-gray-500">Notes (shown on invoice)</label>
                <textarea rows={2} className="glass-input resize-none"
                  placeholder="Payment terms, bank details will be added automatically..."
                  value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Line Items</p>
              <button type="button" onClick={addLineItem}
                className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-orange-600 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Add item
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 mb-2 px-0.5">
              <div className="w-32 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Service</div>
              <div className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Description</div>
              <div className="w-14 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-gray-400 text-center">Qty</div>
              <div className="w-32 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-gray-400 text-right">Amount</div>
              {lineItems.length > 1 && <div className="w-7 shrink-0" />}
            </div>

            <div className="space-y-2.5">
              {lineItems.map((item) => {
                const svc = services.find((s) => s.id === item.service_id);
                const previewText = item.description.trim() && svc ? `${svc.name}: ${item.description.trim()}` : item.description.trim();
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-start gap-2">
                      <div className="w-32 shrink-0">
                        <select value={item.service_id} onChange={(e) => updateLineItem(item.id, "service_id", e.target.value)}
                          className="glass-input text-xs py-2"
                          style={svc ? { borderColor: `${svc.color}40`, color: svc.color } : undefined}>
                          <option value="">-- service --</option>
                          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <input type="text" value={item.description} onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                          placeholder="Description" className="glass-input" />
                      </div>
                      <div className="w-14 shrink-0">
                        <input type="number" value={item.quantity} min="1"
                          onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                          className="glass-input text-center" placeholder="1" />
                      </div>
                      <div className="w-32 shrink-0">
                        <input type="number" value={item.amount} placeholder="Amount"
                          onChange={(e) => updateLineItem(item.id, "amount", e.target.value)}
                          className="glass-input font-sans" />
                      </div>
                      {lineItems.length > 1 && (
                        <button type="button" onClick={() => removeLineItem(item.id)}
                          className="p-2 text-gray-300 hover:text-red-400 transition-colors mt-0.5 shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {svc && item.description.trim() && (
                      <p className="text-[11px] text-gray-400 ml-0.5">
                        <span className="font-semibold text-[10px] uppercase tracking-wider">PDF:</span>{" "}
                        <span style={{ color: svc.color }}>&quot;{previewText}&quot;</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col items-end gap-1.5">
              <div className="flex justify-between w-52">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-sm font-sans font-semibold text-gray-800">{currencyPrefix}{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between w-52">
                  <span className="text-sm text-gray-500">GST ({taxRate}%)</span>
                  <span className="text-sm font-sans text-gray-500">Rs.{tax.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between w-52 pt-2 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-800">Total</span>
                <span className="text-lg font-sans font-bold text-accent">{currencyPrefix}{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t border-black/[0.06] shrink-0 rounded-b-2xl"
          style={{ background: "rgba(255,255,255,0.96)" }}
        >
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-button text-sm font-medium text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 transition-all">
            Cancel
          </button>
          <button type="button" onClick={() => handleSubmit(true)} disabled={createInvoice.isPending}
            className="px-4 py-2.5 rounded-button text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all disabled:opacity-50 flex items-center gap-2">
            {createInvoice.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save as Draft
          </button>
          <button type="button" onClick={() => handleSubmit(false)} disabled={createInvoice.isPending}
            className="px-6 py-2.5 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}>
            {createInvoice.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Create Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
