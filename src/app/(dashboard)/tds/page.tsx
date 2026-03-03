"use client";

import { useState } from "react";
import { Plus, Trash2, FileCheck, Receipt } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkCard } from "@/components/shared/dark-section";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import {
  useTdsCertificates,
  useCreateTdsCertificate,
  useDeleteTdsCertificate,
} from "@/lib/hooks/use-tds";
import { useClients } from "@/lib/hooks/use-clients";

const FY_OPTIONS = ["2025-26", "2024-25", "2023-24"];
const QUARTER_OPTIONS = ["Q1", "Q2", "Q3", "Q4"];

// ─── AddCertificateForm ───────────────────────────────────────────────────────

interface AddFormProps {
  defaultFY: string;
  onClose: () => void;
}

function AddCertificateForm({ defaultFY, onClose }: AddFormProps) {
  const { data: clients = [] } = useClients();
  const createMutation = useCreateTdsCertificate();

  const [form, setForm] = useState({
    certificate_number: "",
    client_id: "",
    amount: "",
    financial_year: defaultFY,
    quarter: "",
    received_date: "",
    notes: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.certificate_number.trim() || !form.amount || !form.financial_year) {
      return;
    }
    createMutation.mutate(
      {
        certificate_number: form.certificate_number.trim(),
        client_id: form.client_id || null,
        amount: parseFloat(form.amount),
        financial_year: form.financial_year,
        quarter: form.quarter || null,
        received_date: form.received_date || null,
        notes: form.notes || null,
      },
      { onSuccess: onClose }
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.3)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{
          background: "var(--surface, #fff)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
        }}
      >
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Add TDS Certificate</h3>
          <p className="text-xs text-text-muted mt-0.5">Record a TDS certificate received from a client</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Certificate No. <span className="text-red-500">*</span>
              </label>
              <input
                name="certificate_number"
                value={form.certificate_number}
                onChange={handleChange}
                placeholder="e.g. TDSC-2025-001"
                className="glass-input text-sm w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Amount (INR) <span className="text-red-500">*</span>
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={handleChange}
                placeholder="0.00"
                className="glass-input text-sm w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Client</label>
            <select
              name="client_id"
              value={form.client_id}
              onChange={handleChange}
              className="glass-input text-sm w-full"
            >
              <option value="">-- Select client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Financial Year <span className="text-red-500">*</span>
              </label>
              <select
                name="financial_year"
                value={form.financial_year}
                onChange={handleChange}
                className="glass-input text-sm w-full"
                required
              >
                {FY_OPTIONS.map((fy) => (
                  <option key={fy} value={fy}>
                    {fy}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Quarter</label>
              <select
                name="quarter"
                value={form.quarter}
                onChange={handleChange}
                className="glass-input text-sm w-full"
              >
                <option value="">-- Any --</option>
                {QUARTER_OPTIONS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Received Date
            </label>
            <input
              name="received_date"
              type="date"
              value={form.received_date}
              onChange={handleChange}
              className="glass-input text-sm w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Optional notes..."
              rows={2}
              className="glass-input text-sm w-full resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-button text-sm font-medium text-text-secondary border border-black/10 hover:bg-surface-DEFAULT transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 rounded-button text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "rgba(253,126,20,0.85)" }}
            >
              {createMutation.isPending ? "Saving..." : "Add Certificate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── TdsPage ─────────────────────────────────────────────────────────────────

export default function TdsPage() {
  const [selectedFY, setSelectedFY] = useState("2025-26");
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: certs = [], isLoading } = useTdsCertificates(selectedFY);
  const deleteMutation = useDeleteTdsCertificate();

  const totalTds = certs.reduce((sum, c) => sum + (c.amount ?? 0), 0);

  function formatAmount(amount: number) {
    return `Rs.${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI */}
      <DarkSection>
        <div className="flex items-center justify-between mb-4">
          <p
            className="text-[11px] uppercase tracking-widest font-bold"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            TDS Certificates
          </p>
          <div className="flex items-center gap-2">
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="px-2.5 py-1 rounded-button text-xs font-medium border bg-white/[0.06] text-white/70 border-white/[0.12] hover:border-white/[0.2] transition-colors"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              {FY_OPTIONS.map((fy) => (
                <option key={fy} value={fy} style={{ color: "#1e2030", background: "#fff" }}>
                  FY {fy}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-button text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "rgba(253,126,20,0.85)" }}
            >
              <Plus className="w-3 h-3" />
              Add Certificate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          <DarkCard className="p-5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
              style={{ background: "rgba(34,197,94,0.12)" }}
            >
              <FileCheck className="w-4 h-4" style={{ color: "#22c55e" }} />
            </div>
            <p
              className="text-xl font-light font-sans mb-0.5"
              style={{ color: "rgba(255,255,255,0.92)" }}
            >
              {isLoading ? "-" : certs.length}
            </p>
            <p className="text-[11px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              Certificates
            </p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              FY {selectedFY}
            </p>
          </DarkCard>

          <DarkCard className="p-5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
              style={{ background: "rgba(59,130,246,0.12)" }}
            >
              <Receipt className="w-4 h-4" style={{ color: "#3b82f6" }} />
            </div>
            <p
              className="text-xl font-light font-sans mb-0.5"
              style={{ color: "rgba(255,255,255,0.92)" }}
            >
              {isLoading ? "-" : formatAmount(totalTds)}
            </p>
            <p className="text-[11px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              Total TDS Received
            </p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              FY {selectedFY}
            </p>
          </DarkCard>
        </div>
      </DarkSection>

      {/* Table */}
      {isLoading ? (
        <GlassCard padding="md">
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-text-muted">Loading certificates...</p>
          </div>
        </GlassCard>
      ) : certs.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No TDS certificates"
          description={`No TDS certificates recorded for FY ${selectedFY}. Add one to get started.`}
        />
      ) : (
        <GlassCard padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.05]">
                  <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider text-text-muted">
                    Certificate #
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-muted">
                    Client
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-muted">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-muted hidden sm:table-cell">
                    FY
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-muted hidden md:table-cell">
                    Quarter
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-muted hidden md:table-cell">
                    Received
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-muted hidden lg:table-cell">
                    Notes
                  </th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {certs.map((cert, idx) => (
                  <tr
                    key={cert.id}
                    className={cn(
                      "hover:bg-surface-DEFAULT transition-colors group",
                      idx < certs.length - 1 && "border-b border-black/[0.05]"
                    )}
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-sans font-semibold text-text-primary">
                        {cert.certificate_number}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-text-secondary">{cert.client_name ?? "-"}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-sm font-sans font-semibold text-text-primary">
                        {formatAmount(cert.amount)}
                      </p>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded border font-medium text-blue-600 bg-blue-50 border-blue-200">
                        {cert.financial_year}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-sm text-text-muted">{cert.quarter ?? "-"}</p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-sm text-text-muted font-sans">
                        {cert.received_date ? formatDate(cert.received_date) : "-"}
                      </p>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell max-w-[200px]">
                      <p className="text-sm text-text-muted truncate">{cert.notes ?? "-"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => {
                          if (confirm("Delete this TDS certificate?")) {
                            deleteMutation.mutate(cert.id);
                          }
                        }}
                        className="p-1.5 rounded-button text-text-muted hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete certificate"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Add form modal */}
      {showAddForm && (
        <AddCertificateForm
          defaultFY={selectedFY}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}
