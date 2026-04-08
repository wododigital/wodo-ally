"use client";

import { useState, useEffect } from "react";
import { Edit2, Save, Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { FieldLabel } from "./company-tab";
import { lsGetJson, lsSetJson } from "./company-tab";

// ---------------------------------------------------------------------------
// Types & Data
// ---------------------------------------------------------------------------

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "invoice_sent",
    name: "Invoice Sent",
    subject: "Invoice {{invoice_number}} from WODO Digital",
    body: `Hi {{client_name}},

Please find attached your invoice {{invoice_number}} for {{amount}} dated {{invoice_date}}.

Payment is due by {{due_date}}.

You can make payment via the bank details mentioned on the invoice.

Thank you for your business!

Best regards,
WODO Digital Private Limited
accounts@wodo.digital | +91 63621 80633`,
  },
  {
    id: "payment_reminder",
    name: "Payment Reminder",
    subject: "Reminder: Invoice {{invoice_number}} due on {{due_date}}",
    body: `Hi {{client_name}},

This is a friendly reminder that invoice {{invoice_number}} for {{amount}} is due on {{due_date}}.

Please process payment at your earliest convenience. If you have already made the payment, please disregard this email.

Best regards,
WODO Digital Private Limited
accounts@wodo.digital`,
  },
  {
    id: "payment_received",
    name: "Payment Received",
    subject: "Payment Received - Invoice {{invoice_number}}",
    body: `Hi {{client_name}},

We have received your payment of {{amount}} for invoice {{invoice_number}}. Thank you!

This email serves as confirmation of your payment. A receipt will be sent separately if applicable.

Best regards,
WODO Digital Private Limited
accounts@wodo.digital`,
  },
  {
    id: "payment_overdue",
    name: "Payment Overdue",
    subject: "OVERDUE: Invoice {{invoice_number}} - {{days_overdue}} days past due",
    body: `Hi {{client_name}},

Your invoice {{invoice_number}} for {{amount}} was due on {{due_date}} and is now {{days_overdue}} days overdue.

Please make payment immediately to avoid late payment charges of 2% per month.

If you have any questions or require a payment plan, please contact us at accounts@wodo.digital.

Best regards,
WODO Digital Private Limited
accounts@wodo.digital | +91 63621 80633`,
  },
  {
    id: "contract_sent",
    name: "Contract Sent",
    subject: "Project Contract - {{project_name}} | WODO Digital",
    body: `Hi {{client_name}},

We are excited to move forward with {{project_name}}!

Please find attached the project contract for your review. The agreement covers the scope of work, deliverables, payment terms, and timeline as discussed.

Kindly review, sign, and return the contract at your earliest convenience so we can begin work.

If you have any questions or need any clarification, feel free to reach out.

Best regards,
WODO Digital Private Limited
accounts@wodo.digital | +91 63621 80633`,
  },
  {
    id: "contract_reminder",
    name: "Contract Reminder",
    subject: "Reminder: Project Contract Pending - {{project_name}}",
    body: `Hi {{client_name}},

This is a gentle reminder that the project contract for {{project_name}} sent on {{contract_date}} is still pending your signature.

Once the signed contract is received, we can proceed with the project kick-off immediately.

Please sign and return the contract at your earliest convenience. If you have any questions or concerns, do not hesitate to reach out.

Best regards,
WODO Digital Private Limited
accounts@wodo.digital | +91 63621 80633`,
  },
  {
    id: "contract_receipt",
    name: "Contract Receipt",
    subject: "Contract Received - {{project_name}} | WODO Digital",
    body: `Hi {{client_name}},

Thank you! We have received the signed contract for {{project_name}}.

We are now ready to kick off the project. Our team will reach out shortly to schedule an onboarding call and share the project plan.

We look forward to building something great together!

Best regards,
WODO Digital Private Limited
accounts@wodo.digital | +91 63621 80633`,
  },
];

// ---------------------------------------------------------------------------
// Tab: Email Templates
// ---------------------------------------------------------------------------

export function EmailTemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_EMAIL_TEMPLATES);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const stored = lsGetJson<EmailTemplate[]>("wodo_email_templates", DEFAULT_EMAIL_TEMPLATES);
    setTemplates(stored);
  }, []);

  function openEdit(tpl: EmailTemplate) {
    setEditing(tpl);
    setEditSubject(tpl.subject);
    setEditBody(tpl.body);
  }

  function saveEdit() {
    if (!editing) return;
    const updated = templates.map((t) =>
      t.id === editing.id ? { ...t, subject: editSubject, body: editBody } : t
    );
    setTemplates(updated);
    lsSetJson("wodo_email_templates", updated);
    setEditing(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const VARIABLES = [
    "{{client_name}}", "{{invoice_number}}", "{{amount}}", "{{invoice_date}}",
    "{{due_date}}", "{{days_overdue}}", "{{project_name}}", "{{contract_date}}",
  ];

  return (
    <div className="space-y-4">
      <GlassCard padding="lg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Email Templates</h3>
            <p className="text-xs text-text-muted mt-0.5">Customise emails sent to clients at each stage</p>
          </div>
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        <div className="mt-4 mb-3 flex flex-wrap gap-1.5">
          <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider mr-1">Variables:</span>
          {VARIABLES.map((v) => (
            <code key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
              {v}
            </code>
          ))}
        </div>

        <div className="divide-y divide-black/[0.05]">
          {templates.map((tpl) => (
            <div key={tpl.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === tpl.id ? null : tpl.id)}
                  className="flex items-center gap-2 text-left group"
                >
                  <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                    {tpl.name}
                  </span>
                  {expanded === tpl.id ? (
                    <ChevronUp className="w-4 h-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  )}
                </button>
                <button
                  onClick={() => openEdit(tpl)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] hover:text-text-primary transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              {expanded === tpl.id && (
                <div className="mt-3 space-y-2 pl-0">
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Subject</p>
                    <p className="text-xs text-text-secondary bg-surface-DEFAULT px-3 py-2 rounded-button border border-black/[0.05]">
                      {tpl.subject}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Body Preview</p>
                    <div
                      className="tiptap text-xs text-text-secondary bg-surface-DEFAULT px-3 py-2 rounded-xl border border-black/[0.05] leading-relaxed max-h-40 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: tpl.body }}
                    />
                  </div>
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
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-card shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{editing.name}</h3>
                <p className="text-xs text-text-muted mt-0.5">Edit the subject and body for this email template</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <FieldLabel>Subject</FieldLabel>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Body</FieldLabel>
                <RichTextEditor
                  value={editBody}
                  onChange={setEditBody}
                  placeholder="Write your email body here..."
                  variables={VARIABLES}
                  minHeight={280}
                />
              </div>
              <div className="flex items-center gap-3 justify-end pt-1">
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
        </div>
      )}
    </div>
  );
}
