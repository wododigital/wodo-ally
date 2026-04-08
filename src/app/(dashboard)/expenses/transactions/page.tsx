"use client";

import { useState, useMemo, useEffect } from "react";
import { Check, ChevronUp, ChevronDown, Search, X } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { Pagination, paginateArray } from "@/components/shared/pagination";
import { DateFilter, DateFilterState, resolveDateRange } from "@/components/shared/date-filter";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import {
  useTransactions,
  useExpenseCategories,
  useUpdateTransaction,
} from "@/lib/hooks/use-transactions";
import { toast } from "sonner";

const FALLBACK_COLOR = "#9ca3af";

type SortField = "transaction_date" | "particulars" | "debit" | "category";
type SortDir = "asc" | "desc";

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-20" />;
  return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-accent" /> : <ChevronDown className="w-3 h-3 text-accent" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ mode: "all" });
  const [sortField, setSortField] = useState<SortField>("transaction_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  const dateRange = useMemo(() => resolveDateRange(dateFilter), [dateFilter]);

  const { data: transactions = [], isLoading } = useTransactions({ search: search || undefined });
  const { data: categories = [] } = useExpenseCategories();
  const updateMutation = useUpdateTransaction();

  const colorMap = new Map<string, string>();
  for (const c of categories) {
    if (c.id && c.color) colorMap.set(c.id, c.color);
  }

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  const filtered = useMemo(() => {
    let list = transactions;
    if (dateRange) {
      list = list.filter((t) => {
        if (!t.transaction_date) return false;
        const d = new Date(t.transaction_date);
        return d >= dateRange.start && d <= dateRange.end;
      });
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "transaction_date") {
        cmp = new Date(a.transaction_date ?? 0).getTime() - new Date(b.transaction_date ?? 0).getTime();
      } else if (sortField === "particulars") {
        cmp = (a.particulars ?? "").localeCompare(b.particulars ?? "");
      } else if (sortField === "debit") {
        cmp = (a.debit ?? 0) - (b.debit ?? 0);
      } else if (sortField === "category") {
        cmp = (a.expense_categories?.name ?? "").localeCompare(b.expense_categories?.name ?? "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [transactions, dateRange, sortField, sortDir]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [search, dateFilter, sortField, sortDir]);

  const { paged: pagedTransactions, total: totalFiltered } = paginateArray(filtered, currentPage, PAGE_SIZE);

  const totalDebit = filtered.reduce((s, t) => s + (t.debit ?? 0), 0);

  function startEdit(txnId: string, currentCategoryId: string | null) {
    setEditingId(txnId);
    setEditCategoryId(currentCategoryId ?? "");
  }

  function saveCategory(txnId: string) {
    updateMutation.mutate(
      { id: txnId, data: { category_id: editCategoryId || null, is_manually_reviewed: true } },
      {
        onSuccess: () => { setEditingId(null); toast.success("Category updated"); },
        onError: () => toast.error("Failed to update category"),
      }
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Search + date filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="glass-input pl-9"
          />
        </div>
        <DateFilter value={dateFilter} onChange={setDateFilter} />
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-6 px-1">
        <p className="text-sm text-text-muted">
          <span className="font-semibold text-text-primary">{filtered.length}</span>
          {" "}transactions{dateRange ? " in period" : " total"}
        </p>
        {totalDebit > 0 && (
          <p className="text-sm text-text-muted">
            Total debit:{" "}
            <span className="font-semibold text-red-400">
              Rs.{totalDebit.toLocaleString("en-IN")}
            </span>
          </p>
        )}
      </div>

      {/* Table */}
      <GlassCard padding="none">
        {/* Table header */}
        <div
          className="hidden md:grid grid-cols-[120px_1fr_180px_120px] gap-4 px-5 py-3 border-b border-black/[0.06]"
          style={{ background: "rgba(255,255,255,0.65)" }}
        >
          {([
            { label: "Date",        field: "transaction_date" as SortField },
            { label: "Particulars", field: "particulars"       as SortField },
            { label: "Category",    field: "category"          as SortField },
            { label: "Amount",      field: "debit"             as SortField },
          ] as const).map(({ label, field }) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors"
            >
              {label}
              <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
            </button>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="space-y-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-black/[0.05]">
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-48 bg-black/[0.06] rounded animate-pulse" />
                  <div className="h-3 w-32 bg-black/[0.04] rounded animate-pulse" />
                </div>
                <div className="h-4 w-20 bg-black/[0.06] rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-text-muted">
            {transactions.length === 0
              ? "No transactions yet. Upload a bank statement to get started."
              : "No transactions match your filters."}
          </div>
        ) : (
          pagedTransactions.map((txn, idx) => {
            const isEditing = editingId === txn.id;
            const catColor = txn.category_id
              ? (colorMap.get(txn.category_id) ?? FALLBACK_COLOR)
              : FALLBACK_COLOR;
            const catName = txn.expense_categories?.name ?? "Uncategorized";

            return (
              <div
                key={txn.id}
                className={cn(
                  "grid grid-cols-1 md:grid-cols-[120px_1fr_180px_120px] gap-4 px-5 py-3.5 items-center hover:bg-black/[0.015] transition-colors",
                  idx < filtered.length - 1 && "border-b border-black/[0.05]"
                )}
              >
                {/* Date */}
                <span className="text-xs font-sans text-text-muted">
                  {formatDate(txn.transaction_date)}
                </span>

                {/* Particulars */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{txn.particulars}</p>
                  {txn.is_manually_reviewed && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-green-400 mt-0.5">
                      <Check className="w-2.5 h-2.5" /> Reviewed
                    </span>
                  )}
                </div>

                {/* Category - editable */}
                <div>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={editCategoryId}
                        onChange={(e) => setEditCategoryId(e.target.value)}
                        className="glass-input text-xs py-1 flex-1"
                        autoFocus
                      >
                        <option value="">Uncategorized</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => saveCategory(txn.id)}
                        disabled={updateMutation.isPending}
                        className="p-1.5 rounded text-white shrink-0 disabled:opacity-60"
                        style={{ background: "#22c55e" }}
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded text-text-muted border border-black/[0.08] hover:border-black/[0.15] transition-all shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(txn.id, txn.category_id)}
                      className="text-xs px-2 py-1 rounded transition-all hover:opacity-75"
                      style={{
                        background: `${catColor}15`,
                        color: catColor,
                        border: `1px solid ${catColor}30`,
                      }}
                    >
                      {catName}
                    </button>
                  )}
                </div>

                {/* Amount */}
                <div className="text-right">
                  {txn.debit != null && (
                    <p className="text-sm font-sans font-semibold text-red-400">
                      -Rs.{txn.debit.toLocaleString("en-IN")}
                    </p>
                  )}
                  {txn.credit != null && (
                    <p className="text-sm font-sans font-semibold text-green-400">
                      +Rs.{txn.credit.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <Pagination
          currentPage={currentPage}
          totalItems={totalFiltered}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </GlassCard>
    </div>
  );
}
