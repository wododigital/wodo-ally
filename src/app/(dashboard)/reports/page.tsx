"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, Send, Download, TrendingUp, Users, DollarSign, BarChart2, MoreHorizontal, Check } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils/cn";

// ─── Types ─────────────────────────────────────────────────────────────────

type ReportType = "monthly" | "quarterly" | "annual";

interface ReportSummary {
  revenue: number;
  expenses: number;
  netProfit: number;
  clientCount: number;
}

interface Report {
  id: string;
  monthYear: string;
  report_type: ReportType;
  generatedOn: string;
  status: "sent" | "draft";
  summary: ReportSummary;
  sentTo?: string[];
}

// ─── Mock data ─────────────────────────────────────────────────────────────

const REPORTS: Report[] = [
  {
    id: "r1",
    monthYear: "February 2026",
    report_type: "monthly",
    generatedOn: "2026-03-01",
    status: "draft",
    summary: { revenue: 385000, expenses: 31200, netProfit: 353800, clientCount: 6 },
  },
  {
    id: "r2",
    monthYear: "January 2026",
    report_type: "monthly",
    generatedOn: "2026-02-01",
    status: "sent",
    summary: { revenue: 345000, expenses: 54000, netProfit: 291000, clientCount: 5 },
    sentTo: ["investor@example.com"],
  },
  {
    id: "r3",
    monthYear: "Q3 FY 2025-26 (Oct-Dec)",
    report_type: "quarterly",
    generatedOn: "2026-01-05",
    status: "sent",
    summary: { revenue: 1027000, expenses: 174500, netProfit: 852500, clientCount: 5 },
    sentTo: ["investor@example.com", "co-founder@wodo.digital"],
  },
  {
    id: "r4",
    monthYear: "December 2025",
    report_type: "monthly",
    generatedOn: "2026-01-02",
    status: "sent",
    summary: { revenue: 320000, expenses: 48500, netProfit: 271500, clientCount: 5 },
    sentTo: ["investor@example.com"],
  },
  {
    id: "r5",
    monthYear: "November 2025",
    report_type: "monthly",
    generatedOn: "2025-12-02",
    status: "sent",
    summary: { revenue: 298000, expenses: 41000, netProfit: 257000, clientCount: 4 },
    sentTo: ["investor@example.com"],
  },
];

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
};

const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  monthly: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  quarterly: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  annual: "text-accent bg-accent/10 border-accent/20",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatINR(amount: number): string {
  if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(2)}L`;
  return `\u20B9${(amount / 1000).toFixed(0)}K`;
}

function formatGeneratedDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── OverflowMenu (Resend) ────────────────────────────────────────────────

function OverflowMenu({ onResend }: { onResend: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-8 h-8 rounded-button text-text-muted hover:text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] transition-all"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-30 rounded-xl overflow-hidden min-w-[130px]"
          style={{
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          }}
        >
          <button
            onClick={() => { onResend(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-text-secondary hover:text-text-primary hover:bg-black/[0.03] transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Resend Email
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Send modal ───────────────────────────────────────────────────────────

function SendModal({ onClose, onSend }: { onClose: () => void; onSend: (emails: string[]) => void }) {
  const [email, setEmail] = useState("investor@example.com");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "rgba(255,255,255,0.98)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
        }}
      >
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Send Report</h3>
        <p className="text-xs text-gray-500 mb-4">Enter recipient email addresses (comma-separated)</p>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 rounded-button text-sm border border-black/[0.1] bg-black/[0.02] text-gray-800 focus:outline-none focus:border-[#fd7e14]"
          placeholder="email@example.com"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-button text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSend(email.split(",").map((e) => e.trim()).filter(Boolean))}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-button text-sm font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | ReportType>("all");
  const [sentMap, setSentMap] = useState<Record<string, string[]>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [justSentId, setJustSentId] = useState<string | null>(null);

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1800);
  }

  function handleSend(id: string, emails: string[]) {
    setSentMap((prev) => ({ ...prev, [id]: emails }));
    setSendingId(null);
    setJustSentId(id);
    setTimeout(() => setJustSentId(null), 3000);
  }

  const allTypes: { value: "all" | ReportType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "annual", label: "Annual" },
  ];

  const filtered = typeFilter === "all"
    ? REPORTS
    : REPORTS.filter((r) => r.report_type === typeFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <PageHeader
          title="Investor Reports"
          description="Financial summaries for WODO Digital stakeholders"
        />
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold text-white disabled:opacity-60 transition-all"
          style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
        >
          <FileText className="w-4 h-4" />
          {generating ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {/* Report type filter tabs */}
      <div className="flex gap-1.5">
        {allTypes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value)}
            className={cn(
              "px-3 py-1.5 rounded-button text-xs font-medium transition-all",
              typeFilter === t.value
                ? "bg-accent-muted text-accent border border-accent-light"
                : "bg-surface-DEFAULT text-text-muted border border-black/[0.05] hover:border-black/[0.08]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Report cards */}
      <div className="space-y-4">
        {filtered.map((report) => {
          const isSent = !!sentMap[report.id] || report.status === "sent";
          const displayStatus = isSent ? "sent" : "draft";
          const sentEmails = sentMap[report.id] ?? report.sentTo ?? [];
          const isJustSent = justSentId === report.id;

          return (
            <GlassCard key={report.id} padding="md">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <BarChart2 className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-text-primary leading-tight">{report.monthYear}</p>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded border", REPORT_TYPE_COLORS[report.report_type])}>
                        {REPORT_TYPE_LABELS[report.report_type]}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      Generated {formatGeneratedDate(report.generatedOn)}
                    </p>
                    {/* Sent-to confirmation */}
                    {isSent && sentEmails.length > 0 && (
                      <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-400" />
                        Sent to: {sentEmails.join(", ")}
                      </p>
                    )}
                    {isJustSent && (
                      <p className="text-xs text-green-400 font-medium mt-0.5 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Email sent successfully
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={displayStatus} />

                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] hover:text-text-primary transition-all">
                    <Download className="w-3.5 h-3.5" />
                    View PDF
                  </button>

                  {!isSent && (
                    <button
                      onClick={() => setSendingId(report.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-white transition-colors"
                      style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send
                    </button>
                  )}

                  {/* Resend in overflow menu */}
                  {isSent && (
                    <OverflowMenu onResend={() => setSendingId(report.id)} />
                  )}
                </div>
              </div>

              {/* Metric pills */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-black/[0.05]">
                <MetricPill icon={DollarSign}  label="Revenue"    value={formatINR(report.summary.revenue)}    color="text-green-400 bg-green-500/10 border-green-500/20" />
                <MetricPill icon={TrendingUp}  label="Expenses"   value={formatINR(report.summary.expenses)}   color="text-red-400 bg-red-500/10 border-red-500/20" />
                <MetricPill icon={BarChart2}   label="Net Profit" value={formatINR(report.summary.netProfit)}  color="text-accent bg-accent/10 border-accent/20" />
                <MetricPill icon={Users}       label="Clients"    value={String(report.summary.clientCount)}   color="text-blue-400 bg-blue-500/10 border-blue-500/20" />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Send modal */}
      {sendingId && (
        <SendModal
          onClose={() => setSendingId(null)}
          onSend={(emails) => handleSend(sendingId, emails)}
        />
      )}
    </div>
  );
}

interface MetricPillProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}

function MetricPill({ icon: Icon, label, value, color }: MetricPillProps) {
  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium", color)}>
      <Icon className="w-3.5 h-3.5" />
      <span className="text-text-muted">{label}:</span>
      <span className="font-sans tabular-nums font-semibold">{value}</span>
    </div>
  );
}
