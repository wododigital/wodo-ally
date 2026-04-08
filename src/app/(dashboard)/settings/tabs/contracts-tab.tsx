"use client";

import { useState, useEffect } from "react";
import { Edit2, Save, Check, ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { FieldLabel } from "./company-tab";
import { lsGetJson, lsSetJson } from "./company-tab";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types & Data
// ---------------------------------------------------------------------------

interface ContractTemplate {
  id: string;
  name: string;
  type: "design_development" | "seo_retainer" | "custom";
  body: string;
}

const CONTRACT_TYPE_LABELS: Record<ContractTemplate["type"], string> = {
  design_development: "Design & Development",
  seo_retainer: "SEO & Retainer",
  custom: "Custom",
};

const CONTRACT_TYPE_COLORS: Record<ContractTemplate["type"], string> = {
  design_development: "text-blue-500 bg-blue-500/[0.08] border-blue-500/20",
  seo_retainer: "text-purple-500 bg-purple-500/[0.08] border-purple-500/20",
  custom: "text-text-muted bg-surface-DEFAULT border-black/[0.08]",
};

const DEFAULT_CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "design_development",
    name: "Design & Development Project",
    type: "design_development",
    body: `DESIGN & DEVELOPMENT PROJECT CONTRACT

This Agreement is entered into as of {{date}} between WODO Digital Private Limited, having its registered office at #1, First Floor, Shree Lakshmi Arcade, BDA Layout, Nagarbhavi, Bangalore - 560091, Karnataka, India (hereinafter "Service Provider") and {{client_name}}, {{client_address}} (hereinafter "Client").

You, {{client_name}}, are hiring WODO Digital for {{services}} of {{project_name}} at an estimated cost of {{amount}} + 18% GST.

1. WORK AND PAYMENT

1.1 Project Deliverables
{{deliverables}}

1.2 Payment Terms
{{payment_terms}}

1.3 Project Timeline
{{timeline}}

2. OWNERSHIP
All work product, designs, code, content, and deliverables created under this Agreement shall become the exclusive property of the Client upon receipt of full payment.

3. CONFIDENTIALITY
Both parties agree to maintain strict confidentiality of all proprietary information.

4. TERM AND TERMINATION
a) This Agreement commences on {{start_date}} and continues until project completion or termination by either party with 30 days written notice.
b) The Client shall pay for all work completed up to the termination date.

5. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Karnataka, India.

WODO DIGITAL PRIVATE LIMITED          {{client_name}}

_______________________               _______________________
Authorized Signatory                  Authorized Signatory

Date: _______________                 Date: _______________`,
  },
  {
    id: "seo_retainer",
    name: "SEO & Digital Marketing Retainer",
    type: "seo_retainer",
    body: `SEO & DIGITAL MARKETING RETAINER CONTRACT

This Agreement is entered into as of {{date}} between WODO Digital Private Limited and {{client_name}}, {{client_address}}.

{{client_name}} is hiring WODO Digital for {{services}} at an estimated retainer cost of {{amount}} per month.

1. WORK AND PAYMENT
1.1 Monthly Deliverables: {{deliverables}}
1.2 Payment Terms: {{payment_terms}}
Minimum contract period: {{duration}} months.

2. REPORTING
Monthly reports covering performance metrics, rankings, and campaign updates.

3. TERM AND TERMINATION
a) Commences on {{start_date}} for minimum {{duration}} months.
b) After minimum period, either party may terminate with 30 days written notice.

4. GOVERNING LAW
Governed by the laws of the State of Karnataka, India.

WODO DIGITAL PRIVATE LIMITED          {{client_name}}

_______________________               _______________________
Authorized Signatory                  Authorized Signatory

Date: _______________                 Date: _______________`,
  },
  {
    id: "general_services",
    name: "General Services Agreement",
    type: "custom",
    body: `GENERAL SERVICES AGREEMENT

This Agreement is entered into as of {{date}} between WODO Digital Private Limited and {{client_name}}, {{client_address}}.

1. SCOPE OF SERVICES: {{services}}
2. FEES AND PAYMENT: {{amount}} - {{payment_terms}}
3. INTELLECTUAL PROPERTY: All deliverables become Client property upon full payment.
4. CONFIDENTIALITY: Both parties agree to maintain strict confidentiality.
5. TERM AND TERMINATION: Commences on {{start_date}}, terminable with 30 days notice.
6. GOVERNING LAW: Karnataka, India.

WODO DIGITAL PRIVATE LIMITED          {{client_name}}

_______________________               _______________________
Authorized Signatory                  Authorized Signatory

Date: _______________                 Date: _______________`,
  },
  {
    id: "branding_creative",
    name: "Branding & Creative Project",
    type: "design_development",
    body: `BRANDING & CREATIVE PROJECT CONTRACT

This Agreement is entered into as of {{date}} between WODO Digital Private Limited and {{client_name}}, {{client_address}}.

You, {{client_name}}, are hiring WODO Digital for branding and creative services for {{project_name}} at an estimated cost of {{amount}}.

1. CREATIVE DELIVERABLES: {{deliverables}}
2. PAYMENT SCHEDULE: {{payment_terms}}
3. TIMELINE: {{timeline}}
4. REVISIONS: {{revision_rounds}} rounds included per deliverable.
5. OWNERSHIP: Upon full payment, all creative work becomes Client property.
6. GOVERNING LAW: Karnataka, India.

WODO DIGITAL PRIVATE LIMITED          {{client_name}}

_______________________               _______________________
Authorized Signatory                  Authorized Signatory

Date: _______________                 Date: _______________`,
  },
];

// ---------------------------------------------------------------------------
// Tab: Contract Templates
// ---------------------------------------------------------------------------

export function ContractsTab() {
  const [templates, setTemplates] = useState<ContractTemplate[]>(DEFAULT_CONTRACT_TEMPLATES);
  const [editing, setEditing] = useState<ContractTemplate | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<ContractTemplate["type"]>("custom");
  const [editBody, setEditBody] = useState("");
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<ContractTemplate["type"]>("custom");

  useEffect(() => {
    const stored = lsGetJson<ContractTemplate[]>("wodo_contract_templates", DEFAULT_CONTRACT_TEMPLATES);
    setTemplates(stored);
  }, []);

  function openEdit(tpl: ContractTemplate) {
    setEditing(tpl);
    setEditName(tpl.name);
    setEditType(tpl.type);
    setEditBody(tpl.body);
  }

  function saveEdit() {
    if (!editing) return;
    const updated = templates.map((t) =>
      t.id === editing.id ? { ...t, name: editName, type: editType, body: editBody } : t
    );
    setTemplates(updated);
    lsSetJson("wodo_contract_templates", updated);
    setEditing(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function deleteTemplate(id: string) {
    if (!confirm("Delete this contract template?")) return;
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    lsSetJson("wodo_contract_templates", updated);
  }

  function addTemplate() {
    if (!newName.trim()) return;
    const id = `custom_${Date.now()}`;
    const newTpl: ContractTemplate = {
      id,
      name: newName.trim(),
      type: newType,
      body: DEFAULT_CONTRACT_TEMPLATES.find((t) => t.type === newType)?.body ?? DEFAULT_CONTRACT_TEMPLATES[2].body,
    };
    const updated = [...templates, newTpl];
    setTemplates(updated);
    lsSetJson("wodo_contract_templates", updated);
    setShowAddModal(false);
    setNewName("");
    setNewType("custom");
    openEdit(newTpl);
  }

  function handleReset() {
    if (confirm("Reset all templates to defaults? Your changes will be lost.")) {
      setTemplates(DEFAULT_CONTRACT_TEMPLATES);
      lsSetJson("wodo_contract_templates", DEFAULT_CONTRACT_TEMPLATES);
    }
  }

  const VARIABLES = [
    "{{date}}", "{{client_name}}", "{{client_address}}", "{{project_name}}",
    "{{services}}", "{{deliverables}}", "{{payment_terms}}", "{{amount}}",
    "{{start_date}}", "{{duration}}", "{{timeline}}", "{{engagement_type}}",
    "{{billing_day}}", "{{revision_rounds}}", "{{ad_spend_terms}}",
  ];

  return (
    <div className="space-y-4">
      <GlassCard padding="lg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Contract Templates</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Deliverable-based templates you can choose when sharing contracts with clients for signing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-button text-xs font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] hover:text-text-primary transition-all"
            >
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Template
            </button>
          </div>
        </div>

        <div className="mt-4 mb-4 flex flex-wrap gap-1.5">
          <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider mr-1">Variables:</span>
          {VARIABLES.slice(0, 8).map((v) => (
            <code key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
              {v}
            </code>
          ))}
          <span className="text-[10px] text-text-muted self-center">+{VARIABLES.length - 8} more in editor</span>
        </div>

        <div className="divide-y divide-black/[0.05]">
          {templates.map((tpl) => (
            <div key={tpl.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === tpl.id ? null : tpl.id)}
                  className="flex items-center gap-2.5 text-left group flex-1 min-w-0"
                >
                  <span className={cn("text-[10px] px-2 py-0.5 rounded border font-medium shrink-0", CONTRACT_TYPE_COLORS[tpl.type])}>
                    {CONTRACT_TYPE_LABELS[tpl.type]}
                  </span>
                  <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                    {tpl.name}
                  </span>
                  {expanded === tpl.id ? (
                    <ChevronUp className="w-4 h-4 text-text-muted shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
                  )}
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(tpl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] hover:text-text-primary transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  {!DEFAULT_CONTRACT_TEMPLATES.find((d) => d.id === tpl.id) && (
                    <button
                      onClick={() => deleteTemplate(tpl.id)}
                      className="p-1.5 rounded-button text-text-muted hover:text-red-500 hover:bg-red-500/[0.06] transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {expanded === tpl.id && (
                <div className="mt-3 pl-0">
                  <div
                    className="tiptap text-xs text-text-secondary bg-surface-DEFAULT px-3 py-3 rounded-xl border border-black/[0.05] leading-relaxed max-h-48 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: tpl.body }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Edit template modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-card shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Edit Contract Template</h3>
                <p className="text-xs text-text-muted mt-0.5">Customise this template. Variables in {"{{double braces}}"} are replaced automatically.</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <FieldLabel>Template Name</FieldLabel>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="glass-input"
                    placeholder="e.g. Design & Development Project"
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Contract Type</FieldLabel>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as ContractTemplate["type"])}
                    className="glass-input"
                  >
                    <option value="design_development">Design & Development</option>
                    <option value="seo_retainer">SEO & Retainer</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Contract Body</FieldLabel>
                <RichTextEditor
                  value={editBody}
                  onChange={setEditBody}
                  placeholder="Write your contract body here..."
                  variables={VARIABLES}
                  minHeight={360}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end px-6 py-4 border-t border-black/[0.06] shrink-0">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-button text-sm text-text-secondary hover:text-text-primary border border-black/[0.05] bg-surface-DEFAULT transition-all">
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="flex items-center gap-2 px-5 py-2 rounded-button text-sm font-semibold text-white transition-all"
                style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
              >
                <Save className="w-3.5 h-3.5" />
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add template modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-card shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">New Contract Template</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1.5 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <FieldLabel>Template Name</FieldLabel>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="glass-input"
                  placeholder="e.g. E-Commerce Project"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Start From</FieldLabel>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ContractTemplate["type"])}
                  className="glass-input"
                >
                  <option value="design_development">Design & Development template</option>
                  <option value="seo_retainer">SEO & Retainer template</option>
                  <option value="custom">General Services template</option>
                </select>
                <p className="text-xs text-text-muted">The new template will be pre-filled from the selected base.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end pt-1">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-button text-sm text-text-secondary hover:text-text-primary border border-black/[0.05] bg-surface-DEFAULT transition-all">
                Cancel
              </button>
              <button
                type="button"
                onClick={addTemplate}
                disabled={!newName.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
              >
                <Plus className="w-3.5 h-3.5" />
                Create & Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
