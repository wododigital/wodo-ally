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
  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full text-xs font-semibold transition-all whitespace-nowrap";
const btnLight =
  btnBase + " bg-white border border-black/[0.07] text-text-secondary hover:border-black/[0.15] hover:text-text-primary shadow-sm";

export function AnalyticsQuickBar({ period = "Mar 2026" }: { period?: string }) {
  const [pdfOpen, setPdfOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Label */}
        <p className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-text-muted">
          {period} - Analytics
        </p>

        {/* Buttons - flex-1 so they fill remaining width equally */}
        <div className="flex-1 flex gap-2">
          {QUICK_LINKS.map(({ label, href, Icon, color }) => (
            <Link key={label} href={href} className={btnLight}>
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
              {label}
            </Link>
          ))}

          {/* Investor Report - opens PDF modal */}
          <button
            onClick={() => setPdfOpen(true)}
            className={btnBase}
            style={{
              background: "rgba(253,126,20,0.1)",
              border: "1px solid rgba(253,126,20,0.25)",
              color: "#fd7e14",
            }}
          >
            <BarChart2 className="w-3.5 h-3.5 shrink-0" />
            {period} Investor Report
          </button>
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
