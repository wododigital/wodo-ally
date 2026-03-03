"use client";

import { useState } from "react";
import {
  FilePlus,
  Search,
  ChevronDown,
  Download,
  Pencil,
  FileText,
  Calendar,
  X,
  Plus,
  Trash2,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils/cn";
import { useClients } from "@/lib/hooks/use-clients";
import { useProjects } from "@/lib/hooks/use-projects";
import {
  useContracts,
  useCreateContract,
  useUpdateContract,
  useDeleteContract,
  useUpdateContractStatus,
  type ContractWithDetails,
  type ContractStatus,
} from "@/lib/hooks/use-contracts";
import { generateContractPdf } from "@/lib/pdf/contract-pdf";
import type { Database } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContractType = Database["public"]["Tables"]["contracts"]["Row"]["contract_type"];

const CONTRACT_TYPE_OPTIONS: { value: ContractType; label: string }[] = [
  { value: "design_development", label: "Design & Development" },
  { value: "seo_retainer", label: "SEO Retainer" },
  { value: "custom", label: "Custom" },
];

const CONTRACT_STATUS_OPTIONS: ContractStatus[] = [
  "draft",
  "sent",
  "signed",
  "active",
  "completed",
  "terminated",
];

const STATUS_FILTERS = ["All", "Draft", "Sent", "Signed", "Active", "Completed", "Terminated"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const STATUS_FILTER_MAP: Record<StatusFilter, ContractStatus | undefined> = {
  All: undefined,
  Draft: "draft",
  Sent: "sent",
  Signed: "signed",
  Active: "active",
  Completed: "completed",
  Terminated: "terminated",
};

const TYPE_BADGE: Record<ContractType, string> = {
  design_development: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  seo_retainer: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  custom: "text-teal-400 bg-teal-500/10 border-teal-500/20",
};

const TYPE_LABEL: Record<ContractType, string> = {
  design_development: "Design & Dev",
  seo_retainer: "SEO Retainer",
  custom: "Custom",
};

// ─── Key-value editor for contract_data ──────────────────────────────────────

interface KvEntry {
  id: string;
  label: string;
  value: string;
}

function KvEditor({
  entries,
  onChange,
}: {
  entries: KvEntry[];
  onChange: (entries: KvEntry[]) => void;
}) {
  function addEntry() {
    onChange([
      ...entries,
      { id: Date.now().toString(), label: "", value: "" },
    ]);
  }

  function removeEntry(id: string) {
    onChange(entries.filter((e) => e.id !== id));
  }

  function updateEntry(id: string, field: "label" | "value", val: string) {
    onChange(
      entries.map((e) => (e.id === id ? { ...e, [field]: val } : e))
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center gap-2">
          <input
            type="text"
            value={entry.label}
            onChange={(e) => updateEntry(entry.id, "label", e.target.value)}
            placeholder="Label (e.g. Project Timeline)"
            className="glass-input flex-1 text-xs py-2"
          />
          <input
            type="text"
            value={entry.value}
            onChange={(e) => updateEntry(entry.id, "value", e.target.value)}
            placeholder="Value (e.g. 60 working days)"
            className="glass-input flex-1 text-xs py-2"
          />
          <button
            type="button"
            onClick={() => removeEntry(entry.id)}
            className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addEntry}
        className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors mt-1"
      >
        <Plus className="w-3.5 h-3.5" />
        Add field
      </button>
    </div>
  );
}

// ─── Contract Modal ───────────────────────────────────────────────────────────

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingContract?: ContractWithDetails | null;
}

function ContractModal({ isOpen, onClose, editingContract }: ContractModalProps) {
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();

  const [title, setTitle] = useState(editingContract?.title ?? "");
  const [clientId, setClientId] = useState(editingContract?.client_id ?? "");
  const [projectId, setProjectId] = useState(editingContract?.project_id ?? "");
  const [contractType, setContractType] = useState<ContractType>(
    editingContract?.contract_type ?? "seo_retainer"
  );
  const [contractDate, setContractDate] = useState(
    editingContract?.contract_date ?? new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(editingContract?.notes ?? "");

  // Contract data as kv entries
  function initKvEntries(): KvEntry[] {
    if (!editingContract?.contract_data) return [];
    const data = editingContract.contract_data;
    if (typeof data !== "object" || Array.isArray(data) || data === null) return [];
    return Object.entries(data as Record<string, unknown>)
      .map(([k, v], i) => ({
        id: String(i),
        label: k,
        value: String(v ?? ""),
      }));
  }

  const [kvEntries, setKvEntries] = useState<KvEntry[]>(initKvEntries);

  const { data: projects = [] } = useProjects(clientId || undefined);

  function buildContractData(): Record<string, string> {
    const result: Record<string, string> = {};
    kvEntries.forEach((entry) => {
      if (entry.label.trim()) {
        result[entry.label.trim()] = entry.value.trim();
      }
    });
    return result;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !clientId) return;

    const payload = {
      title: title.trim(),
      client_id: clientId,
      project_id: projectId || null,
      contract_type: contractType,
      contract_date: contractDate || null,
      notes: notes.trim() || null,
      contract_data: buildContractData(),
      status: (editingContract?.status ?? "draft") as ContractStatus,
    };

    if (editingContract) {
      updateContract.mutate(
        { id: editingContract.id, data: payload },
        { onSuccess: onClose }
      );
    } else {
      createContract.mutate(payload, { onSuccess: onClose });
    }
  }

  if (!isOpen) return null;

  const isPending = createContract.isPending || updateContract.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto glass-card p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-text-primary">
            {editingContract ? "Edit Contract" : "New Contract"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Contract Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SEO Retainer Agreement - Client Name"
              className="glass-input"
            />
          </div>

          {/* Client */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Client *
            </label>
            <select
              required
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setProjectId(""); }}
              className="glass-input"
              disabled={clientsLoading}
            >
              <option value="">
                {clientsLoading ? "Loading..." : "Select client..."}
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>

          {/* Project - filtered by client */}
          {clientId && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Project (optional)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="glass-input"
              >
                <option value="">No project linked</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Contract Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Contract Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CONTRACT_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setContractType(opt.value)}
                  className={cn(
                    "px-3 py-2 rounded-card text-xs font-medium border transition-all",
                    contractType === opt.value
                      ? "border-accent bg-accent-muted text-accent"
                      : "border-black/[0.05] bg-surface-DEFAULT text-text-secondary hover:border-black/[0.08]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contract Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Contract Date
            </label>
            <input
              type="date"
              value={contractDate}
              onChange={(e) => setContractDate(e.target.value)}
              className="glass-input"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes..."
              className="glass-input resize-none"
            />
          </div>

          {/* Contract Data: key-value editor */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Contract Terms
            </label>
            <p className="text-xs text-text-muted mb-2">
              Add key-value fields for deliverables, payment terms, and custom clauses.
              Use &quot;deliverables&quot; and &quot;payment_terms&quot; as labels for dedicated PDF sections.
            </p>
            <GlassCard padding="sm">
              <KvEditor entries={kvEntries} onChange={setKvEntries} />
            </GlassCard>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-button text-sm font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:text-text-primary transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim() || !clientId}
              className="flex items-center gap-2 px-5 py-2.5 rounded-button text-sm font-semibold text-white disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editingContract ? "Save Changes" : "Create Contract"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Status Update Dropdown ───────────────────────────────────────────────────

function StatusDropdown({
  contract,
}: {
  contract: ContractWithDetails;
}) {
  const [open, setOpen] = useState(false);
  const updateStatus = useUpdateContractStatus();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-button text-xs font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] transition-all"
      >
        <span className="capitalize">{contract.status}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 glass-card py-1 min-w-[130px]">
          {CONTRACT_STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                updateStatus.mutate({ id: contract.id, status: s });
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs transition-colors capitalize",
                contract.status === s
                  ? "text-accent bg-accent/5 font-medium"
                  : "text-text-secondary hover:text-text-primary hover:bg-black/[0.03]"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Contract Card ────────────────────────────────────────────────────────────

function ContractCard({
  contract,
  onEdit,
}: {
  contract: ContractWithDetails;
  onEdit: (contract: ContractWithDetails) => void;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const deleteContract = useDeleteContract();

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const bytes = await generateContractPdf(contract);
      // Convert Uint8Array to ArrayBuffer for Blob compatibility
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${contract.title.replace(/\s+/g, "-")}-${contract.id.slice(0, 6)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently handle - toast is handled in the hook
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <GlassCard padding="md" className="group hover:border-black/[0.08] transition-all">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-surface-DEFAULT border border-black/[0.05] flex items-center justify-center shrink-0 group-hover:border-black/[0.08] transition-all">
          <FileText className="w-5 h-5 text-text-muted" />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-semibold text-text-primary leading-tight truncate">
              {contract.title}
            </p>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded border font-medium shrink-0",
                TYPE_BADGE[contract.contract_type]
              )}
            >
              {TYPE_LABEL[contract.contract_type]}
            </span>
            <StatusBadge status={contract.status} />
          </div>

          <p className="text-sm text-text-secondary mb-2">
            {contract.client.company_name}
            {contract.project && (
              <>
                <ChevronRight className="w-3 h-3 inline mx-0.5 text-text-muted" />
                {contract.project.name}
              </>
            )}
          </p>

          <div className="flex flex-wrap gap-4 text-xs text-text-muted">
            {contract.contract_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(contract.contract_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
            {contract.signed_date && (
              <span className="flex items-center gap-1.5 text-green-400">
                Signed:{" "}
                {new Date(contract.signed_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
            <span className="text-text-muted/60">
              {contract.client.currency}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 ml-2">
          {/* Status update */}
          <StatusDropdown contract={contract} />

          {/* Download PDF */}
          <button
            title="Download PDF"
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-2 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT border border-transparent hover:border-black/[0.05] transition-all disabled:opacity-40"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>

          {/* Edit */}
          <button
            title="Edit contract"
            onClick={() => onEdit(contract)}
            className="p-2 rounded-button text-text-muted hover:text-accent hover:bg-accent/5 border border-transparent hover:border-accent/20 transition-all"
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* Delete (draft only) */}
          {contract.status === "draft" && (
            <button
              title="Delete draft"
              onClick={() => {
                if (confirm("Delete this draft contract?")) {
                  deleteContract.mutate(contract.id);
                }
              }}
              className="p-2 rounded-button text-text-muted hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractWithDetails | null>(null);

  const { data: contracts = [], isLoading } = useContracts({
    status: STATUS_FILTER_MAP[statusFilter],
  });

  const filtered = contracts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.client.company_name.toLowerCase().includes(q) ||
      c.contract_type.toLowerCase().includes(q) ||
      (c.project?.name ?? "").toLowerCase().includes(q)
    );
  });

  function openNewModal() {
    setEditingContract(null);
    setModalOpen(true);
  }

  function openEditModal(contract: ContractWithDetails) {
    setEditingContract(contract);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingContract(null);
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Contracts"
          description="Service agreements and engagement letters"
          action={
            <button
              onClick={openNewModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
            >
              <FilePlus className="w-4 h-4" />
              New Contract
            </button>
          }
        />

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, client, or type..."
              className="glass-input pl-9"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setFilterOpen((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2 rounded-button text-sm text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] hover:text-text-primary transition-all whitespace-nowrap"
            >
              <span className="font-medium">
                {statusFilter === "All" ? "All Statuses" : statusFilter}
              </span>
              <ChevronDown
                className={cn("w-4 h-4 transition-transform", filterOpen && "rotate-180")}
              />
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-20 glass-card py-1.5 min-w-[150px]">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => { setStatusFilter(f); setFilterOpen(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm transition-colors",
                      statusFilter === f
                        ? "text-accent bg-accent/5 font-medium"
                        : "text-text-secondary hover:text-text-primary hover:bg-black/[0.03]"
                    )}
                  >
                    {f === "All" ? "All Statuses" : f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contract list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard padding="none">
            <EmptyState
              icon={FileText}
              title="No contracts found"
              description={
                search || statusFilter !== "All"
                  ? "Try adjusting your search or filter."
                  : "Create a contract to track service agreements with your clients."
              }
            />
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filtered.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                onEdit={openEditModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* New / Edit modal - key forces remount when editingContract changes so state initializes fresh */}
      <ContractModal
        key={editingContract?.id ?? "new"}
        isOpen={modalOpen}
        onClose={closeModal}
        editingContract={editingContract}
      />
    </>
  );
}
