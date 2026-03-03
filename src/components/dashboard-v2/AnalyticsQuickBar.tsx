"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, TrendingUp, Receipt, Users, FolderKanban, BarChart2 } from "lucide-react";
import { PdfPreviewModal } from "@/components/shared/pdf-preview-modal";

const QUICK_LINKS = [
  { label: "Revenue",  href: "/analytics/invoices?period=month", Icon: FileText,     color: "#fd7e14" },
  { label: "P&L",      href: "/analytics/pl?period=month",       Icon: TrendingUp,   color: "#22c55e" },
  { label: "Expenses", href: "/analytics/expenses?period=month", Icon: Receipt,      color: "#ef4444" },
  { label: "Clients",  href: "/analytics/clients?period=month",  Icon: Users,        color: "#3b82f6" },
  { label: "Projects", href: "/analytics/projects?period=month", Icon: FolderKanban, color: "#8b5cf6" },
];

const btnBase =
  "flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap";
const btnLight =
  btnBase + " border text-text-secondary hover:text-text-primary";
const btnLightStyle = {
  background: "rgba(255,255,255,0.45)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.75)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
};

export function AnalyticsQuickBar({ period = "Mar 2026" }: { period?: string }) {
  const [pdfOpen, setPdfOpen] = useState(false);

  return (
    <>
      {/* On mobile: hide label, scroll buttons horizontally */}
      <div className="flex items-center gap-3">
        <p className="hidden md:block shrink-0 text-[11px] font-bold uppercase tracking-widest text-text-muted">
          {period} - Analytics
        </p>

        <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max md:min-w-0 md:flex-wrap">
          {QUICK_LINKS.map(({ label, href, Icon, color }) => (
            <Link key={label} href={href} className={btnLight} style={btnLightStyle}>
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
              {label}
            </Link>
          ))}

          {/* Investor Report - opens PDF modal */}
          <button
            onClick={() => setPdfOpen(true)}
            className={btnBase}
            style={{
              background: "rgba(255,255,255,0.45)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(253,126,20,0.35)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
              color: "#fd7e14",
            }}
          >
            <BarChart2 className="w-3.5 h-3.5 shrink-0" />
            {period} Investor Report
          </button>
        </div>
        </div>
      </div>

      <PdfPreviewModal
        isOpen={pdfOpen}
        onClose={() => setPdfOpen(false)}
        title={`${period} Investor Report`}
        onDownload={() => {
          // Phase 3: trigger PDF download here
          setPdfOpen(false);
        }}
      />
    </>
  );
}
