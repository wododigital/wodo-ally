"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, X, UserPlus, FileText, Upload, BarChart2, IndianRupee } from "lucide-react";

const QUICK_ACTIONS = [
  { href: "/onboard",         label: "Onboard Client",        icon: UserPlus,     color: "#fd7e14", bg: "rgba(253,126,20,0.1)"  },
  { href: "/invoices/new",    label: "Create Invoice",         icon: FileText,     color: "#6366f1", bg: "rgba(99,102,241,0.1)"  },
  { href: "/expenses/upload", label: "Upload Bank Statement",  icon: Upload,       color: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
  { href: "/payments",        label: "Record Payment",         icon: IndianRupee,  color: "#3b82f6", bg: "rgba(59,130,246,0.1)"  },
  { href: "/reports",         label: "Investor Report",        icon: BarChart2,    color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
];

export function FloatingFAB() {
  const [open, setOpen] = useState(false);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-fab]")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" data-fab>
      {/* Action items - shown when open */}
      {open && (
        <div
          className="flex flex-col items-end gap-2 mb-1"
          style={{ animation: "fadeInUp 0.15s ease-out" }}
        >
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 pl-4 pr-4 py-2.5 rounded-full text-sm font-semibold text-gray-800 hover:scale-[1.02] transition-all duration-150 whitespace-nowrap"
              style={{
                background: "rgba(255,255,255,0.94)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.9)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: action.bg }}
              >
                <action.icon className="w-3.5 h-3.5" style={{ color: action.color }} />
              </span>
              {action.label}
            </Link>
          ))}
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200"
        style={{
          background: open
            ? "#374151"
            : "linear-gradient(135deg, #fd7e14, #e8720f)",
          boxShadow: open
            ? "0 4px 20px rgba(0,0,0,0.25)"
            : "0 6px 24px rgba(253,126,20,0.45)",
        }}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
      >
        {open
          ? <X className="w-5 h-5" />
          : <Plus className="w-5 h-5" />
        }
      </button>
    </div>
  );
}
