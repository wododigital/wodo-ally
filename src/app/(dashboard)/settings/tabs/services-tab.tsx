"use client";

import { useState } from "react";
import { Edit2, Plus, Trash2, X, Loader2 } from "lucide-react";
import {
  useAllServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "@/lib/hooks/use-services";
import { GlassCard } from "@/components/shared/glass-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FieldLabel } from "./company-tab";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRESET_COLORS = [
  "#fd7e14", "#f59e0b", "#22c55e", "#3b82f6",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
  "#f97316", "#6366f1", "#ef4444", "#9ca3af",
];

// ---------------------------------------------------------------------------
// Tab: Services
// ---------------------------------------------------------------------------

export function ServicesTab() {
  const { data: services = [], isLoading } = useAllServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [adding,       setAdding]       = useState(false);
  const [editingSvc,   setEditingSvc]   = useState<typeof services[0] | null>(null);
  const [newName,      setNewName]      = useState("");
  const [newDesc,      setNewDesc]      = useState("");
  const [newHsn,       setNewHsn]       = useState("");
  const [newColor,     setNewColor]     = useState(PRESET_COLORS[0]);
  const [confirmSvcId, setConfirmSvcId] = useState<string | null>(null);
  const confirmSvc = services.find((s) => s.id === confirmSvcId) ?? null;

  // Edit form state
  const [editName,  setEditName]  = useState("");
  const [editDesc,  setEditDesc]  = useState("");
  const [editHsn,   setEditHsn]   = useState("");
  const [editColor, setEditColor] = useState(PRESET_COLORS[0]);

  function openEdit(svc: typeof services[0]) {
    setEditingSvc(svc);
    setEditName(svc.name);
    setEditDesc(svc.description ?? "");
    setEditHsn(svc.hsn_code ?? "");
    setEditColor(svc.color ?? PRESET_COLORS[0]);
  }

  function handleAdd() {
    if (!newName.trim()) return;
    createService.mutate(
      {
        name: newName.trim(),
        description: newDesc.trim() || null,
        hsn_code: newHsn.trim() || null,
        color: newColor,
        is_active: true,
      },
      {
        onSuccess: () => {
          setNewName(""); setNewDesc(""); setNewHsn(""); setNewColor(PRESET_COLORS[0]); setAdding(false);
        },
      }
    );
  }

  function handleEditSave() {
    if (!editingSvc || !editName.trim()) return;
    updateService.mutate(
      {
        id: editingSvc.id,
        data: {
          name: editName.trim(),
          description: editDesc.trim() || null,
          hsn_code: editHsn.trim() || null,
          color: editColor,
        },
      },
      { onSuccess: () => setEditingSvc(null) }
    );
  }

  function closeAddModal() {
    setAdding(false); setNewName(""); setNewDesc(""); setNewHsn(""); setNewColor(PRESET_COLORS[0]);
  }

  return (
    <div className="space-y-4">
      <GlassCard padding="lg">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Service Catalogue</h3>
            <p className="text-xs text-text-muted mt-0.5">Available in invoice line items and project setup</p>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-button text-xs font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Service
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-black/[0.04] animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">No services yet. Add your first service above.</p>
        ) : (
          <div className="divide-y divide-black/[0.05]">
            {services.map((svc) => (
              <div key={svc.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                <div
                  className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                  style={{ background: svc.color ?? "#fd7e14" }}
                >
                  {svc.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn("text-sm font-medium", svc.is_active ? "text-text-primary" : "text-text-muted line-through")}>
                      {svc.name}
                    </p>
                    {svc.hsn_code && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        HSN {svc.hsn_code}
                      </span>
                    )}
                  </div>
                  {svc.description && (
                    <p className="text-xs text-text-muted mt-0.5 truncate">{svc.description}</p>
                  )}
                </div>

                {/* Edit */}
                <button
                  onClick={() => openEdit(svc)}
                  title="Edit service"
                  className="p-1.5 rounded-button text-text-muted hover:text-accent hover:bg-accent/[0.08] transition-all shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Active toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={svc.is_active}
                  onClick={() => updateService.mutate({ id: svc.id, data: { is_active: !svc.is_active } })}
                  disabled={updateService.isPending}
                  className={cn(
                    "relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 focus:outline-none disabled:opacity-60",
                    svc.is_active ? "bg-accent" : "bg-black/[0.10]"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                      svc.is_active ? "right-0.5" : "left-0.5"
                    )}
                  />
                </button>

                {/* Delete */}
                <button
                  onClick={() => setConfirmSvcId(svc.id)}
                  disabled={deleteService.isPending}
                  title="Delete service"
                  className="p-1.5 rounded-button text-text-muted hover:text-red-400 hover:bg-red-400/[0.08] transition-all shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmSvcId !== null}
        onOpenChange={(open) => { if (!open) setConfirmSvcId(null); }}
        title="Delete Service"
        description={confirmSvc ? `Are you sure you want to delete "${confirmSvc.name}"? This cannot be undone.` : ""}
        confirmLabel="Delete"
        loading={deleteService.isPending}
        onConfirm={() => {
          if (!confirmSvcId) return;
          deleteService.mutate(confirmSvcId, { onSuccess: () => setConfirmSvcId(null) });
        }}
      />

      {/* Add service modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeAddModal} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-card shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-text-primary">New Service</h3>
              <button type="button" onClick={closeAddModal} className="p-1.5 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <FieldLabel>Service Name *</FieldLabel>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="e.g. Performance Marketing"
                  className="glass-input"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Description</FieldLabel>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Short description (optional)"
                  className="glass-input"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>HSN / SAC Code</FieldLabel>
                <input
                  type="text"
                  value={newHsn}
                  onChange={(e) => setNewHsn(e.target.value)}
                  placeholder="e.g. 998314"
                  className="glass-input font-sans"
                />
                <p className="text-[10px] text-text-muted">Design & Development: 998314 | Marketing & SEO: 998313</p>
              </div>
              <div className="space-y-2">
                <FieldLabel>Colour</FieldLabel>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all duration-150",
                        newColor === c ? "ring-2 ring-offset-2 ring-black/20 scale-110" : "opacity-60 hover:opacity-100 hover:scale-105"
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end pt-1">
                <button type="button" onClick={closeAddModal} className="px-4 py-2 rounded-button text-sm text-text-secondary hover:text-text-primary border border-black/[0.05] bg-surface-DEFAULT transition-all">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!newName.trim() || createService.isPending}
                  className="flex items-center gap-2 px-5 py-2 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                >
                  {createService.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Add Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit service modal */}
      {editingSvc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditingSvc(null)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-card shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-text-primary">Edit Service</h3>
              <button type="button" onClick={() => setEditingSvc(null)} className="p-1.5 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <FieldLabel>Service Name *</FieldLabel>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="glass-input"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Description</FieldLabel>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Short description (optional)"
                  className="glass-input"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>HSN / SAC Code</FieldLabel>
                <input
                  type="text"
                  value={editHsn}
                  onChange={(e) => setEditHsn(e.target.value)}
                  placeholder="e.g. 998314"
                  className="glass-input font-sans"
                />
                <p className="text-[10px] text-text-muted">Design & Development: 998314 | Marketing & SEO: 998313</p>
              </div>
              <div className="space-y-2">
                <FieldLabel>Colour</FieldLabel>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all duration-150",
                        editColor === c ? "ring-2 ring-offset-2 ring-black/20 scale-110" : "opacity-60 hover:opacity-100 hover:scale-105"
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end pt-1">
                <button type="button" onClick={() => setEditingSvc(null)} className="px-4 py-2 rounded-button text-sm text-text-secondary hover:text-text-primary border border-black/[0.05] bg-surface-DEFAULT transition-all">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={!editName.trim() || updateService.isPending}
                  className="flex items-center gap-2 px-5 py-2 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                >
                  {updateService.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
