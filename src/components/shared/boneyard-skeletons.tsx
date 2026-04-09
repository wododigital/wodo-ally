"use client";

import { Skeleton } from "@/components/shared/loading-skeleton";

// ─── Invoice Detail Skeleton ─────────────────────────────────────────────────
// Replaces the simple Loader2 spinner with a proper layout skeleton
export function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Header row: invoice number + status + actions */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-button" />
          <Skeleton className="h-9 w-28 rounded-button" />
          <Skeleton className="h-9 w-20 rounded-button" />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Invoice details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Client + dates card */}
          <div className="glass-card p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
          </div>

          {/* Line items table */}
          <div className="glass-card p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            {/* Table header */}
            <div className="flex items-center gap-4 px-2 py-2">
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
            {/* Table rows */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-2 py-3 border-t border-black/[0.04]">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
            {/* Totals */}
            <div className="flex flex-col items-end gap-2 pt-4 border-t border-black/[0.06]">
              <div className="flex items-center gap-8">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex items-center gap-8">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center gap-8 pt-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Payment sidebar */}
        <div className="space-y-5">
          {/* Balance card */}
          <div className="glass-card p-5 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          {/* Payment history */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-28 rounded-button" />
            </div>
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-t border-black/[0.04]">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Invoice Edit Skeleton ───────────────────────────────────────────────────
export function InvoiceEditSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-8 w-56" />

      <div className="glass-card p-6 space-y-5">
        {/* Form fields */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full rounded-card" />
            </div>
          ))}
        </div>

        {/* Line items */}
        <div className="space-y-3 pt-4">
          <Skeleton className="h-4 w-20" />
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-32 rounded-card" />
              <Skeleton className="h-10 flex-1 rounded-card" />
              <Skeleton className="h-10 w-16 rounded-card" />
              <Skeleton className="h-10 w-28 rounded-card" />
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="flex flex-col items-end gap-2 pt-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-6 w-44" />
        </div>
      </div>
    </div>
  );
}

// ─── Pipeline Skeleton ───────────────────────────────────────────────────────
export function PipelineSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Month tabs */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 flex-1 rounded-xl" />
        ))}
      </div>

      {/* Pipeline cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-button shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-20 rounded" />
            <Skeleton className="h-8 w-24 rounded-button" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Expenses Skeleton ───────────────────────────────────────────────────────
export function ExpensesSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 glass-card">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-20 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

// ─── TDS Skeleton ────────────────────────────────────────────────────────────
export function TdsSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-32 rounded-button" />
      </div>
      {/* Cards */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-12 rounded-card" />
            <Skeleton className="h-12 rounded-card" />
            <Skeleton className="h-12 rounded-card" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Contracts Skeleton ──────────────────────────────────────────────────────
export function ContractsSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-button shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-black/[0.04]">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
