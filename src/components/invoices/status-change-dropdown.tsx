"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";

interface StatusChangeDropdownProps {
  status: string;
  invoiceType?: string;
  onChange: (s: string) => void;
  onConvertProforma?: () => void;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent", "cancelled"],
  sent: ["paid", "overdue", "cancelled", "archived"],
  overdue: ["paid", "sent", "cancelled", "archived"],
  paid: [],
  cancelled: ["draft"],
  archived: ["draft"],
};

export function StatusChangeDropdown({
  status,
  invoiceType,
  onChange,
  onConvertProforma,
}: StatusChangeDropdownProps) {
  const [open, setOpen] = useState(false);

  if (invoiceType === "proforma") {
    if (status === "cancelled") {
      return <StatusBadge status={status as Parameters<typeof StatusBadge>[0]["status"]} />;
    }
    return (
      <div className="relative">
        <button onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} className="flex items-center gap-1 group/sd" title="Change status">
          <StatusBadge status={status as Parameters<typeof StatusBadge>[0]["status"]} />
          <ChevronDown className="w-3 h-3 text-text-muted opacity-0 group-hover/sd:opacity-100 transition-opacity" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
            <div className="absolute left-0 top-full mt-1 z-20 py-1.5 rounded-xl min-w-[140px]"
              style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}>
              <button
                onClick={(e) => { e.stopPropagation(); onConvertProforma?.(); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-green-600 font-medium hover:bg-green-50 transition-colors"
              >
                Record Payment
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onChange("cancelled"); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-black/[0.04] transition-colors text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  const options = STATUS_TRANSITIONS[status] ?? [];
  if (options.length === 0) return <StatusBadge status={status as Parameters<typeof StatusBadge>[0]["status"]} />;
  return (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} className="flex items-center gap-1 group/sd" title="Change status">
        <StatusBadge status={status as Parameters<typeof StatusBadge>[0]["status"]} />
        <ChevronDown className="w-3 h-3 text-text-muted opacity-0 group-hover/sd:opacity-100 transition-opacity" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="absolute left-0 top-full mt-1 z-20 py-1.5 rounded-xl min-w-[110px]"
            style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}>
            {options.map((s) => (
              <button key={s} onClick={(e) => { e.stopPropagation(); onChange(s); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs capitalize hover:bg-black/[0.04] transition-colors text-text-secondary hover:text-text-primary">
                {s === "paid" ? "Mark Paid" : s === "sent" ? "Mark Sent" : s === "overdue" ? "Mark Overdue" : s === "archived" ? "Archive" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
