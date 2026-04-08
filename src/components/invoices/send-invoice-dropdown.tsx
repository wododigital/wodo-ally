"use client";

import { useState } from "react";
import { Send, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SendInvoiceDropdownProps {
  invoiceStatus: string;
  invoiceId: string;
  onSendClick: (type: "invoice" | "reminder" | "followup") => void;
  isLoading?: boolean;
}

export function SendInvoiceDropdown({
  invoiceStatus,
  invoiceId,
  onSendClick,
  isLoading = false,
}: SendInvoiceDropdownProps) {
  const [open, setOpen] = useState(false);

  // Determine which send options are available based on status
  const getOptions = () => {
    switch (invoiceStatus) {
      case "draft":
        return [{ type: "invoice" as const, label: "Send Invoice" }];
      case "sent":
      case "viewed":
        return [
          { type: "invoice" as const, label: "Send Invoice" },
          { type: "reminder" as const, label: "Send Reminder" },
        ];
      case "overdue":
        return [
          { type: "invoice" as const, label: "Send Invoice" },
          { type: "reminder" as const, label: "Send Reminder" },
          { type: "followup" as const, label: "Send Follow-up" },
        ];
      case "paid":
      case "cancelled":
      case "archived":
      default:
        return [];
    }
  };

  const options = getOptions();
  if (options.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-button text-xs font-semibold transition-all",
          isLoading
            ? "opacity-70 cursor-not-allowed"
            : "text-white hover:opacity-90"
        )}
        style={{ background: "rgba(253,126,20,0.85)" }}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Send className="w-3.5 h-3.5" />
        )}
        <span>Send</span>
        {options.length > 1 && <ChevronDown className="w-3 h-3" />}
      </button>

      {open && options.length > 1 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 z-20 py-1 rounded-xl min-w-[160px]"
            style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
          >
            {options.map((opt) => (
              <button
                key={opt.type}
                onClick={() => {
                  onSendClick(opt.type);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-black/[0.04] transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}

      {options.length === 1 && (
        <div className="relative">
          {open && (
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          )}
        </div>
      )}
    </div>
  );
}
