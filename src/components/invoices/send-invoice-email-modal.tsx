"use client";

import { useState } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

interface SendInvoiceEmailModalProps {
  isOpen: boolean;
  invoiceId: string;
  type: "invoice" | "reminder" | "followup";
  onClose: () => void;
  onSent?: () => void;
  clientEmail?: string;
}

const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  invoice: {
    subject: "Invoice: Payment Due",
    body: "Dear Client,\n\nPlease find attached the invoice for services rendered.\n\nKindly process the payment at your earliest convenience.\n\nThank you!",
  },
  reminder: {
    subject: "Invoice Reminder",
    body: "Dear Client,\n\nThis is a friendly reminder about the pending invoice attached below.\n\nPlease arrange for the payment at your earliest convenience.\n\nThank you!",
  },
  followup: {
    subject: "Follow-up: Payment Outstanding",
    body: "Dear Client,\n\nWe notice that the invoice remains outstanding. Please prioritize the payment.\n\nIf you have any questions, please don't hesitate to contact us.\n\nThank you!",
  },
};

const MODAL_TITLES: Record<string, string> = {
  invoice: "Send Invoice",
  reminder: "Send Reminder",
  followup: "Send Follow-up",
};

export function SendInvoiceEmailModal({
  isOpen,
  invoiceId,
  type,
  onClose,
  onSent,
  clientEmail = "",
}: SendInvoiceEmailModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [toEmail, setToEmail] = useState(clientEmail);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");
  const [subject, setSubject] = useState(EMAIL_TEMPLATES[type]?.subject || "");
  const [body, setBody] = useState(EMAIL_TEMPLATES[type]?.body || "");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const template = EMAIL_TEMPLATES[type];

  function addCcEmail() {
    const trimmed = ccInput.trim();
    if (!trimmed) {
      setError("Please enter an email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address");
      return;
    }
    if (ccEmails.includes(trimmed)) {
      setError("This email is already added");
      return;
    }
    setCcEmails([...ccEmails, trimmed]);
    setCcInput("");
    setError("");
  }

  function removeCcEmail(email: string) {
    setCcEmails(ccEmails.filter((e) => e !== email));
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!toEmail.trim()) {
      setError("Recipient email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      setError("Please enter a valid recipient email");
      return;
    }
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          to: toEmail,
          cc: ccEmails,
          subject: subject.trim(),
          body: body.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || `Failed to send email (${response.status})`);
      }

      toast.success("Email sent successfully");
      onSent?.();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send email";
      setError(message);
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06] sticky top-0 bg-white/80 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{MODAL_TITLES[type]}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Send {type} email to client</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSend} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm text-red-500 border border-red-500/20 bg-red-500/[0.06]">
              {error}
            </div>
          )}

          {/* To Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Recipient Email *
            </label>
            <input
              type="email"
              required
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              className="glass-input w-full"
              placeholder="client@example.com"
            />
          </div>

          {/* CC Emails */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              CC (Optional)
            </label>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <input
                  type="email"
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCcEmail();
                    }
                  }}
                  className="glass-input w-full"
                  placeholder="another@example.com"
                />
              </div>
              <button
                type="button"
                onClick={addCcEmail}
                className="p-2.5 rounded-button border border-black/[0.06] hover:bg-black/[0.03] transition-colors text-text-secondary hover:text-text-primary"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {ccEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {ccEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-muted border border-accent-light text-xs text-accent"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeCcEmail(email)}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Subject *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="glass-input w-full"
              placeholder="Email subject"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Message *
            </label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="glass-input w-full resize-none font-sans text-sm"
              placeholder="Email message body"
            />
            <p className="text-xs text-gray-500">
              {body.length} characters
            </p>
          </div>

          {/* Template Info */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-600">
              <strong>Tip:</strong> Edit the subject and message as needed. Default template has been pre-filled.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-black/[0.05] sticky bottom-0 bg-white/80 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-button text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-70",
              "hover:opacity-90"
            )}
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            {isSending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isSending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}
