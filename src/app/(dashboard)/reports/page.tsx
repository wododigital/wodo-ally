"use client";

import { useState } from "react";
import { FileText, Send, Download, TrendingUp, Users, DollarSign, BarChart2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils/cn";

interface ReportSummary {
  revenue: number;
  expenses: number;
  netProfit: number;
  clientCount: number;
}

interface Report {
  id: string;
  monthYear: string;
  generatedOn: string;
  status: "sent" | "draft";
  summary: ReportSummary;
}

const REPORTS: Report[] = [
  {
    id: "r1",
    monthYear: "February 2026",
    generatedOn: "2026-03-01",
    status: "draft",
    summary: { revenue: 385000, expenses: 31200, netProfit: 353800, clientCount: 6 },
  },
  {
    id: "r2",
    monthYear: "January 2026",
    generatedOn: "2026-02-01",
    status: "sent",
    summary: { revenue: 345000, expenses: 54000, netProfit: 291000, clientCount: 5 },
  },
  {
    id: "r3",
    monthYear: "December 2025",
    generatedOn: "2026-01-02",
    status: "sent",
    summary: { revenue: 320000, expenses: 48500, netProfit: 271500, clientCount: 5 },
  },
  {
    id: "r4",
    monthYear: "November 2025",
    generatedOn: "2025-12-02",
    status: "sent",
    summary: { revenue: 298000, expenses: 41000, netProfit: 257000, clientCount: 4 },
  },
  {
    id: "r5",
    monthYear: "October 2025",
    generatedOn: "2025-11-03",
    status: "sent",
    summary: { revenue: 275000, expenses: 38700, netProfit: 236300, clientCount: 4 },
  },
  {
    id: "r6",
    monthYear: "September 2025",
    generatedOn: "2025-10-01",
    status: "sent",
    summary: { revenue: 240000, expenses: 35000, netProfit: 205000, clientCount: 3 },
  },
];

function formatINR(amount: number): string {
  if (amount >= 100000) {
    return `\u20B9${(amount / 100000).toFixed(2)}L`;
  }
  return `\u20B9${(amount / 1000).toFixed(0)}K`;
}

function formatGeneratedDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1800);
  }

  function handleSend(id: string) {
    setSentIds((prev) => new Set(Array.from(prev).concat(id)));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Investor Reports"
        description="Monthly financial summaries for WODO Digital stakeholders"
        action={
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold text-white disabled:opacity-60 transition-all"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            <FileText className="w-4 h-4" />
            {generating ? "Generating..." : "Generate Report"}
          </button>
        }
      />

      {/* Report cards */}
      <div className="space-y-4">
        {REPORTS.map((report) => {
          const isSent = sentIds.has(report.id) || report.status === "sent";
          const displayStatus = isSent ? "sent" : "draft";

          return (
            <GlassCard key={report.id} padding="md">
              {/* Card header */}
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <BarChart2 className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary leading-tight">{report.monthYear}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Generated on {formatGeneratedDate(report.generatedOn)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={displayStatus} />

                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] hover:text-text-primary transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    View PDF
                  </button>

                  {!isSent && (
                    <button
                      onClick={() => handleSend(report.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-white transition-colors"
                      style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Email
                    </button>
                  )}

                  {isSent && report.status === "sent" && (
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-white transition-colors opacity-80 hover:opacity-100"
                      style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      Resend
                    </button>
                  )}
                </div>
              </div>

              {/* Metric pills */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-black/[0.05]">
                <MetricPill
                  icon={DollarSign}
                  label="Revenue"
                  value={formatINR(report.summary.revenue)}
                  color="text-green-400 bg-green-500/10 border-green-500/20"
                />
                <MetricPill
                  icon={TrendingUp}
                  label="Expenses"
                  value={formatINR(report.summary.expenses)}
                  color="text-red-400 bg-red-500/10 border-red-500/20"
                />
                <MetricPill
                  icon={BarChart2}
                  label="Net Profit"
                  value={formatINR(report.summary.netProfit)}
                  color="text-accent bg-accent/10 border-accent/20"
                />
                <MetricPill
                  icon={Users}
                  label="Clients"
                  value={String(report.summary.clientCount)}
                  color="text-blue-400 bg-blue-500/10 border-blue-500/20"
                />
              </div>
            </GlassCard>
          );
        })}
      </div>
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
