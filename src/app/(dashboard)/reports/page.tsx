"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileText, Send, Download, TrendingUp, Users,
  DollarSign, BarChart2, MoreHorizontal, Check, Loader2, Eye, X,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
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
import type { Database } from "@/types/database";
import type { ReportData, InvestorReportWithData } from "@/lib/hooks/use-reports";

type ReportRow = Database["public"]["Tables"]["investor_reports"]["Row"];
type ReportType = "monthly" | "quarterly" | "annual";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Indian FY quarters: Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar
const QUARTERS = [
  { label: "Q1 (Apr - Jun)", startMonth: 4 },
  { label: "Q2 (Jul - Sep)", startMonth: 7 },
  { label: "Q3 (Oct - Dec)", startMonth: 10 },
  { label: "Q4 (Jan - Mar)", startMonth: 1 },
];

function formatINR(amount: number): string {
  if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(2)}L`;
  return `\u20B9${(amount / 1000).toFixed(0)}K`;
}

function formatGeneratedDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getReportPeriodLabel(report: ReportRow): string {
  const type = report.report_type ?? "monthly";
  const month = report.report_month ?? 1;
  const year = report.report_year;
  if (type === "quarterly") {
    const quarters: Record<number, string> = { 4: "Q1", 7: "Q2", 10: "Q3", 1: "Q4" };
    return `${quarters[month] ?? "Q?"} FY${report.financial_year}`;
  }
  if (type === "annual") {
    return `FY ${report.financial_year}`;
  }
  return `${MONTH_NAMES[(month) - 1]} ${year}`;
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

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
};

const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  monthly: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  quarterly: "text-purple-500 bg-purple-500/10 border-purple-500/20",
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
  const currentMonth = now.getMonth() + 1;
  // default quarter: find which quarter current month belongs to
  const defaultQuarter = currentMonth >= 4 && currentMonth <= 6 ? 0
    : currentMonth >= 7 && currentMonth <= 9 ? 1
    : currentMonth >= 10 && currentMonth <= 12 ? 2 : 3;

  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [quarterIdx, setQuarterIdx] = useState(defaultQuarter);
  // For annual, store FY start year (e.g., 2025 for FY 2025-26)
  const [fyYear, setFyYear] = useState(currentMonth >= 4 ? now.getFullYear() : now.getFullYear() - 1);
  const [year, setYear] = useState(now.getFullYear());

  function handleGenerate() {
    if (reportType === "monthly") {
      onGenerate(month, year, "monthly");
    } else if (reportType === "quarterly") {
      const q = QUARTERS[quarterIdx];
      // For Q4 (Jan-Mar), the year stored is the calendar year of January
      const qYear = q.startMonth === 1 ? fyYear + 1 : fyYear;
      onGenerate(q.startMonth, qYear, "quarterly");
    } else {
      onGenerate(4, fyYear, "annual");
    }
  }

  const fyOptions = [2023, 2024, 2025, 2026, 2027].map((y) => ({ start: y, label: `FY ${y}-${String(y + 1).slice(-2)}` }));

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
        <p className="text-xs text-gray-500 mb-5">Select the period and type</p>

        <div className="space-y-4">
          {/* Report type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Report Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(["monthly", "quarterly", "annual"] as ReportType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setReportType(t)}
                  className={cn(
                    "py-2 rounded-lg text-xs font-medium border transition-all",
                    reportType === t
                      ? "border-[#fd7e14] text-[#fd7e14] bg-orange-50"
                      : "border-black/[0.08] text-gray-500 hover:border-black/[0.15]"
                  )}
                >
                  {REPORT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly controls */}
          {reportType === "monthly" && (
            <>
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
            </>
          )}

          {/* Quarterly controls */}
          {reportType === "quarterly" && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Quarter (Indian FY)</label>
                <div className="grid grid-cols-2 gap-2">
                  {QUARTERS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuarterIdx(idx)}
                      className={cn(
                        "py-2 px-3 rounded-lg text-xs font-medium border transition-all text-left",
                        quarterIdx === idx
                          ? "border-[#fd7e14] text-[#fd7e14] bg-orange-50"
                          : "border-black/[0.08] text-gray-500 hover:border-black/[0.15]"
                      )}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Financial Year</label>
                <select
                  value={fyYear}
                  onChange={(e) => setFyYear(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-button text-sm border border-black/[0.1] bg-black/[0.02] text-gray-800 focus:outline-none focus:border-[#fd7e14]"
                >
                  {fyOptions.map((o) => (
                    <option key={o.start} value={o.start}>{o.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Annual controls */}
          {reportType === "annual" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Financial Year</label>
              <select
                value={fyYear}
                onChange={(e) => setFyYear(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-button text-sm border border-black/[0.1] bg-black/[0.02] text-gray-800 focus:outline-none focus:border-[#fd7e14]"
              >
                {fyOptions.map((o) => (
                  <option key={o.start} value={o.start}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-button text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
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

// ─── Send modal (full compose) ─────────────────────────────────────────────────

interface SendModalProps {
  report: ReportRow;
  onClose: () => void;
  onSend: (to: string[], cc: string[], subject: string) => void;
  isSending: boolean;
}

function SendModal({ report, onClose, onSend, isSending }: SendModalProps) {
  const periodLabel = getReportPeriodLabel(report);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("shyam@wodo.digital, suhas@wodo.digital");
  const [subject, setSubject] = useState(`Investor Report - ${periodLabel}`);

  function handleSend() {
    const toEmails = to.split(",").map((e) => e.trim()).filter(Boolean);
    const ccEmails = cc.split(",").map((e) => e.trim()).filter(Boolean);
    if (toEmails.length === 0) return;
    onSend(toEmails, ccEmails, subject);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: "rgba(255,255,255,0.98)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Send Report</h3>
            <p className="text-xs text-gray-500 mt-0.5">{periodLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">To <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2.5 rounded-button text-sm border border-black/[0.1] bg-black/[0.02] text-gray-800 focus:outline-none focus:border-[#fd7e14]"
              placeholder="investor@example.com, cfo@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">CC</label>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="w-full px-3 py-2.5 rounded-button text-sm border border-black/[0.1] bg-black/[0.02] text-gray-800 focus:outline-none focus:border-[#fd7e14]"
              placeholder="cc@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2.5 rounded-button text-sm border border-black/[0.1] bg-black/[0.02] text-gray-800 focus:outline-none focus:border-[#fd7e14]"
            />
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
            onClick={handleSend}
            disabled={isSending || !to.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {isSending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PDF Preview modal ─────────────────────────────────────────────────────────

function PdfPreviewModal({ report, onClose }: { report: ReportRow; onClose: () => void }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string;
    (async () => {
      try {
        const typed: InvestorReportWithData = {
          ...(report as Omit<ReportRow, "report_data">),
          report_data: (report.report_data ?? {}) as unknown as ReportData,
        };
        const { generateReportPdf } = await import("@/lib/pdf/report-pdf");
        const bytes = await generateReportPdf(typed);
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch (err) {
        setError("Failed to render PDF preview");
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [report]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-[860px] rounded-2xl overflow-hidden"
        style={{ height: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ background: "rgba(255,255,255,0.98)", borderBottom: "1px solid rgba(0,0,0,0.08)" }}
        >
          <p className="text-sm font-semibold text-gray-900">{getReportPeriodLabel(report)} - Preview</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* PDF content */}
        <div className="flex-1 overflow-hidden bg-[#525659]">
          {loading && (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white/60" />
            </div>
          )}
          {error && (
            <div className="h-full flex items-center justify-center text-white/70 text-sm">{error}</div>
          )}
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Report Preview"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [typeFilter, setTypeFilter] = useState<"all" | ReportType>("all");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [sendingReport, setSendingReport] = useState<ReportRow | null>(null);
  const [previewReport, setPreviewReport] = useState<ReportRow | null>(null);
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
      a.download = `WODO-Report-${getReportPeriodLabel(report).replace(/\s/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloadingId(null);
    }
  }

  function handleSend(report: ReportRow, to: string[], cc: string[], subject: string) {
    const reportData = (report.report_data ?? {}) as unknown as ReportData;
    sendReport.mutate(
      { id: report.id, to, cc, subject, reportData },
      {
        onSuccess: () => {
          setSendingReport(null);
          setJustSentId(report.id);
          setTimeout(() => setJustSentId(null), 3000);
        },
      }
    );
  }

  const allTypes: { value: "all" | ReportType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "annual", label: "Annual" },
  ];

  const filtered = typeFilter === "all"
    ? reports
    : reports.filter((r) => (r.report_type ?? "monthly") === typeFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filter tabs + Generate button */}
      <div className="flex items-center justify-between gap-3">
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
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-button text-xs font-semibold text-white transition-all shrink-0"
          style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
        >
          <FileText className="w-3.5 h-3.5" />
          Generate Report
        </button>
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
            description="Generate your first investor report to track financial performance"
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
            const periodLabel = getReportPeriodLabel(report);
            const isDownloading = downloadingId === report.id;
            const reportType = (report.report_type ?? "monthly") as ReportType;

            return (
              <GlassCard key={report.id} padding="md">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                      <BarChart2 className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-text-primary leading-tight">{periodLabel}</p>
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded border", REPORT_TYPE_COLORS[reportType])}>
                          {REPORT_TYPE_LABELS[reportType]}
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
                        <p className="text-xs text-green-500 font-medium mt-0.5 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Email sent successfully
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={report.status} />

                    {/* View PDF */}
                    <button
                      onClick={() => setPreviewReport(report)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] hover:text-text-primary transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>

                    {/* Download PDF */}
                    <button
                      onClick={() => handleDownloadPdf(report)}
                      disabled={isDownloading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] hover:text-text-primary transition-all disabled:opacity-60"
                    >
                      {isDownloading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Download className="w-3.5 h-3.5" />
                      }
                      {isDownloading ? "Generating..." : "Download"}
                    </button>

                    {!isSent && (
                      <button
                        onClick={() => setSendingReport(report)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-white transition-colors"
                        style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send
                      </button>
                    )}

                    {isSent && (
                      <OverflowMenu
                        onResend={() => setSendingReport(report)}
                        onDelete={() => setConfirmDeleteId(report.id)}
                      />
                    )}

                    {!isSent && (
                      <button
                        onClick={() => setConfirmDeleteId(report.id)}
                        className="flex items-center justify-center w-8 h-8 rounded-button text-text-muted hover:text-red-400 bg-surface-DEFAULT border border-black/[0.05] hover:border-red-200 transition-all"
                        title="Delete report"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Metric pills */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-black/[0.05]">
                  <MetricPill icon={DollarSign}  label="Revenue"    value={formatINR(summary.revenue)}    color="text-green-500 bg-green-500/10 border-green-500/20" />
                  <MetricPill icon={TrendingUp}  label="Expenses"   value={formatINR(summary.expenses)}   color="text-red-500 bg-red-500/10 border-red-500/20" />
                  <MetricPill icon={BarChart2}   label="Net Profit" value={formatINR(summary.netProfit)}  color="text-accent bg-accent/10 border-accent/20" />
                  <MetricPill icon={Users}       label="Clients"    value={String(summary.clientCount)}   color="text-blue-500 bg-blue-500/10 border-blue-500/20" />
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
      {sendingReport && (
        <SendModal
          report={sendingReport}
          onClose={() => setSendingReport(null)}
          onSend={(to, cc, subject) => handleSend(sendingReport, to, cc, subject)}
          isSending={sendReport.isPending}
        />
      )}

      {/* PDF preview modal */}
      {previewReport && (
        <PdfPreviewModal
          report={previewReport}
          onClose={() => setPreviewReport(null)}
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
