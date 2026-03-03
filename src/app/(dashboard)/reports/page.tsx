"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileText, Send, Download, TrendingUp, Users,
  DollarSign, BarChart2, MoreHorizontal, Check, Loader2,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { cn } from "@/lib/utils/cn";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useReports,
  useGenerateReport,
  useSendReport,
  useDeleteReport,
} from "@/lib/hooks/use-reports";
// generateReportPdf is loaded dynamically on demand to avoid bundling @react-pdf/renderer upfront
import type { Database } from "@/types/database";
import type { ReportData, InvestorReportWithData } from "@/lib/hooks/use-reports";

type ReportRow = Database["public"]["Tables"]["investor_reports"]["Row"];
type ReportType = "monthly" | "quarterly" | "annual";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatINR(amount: number): string {
  if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(2)}L`;
  return `\u20B9${(amount / 1000).toFixed(0)}K`;
}

function formatGeneratedDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getMonthYearLabel(report: ReportRow): string {
  const monthName = MONTH_NAMES[(report.report_month ?? 1) - 1];
  return `${monthName} ${report.report_year}`;
}

function getSummaryFromReportData(data: unknown): { revenue: number; expenses: number; netProfit: number; clientCount: number } {
  const d = data as ReportData | null;
  if (!d) return { revenue: 0, expenses: 0, netProfit: 0, clientCount: 0 };
  return {
    revenue: d.revenue ?? 0,
    expenses: d.expenses ?? 0,
    netProfit: d.netProfit ?? 0,
    clientCount: d.activeClients ?? 0,
  };
}

// ─── Report type colors ────────────────────────────────────────────────────────

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

// ─── Overflow menu ─────────────────────────────────────────────────────────────

function OverflowMenu({ onResend, onDelete }: { onResend: () => void; onDelete: () => void }) {
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
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Generate modal ────────────────────────────────────────────────────────────

interface GenerateModalProps {
  onClose: () => void;
  onGenerate: (month: number, year: number, reportType: ReportType) => void;
  isLoading: boolean;
}

function GenerateModal({ onClose, onGenerate, isLoading }: GenerateModalProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [reportType, setReportType] = useState<ReportType>("monthly");

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
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Generate Report</h3>
        <p className="text-xs text-gray-500 mb-5">Select the period to generate a report for</p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-button text-sm border border-black/[0.1] bg-black/[0.02] text-gray-800 focus:outline-none focus:border-[#fd7e14]"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx + 1}>{name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-button text-sm border border-black/[0.1] bg-black/[0.02] text-gray-800 focus:outline-none focus:border-[#fd7e14]"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2.5 rounded-button text-sm border border-black/[0.1] bg-black/[0.02] text-gray-800 focus:outline-none focus:border-[#fd7e14]"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-button text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onGenerate(month, year, reportType)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            {isLoading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Send modal ────────────────────────────────────────────────────────────────

function SendModal({
  onClose,
  onSend,
  isSending,
}: {
  onClose: () => void;
  onSend: (emails: string[]) => void;
  isSending: boolean;
}) {
  const [email, setEmail] = useState("");

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
          placeholder="investor@example.com, ceo@wodo.digital"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-button text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const emails = email.split(",").map((e) => e.trim()).filter(Boolean);
              if (emails.length > 0) onSend(emails);
            }}
            disabled={isSending || !email.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [typeFilter, setTypeFilter] = useState<"all" | ReportType>("all");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [justSentId, setJustSentId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: reports = [], isLoading } = useReports();
  const generateReport = useGenerateReport();
  const sendReport = useSendReport();
  const deleteReport = useDeleteReport();

  async function handleGenerate(month: number, year: number, reportType: ReportType) {
    generateReport.mutate(
      { report_month: month, report_year: year, report_type: reportType },
      { onSuccess: () => setShowGenerateModal(false) }
    );
  }

  async function handleDownloadPdf(report: ReportRow) {
    setDownloadingId(report.id);
    try {
      const typed: InvestorReportWithData = {
        ...(report as Omit<ReportRow, "report_data">),
        report_data: (report.report_data ?? {}) as unknown as ReportData,
      };
      const { generateReportPdf } = await import("@/lib/pdf/report-pdf");
      const bytes = await generateReportPdf(typed);
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `WODO-Report-${getMonthYearLabel(report).replace(/ /g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloadingId(null);
    }
  }

  function handleSend(report: ReportRow, emails: string[]) {
    const reportData = (report.report_data ?? {}) as unknown as ReportData;
    sendReport.mutate(
      { id: report.id, to: emails, reportData },
      {
        onSuccess: () => {
          setSendingId(null);
          setJustSentId(report.id);
          setTimeout(() => setJustSentId(null), 3000);
        },
      }
    );
  }

  function handleDelete(id: string) {
    setConfirmDeleteId(id);
  }

  const allTypes: { value: "all" | ReportType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "annual", label: "Annual" },
  ];

  const filtered = typeFilter === "all"
    ? reports
    : reports.filter((r) => {
        // The DB schema doesn't have report_type in the Row type shown,
        // but we can infer: check report_data for period or just show all from DB
        return true; // filter server-side if needed; DB Insert has no report_type field per schema
      });

  const sendingReport = sendingId ? reports.find((r) => r.id === sendingId) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <PageHeader
          title="Investor Reports"
          description="Financial summaries for WODO Digital stakeholders"
        />
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold text-white transition-all"
          style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
        >
          <FileText className="w-4 h-4" />
          Generate Report
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

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <GlassCard padding="md">
          <EmptyState
            icon={BarChart2}
            title="No reports yet"
            description="Generate your first monthly investor report to track financial performance"
            action={{ label: "Generate Report", onClick: () => setShowGenerateModal(true) }}
          />
        </GlassCard>
      )}

      {/* Report cards */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((report) => {
            const isSent = report.status === "sent";
            const isJustSent = justSentId === report.id;
            const sentEmails = report.sent_to ?? [];
            const summary = getSummaryFromReportData(report.report_data);
            const monthYear = getMonthYearLabel(report);
            const isDownloading = downloadingId === report.id;

            return (
              <GlassCard key={report.id} padding="md">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                      <BarChart2 className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-text-primary leading-tight">{monthYear}</p>
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded border", REPORT_TYPE_COLORS.monthly)}>
                          {REPORT_TYPE_LABELS.monthly}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        Generated {formatGeneratedDate(report.generated_at)}
                      </p>
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
                    <StatusBadge status={report.status} />

                    <button
                      onClick={() => handleDownloadPdf(report)}
                      disabled={isDownloading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] hover:text-text-primary transition-all disabled:opacity-60"
                    >
                      {isDownloading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Download className="w-3.5 h-3.5" />
                      }
                      {isDownloading ? "Generating..." : "Download PDF"}
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

                    {isSent && (
                      <OverflowMenu
                        onResend={() => setSendingId(report.id)}
                        onDelete={() => handleDelete(report.id)}
                      />
                    )}

                    {!isSent && (
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="flex items-center justify-center w-8 h-8 rounded-button text-text-muted hover:text-red-400 bg-surface-DEFAULT border border-black/[0.05] hover:border-red-200 transition-all"
                        title="Delete report"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>

                {/* Metric pills */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-black/[0.05]">
                  <MetricPill icon={DollarSign}  label="Revenue"    value={formatINR(summary.revenue)}    color="text-green-400 bg-green-500/10 border-green-500/20" />
                  <MetricPill icon={TrendingUp}  label="Expenses"   value={formatINR(summary.expenses)}   color="text-red-400 bg-red-500/10 border-red-500/20" />
                  <MetricPill icon={BarChart2}   label="Net Profit" value={formatINR(summary.netProfit)}  color="text-accent bg-accent/10 border-accent/20" />
                  <MetricPill icon={Users}       label="Clients"    value={String(summary.clientCount)}   color="text-blue-400 bg-blue-500/10 border-blue-500/20" />
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Generate modal */}
      {showGenerateModal && (
        <GenerateModal
          onClose={() => setShowGenerateModal(false)}
          onGenerate={handleGenerate}
          isLoading={generateReport.isPending}
        />
      )}

      {/* Send modal */}
      {sendingId && sendingReport && (
        <SendModal
          onClose={() => setSendingId(null)}
          onSend={(emails) => handleSend(sendingReport, emails)}
          isSending={sendReport.isPending}
        />
      )}

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title="Delete Report"
        description="Are you sure you want to delete this report? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteReport.isPending}
        onConfirm={() => {
          if (!confirmDeleteId) return;
          deleteReport.mutate(confirmDeleteId, {
            onSuccess: () => setConfirmDeleteId(null),
          });
        }}
      />
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
