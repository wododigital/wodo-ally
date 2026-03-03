"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils/cn";
import { parseIDFCStatement } from "@/lib/parsers/bank-statement";
import { categorizeTransactions } from "@/lib/parsers/auto-categorize";
import { useUploadBankStatement } from "@/lib/hooks/use-transactions";
import type { ParsedTransaction, ParsedStatement } from "@/lib/parsers/bank-statement";
import type { CategorizationResult } from "@/lib/parsers/auto-categorize";
import { formatDate } from "@/lib/utils/format";

type UploadState = "idle" | "dragging" | "parsing" | "preview" | "uploading" | "done" | "error";

interface PreviewData {
  parsed: ParsedStatement;
  categorizations: CategorizationResult[];
  filename: string;
}

// ─── Preview table ────────────────────────────────────────────────────────────

function PreviewTable({ transactions, categorizations }: {
  transactions: ParsedTransaction[];
  categorizations: CategorizationResult[];
}) {
  const MAX_ROWS = 20;
  const shown = transactions.slice(0, MAX_ROWS);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-black/[0.06]">
            {["Date", "Particulars", "Debit", "Credit", "Type"].map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left font-semibold text-text-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((t, idx) => {
            const cat = categorizations[idx];
            return (
              <tr
                key={idx}
                className="border-b border-black/[0.04] hover:bg-black/[0.02] transition-colors"
              >
                <td className="px-3 py-2 text-text-secondary font-sans whitespace-nowrap">
                  {formatDate(t.transaction_date)}
                </td>
                <td className="px-3 py-2 text-text-primary max-w-[240px] truncate">
                  {t.particulars}
                </td>
                <td className="px-3 py-2 font-sans text-red-400 whitespace-nowrap">
                  {t.debit != null ? `Rs.${t.debit.toLocaleString("en-IN")}` : "-"}
                </td>
                <td className="px-3 py-2 font-sans text-green-400 whitespace-nowrap">
                  {t.credit != null ? `Rs.${t.credit.toLocaleString("en-IN")}` : "-"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{
                      background: cat?.is_auto_categorized
                        ? "rgba(59,130,246,0.08)"
                        : "rgba(156,163,175,0.12)",
                      color: cat?.is_auto_categorized ? "#3b82f6" : "#9ca3af",
                    }}
                  >
                    {cat?.transaction_type ?? "uncategorized"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {transactions.length > MAX_ROWS && (
        <p className="px-3 py-2 text-xs text-text-muted text-center">
          ...and {transactions.length - MAX_ROWS} more transactions
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UploadStatementPage() {
  const router = useRouter();
  const [state, setState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadBankStatement();

  async function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setErrorMessage("Please upload an Excel file (.xlsx or .xls). CSV is not yet supported for IDFC statements.");
      setState("error");
      return;
    }

    setState("parsing");

    try {
      const parsed = await parseIDFCStatement(file);
      const categorizations = await categorizeTransactions(parsed.transactions);

      setPreview({ parsed, categorizations, filename: file.name });
      setState("preview");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to parse file";
      setErrorMessage(msg);
      setState("error");
      toast.error(`Parse error: ${msg}`);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setState("idle");
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleConfirmUpload() {
    if (!preview) return;

    setState("uploading");

    try {
      await uploadMutation.mutateAsync({
        filename: preview.filename,
        parsed: preview.parsed,
        categorizations: preview.categorizations,
      });
      setState("done");
    } catch {
      // Error toast is handled by the mutation's onError
      setState("preview");
    }
  }

  const autoCategorizedCount = preview
    ? preview.categorizations.filter((c) => c.is_auto_categorized).length
    : 0;
  const needsReviewCount = preview
    ? preview.categorizations.filter((c) => !c.is_auto_categorized).length
    : 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <Link
          href="/expenses"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Expenses
        </Link>
        <PageHeader
          title="Upload Bank Statement"
          description="Upload your IDFC FIRST Bank statement (Excel format)"
        />
      </div>

      {/* Done state */}
      {state === "done" && (
        <GlassCard padding="lg">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-400" />
            </div>
            <p className="text-base font-semibold text-text-primary">
              Statement imported successfully
            </p>
            <p className="text-sm text-text-muted mt-1">{preview?.filename}</p>
            <div className="grid grid-cols-3 gap-6 mt-6 w-full max-w-sm">
              {[
                { label: "Transactions", value: String(preview?.parsed.transactions.length ?? 0) },
                { label: "Auto-categorized", value: String(autoCategorizedCount) },
                { label: "Need review", value: String(needsReviewCount) },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold font-sans text-text-primary">
                    {stat.value}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push("/expenses")}
              className="mt-6 px-6 py-2.5 rounded-button text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
            >
              Review Transactions
            </button>
          </div>
        </GlassCard>
      )}

      {/* Preview state */}
      {state === "preview" && preview && (
        <div className="space-y-4">
          <GlassCard padding="md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {preview.filename}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {preview.parsed.transactions.length} transactions found
                  {preview.parsed.statement_period_start && (
                    <> - {formatDate(preview.parsed.statement_period_start)} to {formatDate(preview.parsed.statement_period_end ?? "")}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setState("idle"); setPreview(null); }}
                  className="px-3 py-1.5 rounded-button text-xs font-medium text-text-muted border border-black/[0.05] hover:border-black/[0.1] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={uploadMutation.isPending}
                  className="px-4 py-1.5 rounded-button text-xs font-semibold text-white disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                >
                  {uploadMutation.isPending ? "Importing..." : "Confirm Import"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Total Debit", value: `Rs.${preview.parsed.total_debit.toLocaleString("en-IN")}`, color: "#ef4444" },
                { label: "Total Credit", value: `Rs.${preview.parsed.total_credit.toLocaleString("en-IN")}`, color: "#22c55e" },
                { label: "Auto-categorized", value: `${autoCategorizedCount}/${preview.parsed.transactions.length}`, color: "#3b82f6" },
                { label: "Need review", value: String(needsReviewCount), color: "#f59e0b" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-card px-3 py-2.5"
                  style={{ background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.04)" }}
                >
                  <p className="text-xs font-sans font-semibold" style={{ color: s.color }}>
                    {s.value}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <PreviewTable
              transactions={preview.parsed.transactions}
              categorizations={preview.categorizations}
            />
          </GlassCard>
        </div>
      )}

      {/* Upload / parsing / error / idle states */}
      {(state === "idle" || state === "dragging" || state === "parsing" || state === "error") && (
        <GlassCard
          padding="lg"
          className={cn(
            "border-2 border-dashed transition-all duration-200",
            state === "idle" || state === "parsing" || state === "error"
              ? "cursor-pointer"
              : "",
            state === "dragging"
              ? "border-accent bg-accent-muted"
              : "border-black/[0.08] hover:border-black/[0.12]"
          )}
          onClick={() => {
            if (state !== "parsing") inputRef.current?.click();
          }}
        >
          <div
            onDragOver={(e) => { e.preventDefault(); setState("dragging"); }}
            onDragLeave={() => setState("idle")}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center py-10 text-center"
          >
            {state === "parsing" ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-accent-muted border border-accent-light flex items-center justify-center mb-4">
                  <FileSpreadsheet className="w-7 h-7 text-accent animate-pulse" />
                </div>
                <p className="text-base font-semibold text-text-primary">
                  Parsing statement...
                </p>
                <p className="text-sm text-text-muted mt-1">
                  Applying auto-categorization rules
                </p>
              </>
            ) : state === "error" ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                  <AlertCircle className="w-7 h-7 text-red-400" />
                </div>
                <p className="text-base font-semibold text-text-primary">
                  Failed to parse file
                </p>
                <p className="text-sm text-text-muted mt-1 max-w-sm">{errorMessage}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setState("idle"); setErrorMessage(""); }}
                  className="mt-4 text-xs text-accent hover:text-accent-hover"
                >
                  Try again
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-surface-DEFAULT border border-black/[0.05] flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7 text-text-muted" />
                </div>
                <p className="text-base font-semibold text-text-primary">
                  Drop your bank statement here
                </p>
                <p className="text-sm text-text-muted mt-1">or click to browse files</p>
                <p className="text-xs text-text-muted mt-3">
                  Supports IDFC FIRST Bank Excel export (.xlsx)
                </p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              // Reset so same file can be re-selected
              e.target.value = "";
            }}
          />
        </GlassCard>
      )}

      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-3">How it works</h3>
        <div className="space-y-3">
          {[
            { step: "1", text: "Export your IDFC FIRST Bank statement from NetBanking (Excel format)" },
            { step: "2", text: "Upload the file here - it is parsed automatically" },
            { step: "3", text: "Transactions are matched against your categorization rules" },
            { step: "4", text: "Review the preview and click Confirm Import" },
            { step: "5", text: "Review and approve unmatched transactions manually" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-accent-muted border border-accent-light flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-accent">{item.step}</span>
              </div>
              <p className="text-sm text-text-secondary">{item.text}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
