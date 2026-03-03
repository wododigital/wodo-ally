"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils/cn";

type UploadState = "idle" | "dragging" | "uploading" | "done" | "error";

export default function UploadStatementPage() {
  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setState("error");
      return;
    }
    setFileName(file.name);
    setState("uploading");
    setTimeout(() => setState("done"), 1500);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setState("idle");
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <Link href="/expenses" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Expenses
        </Link>
        <PageHeader title="Upload Bank Statement" description="Upload your IDFC FIRST Bank statement (Excel/CSV format)" />
      </div>

      {state !== "done" ? (
        <GlassCard
          padding="lg"
          className={cn(
            "border-2 border-dashed transition-all duration-200 cursor-pointer",
            state === "dragging" ? "border-accent bg-accent-muted" : "border-black/[0.08] hover:border-black/[0.12]"
          )}
          onClick={() => inputRef.current?.click()}
        >
          <div
            onDragOver={(e) => { e.preventDefault(); setState("dragging"); }}
            onDragLeave={() => setState("idle")}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center py-10 text-center"
          >
            {state === "uploading" ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-accent-muted border border-accent-light flex items-center justify-center mb-4">
                  <FileSpreadsheet className="w-7 h-7 text-accent animate-pulse" />
                </div>
                <p className="text-base font-semibold text-text-primary">Processing {fileName}...</p>
                <p className="text-sm text-text-muted mt-1">Parsing transactions and applying auto-categorization rules</p>
              </>
            ) : state === "error" ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                  <AlertCircle className="w-7 h-7 text-red-400" />
                </div>
                <p className="text-base font-semibold text-text-primary">Invalid file format</p>
                <p className="text-sm text-text-muted mt-1">Please upload an Excel (.xlsx, .xls) or CSV file</p>
                <button onClick={(e) => { e.stopPropagation(); setState("idle"); }} className="mt-4 text-xs text-accent hover:text-accent-hover">Try again</button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-surface-DEFAULT border border-black/[0.05] flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7 text-text-muted" />
                </div>
                <p className="text-base font-semibold text-text-primary">Drop your bank statement here</p>
                <p className="text-sm text-text-muted mt-1">or click to browse files</p>
                <p className="text-xs text-text-muted mt-3">Supports IDFC FIRST Bank Excel export (.xlsx) and CSV</p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </GlassCard>
      ) : (
        <GlassCard padding="lg">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-400" />
            </div>
            <p className="text-base font-semibold text-text-primary">Statement parsed successfully</p>
            <p className="text-sm text-text-muted mt-1">{fileName}</p>
            <div className="grid grid-cols-3 gap-6 mt-6 w-full max-w-sm">
              {[
                { label: "Transactions", value: "47" },
                { label: "Auto-categorized", value: "39" },
                { label: "Need review", value: "8" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold font-sans text-text-primary">{stat.value}</p>
                  <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
            <Link
              href="/expenses"
              className="mt-6 px-6 py-2.5 rounded-button text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
            >
              Review Transactions
            </Link>
          </div>
        </GlassCard>
      )}

      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-3">How it works</h3>
        <div className="space-y-3">
          {[
            { step: "1", text: "Export your IDFC FIRST Bank statement from NetBanking (Excel format)" },
            { step: "2", text: "Upload the file here - it is parsed automatically" },
            { step: "3", text: "Transactions are matched against your categorization rules" },
            { step: "4", text: "Review and approve unmatched transactions manually" },
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
