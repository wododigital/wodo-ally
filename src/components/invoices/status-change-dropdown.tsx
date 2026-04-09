"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  partially_paid: ["paid", "overdue", "cancelled"],
  paid: [],
  cancelled: ["draft"],
  archived: ["draft"],
};

function getOptionLabel(s: string): string {
  if (s === "paid") return "Mark Paid";
  if (s === "sent") return "Mark Sent";
  if (s === "overdue") return "Mark Overdue";
  if (s === "archived") return "Archive";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function StatusChangeDropdown({
  status,
  invoiceType,
  onChange,
  onConvertProforma,
}: StatusChangeDropdownProps) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
          setFocusIndex(0);
        }
        return;
      }

      const items = listRef.current?.querySelectorAll("[role='option']");
      const count = items?.length ?? 0;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          setFocusIndex(-1);
          triggerRef.current?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          e.stopPropagation();
          setFocusIndex((prev) => (prev + 1) % count);
          break;
        case "ArrowUp":
          e.preventDefault();
          e.stopPropagation();
          setFocusIndex((prev) => (prev - 1 + count) % count);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          e.stopPropagation();
          if (focusIndex >= 0 && items && items[focusIndex]) {
            (items[focusIndex] as HTMLButtonElement).click();
          }
          break;
        case "Tab":
          setOpen(false);
          setFocusIndex(-1);
          break;
      }
    },
    [open, focusIndex]
  );

  // Auto-focus the active item when focusIndex changes
  useEffect(() => {
    if (!open || focusIndex < 0) return;
    const items = listRef.current?.querySelectorAll("[role='option']");
    if (items && items[focusIndex]) {
      (items[focusIndex] as HTMLElement).focus();
    }
  }, [open, focusIndex]);

  if (invoiceType === "proforma") {
    if (status === "cancelled") {
      return <StatusBadge status={status as Parameters<typeof StatusBadge>[0]["status"]} />;
    }
    const proformaOptions = ["record_payment", "cancelled"];
    return (
      <div className="relative" onKeyDown={handleKeyDown}>
        <button ref={triggerRef} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); setFocusIndex(0); }} className="flex items-center gap-1 group/sd" title="Change status" aria-expanded={open} aria-haspopup="listbox" aria-label={`Change status, currently ${status}`}>
          <StatusBadge status={status as Parameters<typeof StatusBadge>[0]["status"]} />
          <ChevronDown className="w-3 h-3 text-text-muted opacity-0 group-hover/sd:opacity-100 transition-opacity" aria-hidden="true" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpen(false); }} aria-hidden="true" />
            <div ref={listRef} role="listbox" aria-label="Status options" aria-activedescendant={focusIndex >= 0 ? `proforma-opt-${focusIndex}` : undefined} className="absolute left-0 top-full mt-1 z-20 py-1.5 rounded-xl min-w-[140px]"
              style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}>
              <button
                id="proforma-opt-0"
                role="option"
                aria-selected={focusIndex === 0}
                tabIndex={focusIndex === 0 ? 0 : -1}
                onClick={(e) => { e.stopPropagation(); onConvertProforma?.(); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs text-green-600 font-medium transition-colors ${focusIndex === 0 ? "bg-green-50" : "hover:bg-green-50"}`}
              >
                Record Payment
              </button>
              <button
                id="proforma-opt-1"
                role="option"
                aria-selected={focusIndex === 1}
                tabIndex={focusIndex === 1 ? 0 : -1}
                onClick={(e) => { e.stopPropagation(); onChange("cancelled"); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors text-text-secondary ${focusIndex === 1 ? "bg-black/[0.04] text-text-primary" : "hover:bg-black/[0.04] hover:text-text-primary"}`}
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
    <div className="relative" onKeyDown={handleKeyDown}>
      <button ref={triggerRef} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); setFocusIndex(0); }} className="flex items-center gap-1 group/sd" title="Change status" aria-expanded={open} aria-haspopup="listbox" aria-label={`Change status, currently ${status}`}>
        <StatusBadge status={status as Parameters<typeof StatusBadge>[0]["status"]} />
        <ChevronDown className="w-3 h-3 text-text-muted opacity-0 group-hover/sd:opacity-100 transition-opacity" aria-hidden="true" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpen(false); }} aria-hidden="true" />
          <div ref={listRef} role="listbox" aria-label="Status options" aria-activedescendant={focusIndex >= 0 ? `status-opt-${focusIndex}` : undefined} className="absolute left-0 top-full mt-1 z-20 py-1.5 rounded-xl min-w-[110px]"
            style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}>
            {options.map((s, idx) => (
              <button
                key={s}
                id={`status-opt-${idx}`}
                role="option"
                aria-selected={focusIndex === idx}
                tabIndex={focusIndex === idx ? 0 : -1}
                onClick={(e) => { e.stopPropagation(); onChange(s); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs capitalize transition-colors ${focusIndex === idx ? "bg-black/[0.04] text-text-primary" : "hover:bg-black/[0.04] text-text-secondary hover:text-text-primary"}`}
              >
                {getOptionLabel(s)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
