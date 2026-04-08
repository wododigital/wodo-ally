"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TypeFilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const TYPE_OPTIONS = ["all", "gst", "international", "non_gst", "proforma"];
const TYPE_LABELS: Record<string, string> = {
  all: "All Types",
  gst: "GST",
  international: "Intl.",
  non_gst: "Non-GST",
  proforma: "Proforma",
};

export function TypeFilterDropdown({ value, onChange }: TypeFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-button text-xs font-medium transition-all border whitespace-nowrap",
          value !== "all"
            ? "bg-white text-text-primary border-black/[0.12] shadow-sm"
            : "bg-transparent text-text-muted border-black/[0.06] hover:border-black/[0.10]"
        )}
      >
        <span>{TYPE_LABELS[value] ?? value}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full mt-1 z-20 py-1.5 rounded-xl min-w-[130px]"
            style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
          >
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-black/[0.04]",
                  value === opt ? "text-accent font-semibold" : "text-text-secondary"
                )}
              >
                {TYPE_LABELS[opt] ?? opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
