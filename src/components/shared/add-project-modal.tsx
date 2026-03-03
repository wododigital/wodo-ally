"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useClients } from "@/lib/hooks/use-clients";
import { useCreateProject } from "@/lib/hooks/use-projects";
import type { Database } from "@/types/database";

type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];

const PROJECT_TYPES = [
  { value: "seo",               label: "SEO" },
  { value: "web_development",   label: "Web Development" },
  { value: "branding",          label: "Branding" },
  { value: "ui_ux_design",      label: "UI/UX Design" },
  { value: "google_ads",        label: "Google Ads" },
  { value: "social_media",      label: "Social Media" },
  { value: "gmb",               label: "GMB" },
  { value: "content_marketing", label: "Content Marketing" },
  { value: "full_service",      label: "Full Service" },
  { value: "other",             label: "Other" },
] as const;

interface AddProjectModalProps {
  onClose: () => void;
  preselectedClientId?: string;
}

export function AddProjectModal({ onClose, preselectedClientId }: AddProjectModalProps) {
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const createProject = useCreateProject();

  const [engagementType, setEngagementType] = useState<"retainer" | "one_time">("retainer");
  const [projectType, setProjectType] = useState<ProjectInsert["project_type"]>("seo");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const data = new FormData(form);

    const clientId = (data.get("client_id") as string).trim();
    const name = (data.get("name") as string).trim();
    const startDate = data.get("start_date") as string;
    const endDate = data.get("end_date") as string;
    const retainerAmountStr = data.get("retainer_amount") as string;
    const totalValueStr = data.get("total_value") as string;
    const retainerCurrency = (data.get("retainer_currency") as string) || "INR";
    const notes = (data.get("notes") as string)?.trim() || null;

    if (!clientId) { setError("Please select a client."); return; }
    if (!name) { setError("Project name is required."); return; }

    const payload: ProjectInsert = {
      client_id: clientId,
      name,
      project_type: projectType,
      engagement_type: engagementType,
      status: "onboarding",
      progress_pct: 0,
      contract_start_date: startDate || null,
      contract_end_date: endDate || null,
      retainer_amount: engagementType === "retainer" && retainerAmountStr ? parseFloat(retainerAmountStr) : null,
      retainer_currency: engagementType === "retainer" ? retainerCurrency : null,
      total_value: engagementType === "one_time" && totalValueStr ? parseFloat(totalValueStr) : null,
      notes,
    };

    createProject.mutate(payload, { onSuccess: () => onClose() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06]">
          <div>
            <h2 className="text-lg font-bold text-gray-900">New Project</h2>
            <p className="text-sm text-gray-500 mt-0.5">Set up a new project engagement</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="p-6 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm text-red-500 border border-red-500/20 bg-red-500/[0.06]">
              {error}
            </div>
          )}

          {/* Client + Name + Type */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Project Details</h3>
            <div className="grid grid-cols-2 gap-3">
              {!preselectedClientId && (
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-gray-500">Client *</label>
                  <select name="client_id" className="glass-input" required disabled={clientsLoading} defaultValue="">
                    <option value="">{clientsLoading ? "Loading..." : "Select client..."}</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.display_name ?? c.company_name}</option>
                    ))}
                  </select>
                </div>
              )}
              {preselectedClientId && (
                <input type="hidden" name="client_id" value={preselectedClientId} />
              )}

              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-gray-500">Project Name *</label>
                <input name="name" type="text" required className="glass-input" placeholder="e.g. SEO Retainer - Mar 2026" />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-gray-500">Project Type</label>
                <select className="glass-input" value={projectType} onChange={(e) => setProjectType(e.target.value as ProjectInsert["project_type"])}>
                  {PROJECT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Engagement type */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Engagement Type</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {([
                { value: "retainer", label: "Retainer",  desc: "Recurring monthly" },
                { value: "one_time", label: "One-Time",  desc: "Fixed scope" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEngagementType(opt.value)}
                  className={cn(
                    "p-3 rounded-xl text-left border transition-all duration-150",
                    engagementType === opt.value
                      ? "border-accent bg-accent-muted"
                      : "border-black/[0.06] bg-gray-50 hover:border-black/[0.10]"
                  )}
                >
                  <p className={cn("text-sm font-medium", engagementType === opt.value ? "text-accent" : "text-gray-800")}>{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {engagementType === "retainer" ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Monthly Amount</label>
                    <input name="retainer_amount" type="number" min="0" step="0.01" className="glass-input font-sans" placeholder="50000" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Currency</label>
                    <select name="retainer_currency" className="glass-input">
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="AED">AED</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-gray-500">Total Project Value</label>
                  <input name="total_value" type="number" min="0" step="0.01" className="glass-input font-sans" placeholder="200000" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Start Date</label>
                <input name="start_date" type="date" className="glass-input" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">End Date</label>
                <input name="end_date" type="date" className="glass-input" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Notes (optional)</label>
            <textarea name="notes" rows={2} className="glass-input resize-none w-full" placeholder="Scope, deliverables..." />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-black/[0.05]">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-button text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
            >
              {createProject.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {createProject.isPending ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
