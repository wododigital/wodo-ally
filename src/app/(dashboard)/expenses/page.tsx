"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Upload,
  Search,
  TrendingDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import {
  useTransactions,
  useExpenseCategories,
  useExpenseSummary,
  useUpdateTransaction,
} from "@/lib/hooks/use-transactions";

// Category colors by name for fallback styling
const FALLBACK_COLOR = "#9ca3af";

// ─── Inline edit modal ────────────────────────────────────────────────────────

interface EditModalProps {
  transactionId: string;
  particulars: string;
  currentCategoryId: string | null;
  currentNotes: string | null;
  onClose: () => void;
}

function EditModal({
  transactionId,
  particulars,
  currentCategoryId,
  currentNotes,
  onClose,
}: EditModalProps) {
  const { data: categories } = useExpenseCategories();
  const updateMutation = useUpdateTransaction();

  const [categoryId, setCategoryId] = useState<string>(currentCategoryId ?? "");
  const [notes, setNotes] = useState(currentNotes ?? "");

  function handleSave() {
    updateMutation.mutate(
      {
        id: transactionId,
        data: {
          category_id: categoryId || null,
          notes: notes || null,
          is_manually_reviewed: true,
        },
      },
      { onSuccess: onClose }
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.3)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 space-y-4"
        style={{ background: "var(--surface)", border: "1px solid rgba(0,0,0,0.08)" }}
      >
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Edit Transaction</h3>
          <p className="text-xs text-text-muted mt-0.5 truncate">{particulars}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="glass-input text-sm"
            >
              <option value="">Uncategorized</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note..."
              className="glass-input text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-button text-xs font-medium text-text-muted border border-black/[0.05] hover:border-black/[0.1] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            {updateMutation.isPending ? (
              "Saving..."
            ) : (
              <>
                <Check className="w-3 h-3" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [showOnly, setShowOnly] = useState<"all" | "unreviewed">("all");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingTxnId, setEditingTxnId] = useState<string | null>(null);

  // Fetch real data
  const { data: transactions = [], isLoading: txnLoading } = useTransactions({
    categoryId: activeCategory ?? undefined,
    search: search || undefined,
  });

  const { data: summaryItems = [], isLoading: summaryLoading } = useExpenseSummary();
  const { data: categories = [] } = useExpenseCategories();

  // Build a color map from categories
  const colorMap = new Map<string, string>();
  for (const c of categories) {
    if (c.id && c.color) colorMap.set(c.id, c.color);
  }

  const totalExpenses = summaryItems.reduce((s, c) => s + c.total_debit, 0);

  // Filter locally for unreviewed
  const filtered =
    showOnly === "unreviewed"
      ? transactions.filter((t) => !t.is_manually_reviewed && !t.is_auto_categorized)
      : transactions;

  const uncategorized = transactions.filter((t) => !t.category_id).length;

  // Find the transaction being edited
  const editingTxn = editingTxnId
    ? filtered.find((t) => t.id === editingTxnId)
    : null;

  // Pagination for months: derive sorted unique months from transactions
  const allMonths: string[] = [];
  const monthSet = new Set<string>();
  for (const t of transactions) {
    if (!t.transaction_date) continue;
    const d = new Date(t.transaction_date);
    const key = `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
    if (!monthSet.has(key)) {
      monthSet.add(key);
      allMonths.push(key);
    }
  }
  // allMonths derived from sorted transactions (already desc) so first = latest
  const currentMonth = allMonths[0] ?? "";

  return (
    <div className="space-y-6 animate-fade-in">
      {editingTxn && (
        <EditModal
          transactionId={editingTxn.id}
          particulars={editingTxn.particulars}
          currentCategoryId={editingTxn.category_id}
          currentNotes={editingTxn.notes}
          onClose={() => setEditingTxnId(null)}
        />
      )}

      <PageHeader
        title="Expenses"
        description="Track and categorize all business expenses"
        action={
          <Link
            href="/expenses/upload"
            className="flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            <Upload className="w-4 h-4" />
            Upload Statement
          </Link>
        }
      />

      {/* Month indicator */}
      {currentMonth && (
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-button text-sm"
            style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}
          >
            <ChevronLeft className="w-4 h-4 opacity-20" />
            <span className="text-sm font-medium text-text-primary min-w-[80px] text-center">
              {currentMonth}
            </span>
            <ChevronRight className="w-4 h-4 opacity-20" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Expenses"
          value={
            summaryLoading
              ? "..."
              : `Rs.${(totalExpenses / 1000).toFixed(1)}K`
          }
          icon={TrendingDown}
          trend="neutral"
          change="All transactions"
        />
        <StatCard
          title="Uncategorized"
          value={txnLoading ? "..." : String(uncategorized)}
          icon={Filter}
          trend="neutral"
          change="Need review"
        />
        <StatCard
          title="Transactions"
          value={txnLoading ? "..." : String(transactions.length)}
          icon={TrendingDown}
          trend="neutral"
          change="Total loaded"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category breakdown */}
        <GlassCard padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">By Category</h3>
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                className="text-xs text-accent hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>

          {summaryLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-black/[0.04] rounded animate-pulse" />
              ))}
            </div>
          ) : summaryItems.length === 0 ? (
            <p className="text-xs text-text-muted py-4 text-center">
              No expense data yet
            </p>
          ) : (
            <div className="space-y-3">
              {summaryItems.map((item) => {
                const pct =
                  totalExpenses > 0
                    ? Math.round((item.total_debit / totalExpenses) * 100)
                    : 0;
                const color = item.category_color ?? FALLBACK_COLOR;
                const isActive = activeCategory === item.category_id;

                return (
                  <button
                    key={item.category_id ?? "__uncategorized__"}
                    onClick={() =>
                      setActiveCategory(
                        isActive ? null : (item.category_id ?? null)
                      )
                    }
                    className={cn(
                      "w-full text-left transition-all rounded-card px-2 py-1.5 -mx-2",
                      isActive ? "bg-accent-muted" : "hover:bg-black/[0.025]"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-xs",
                          isActive
                            ? "text-accent font-medium"
                            : "text-text-secondary"
                        )}
                      >
                        {item.category_name}
                      </span>
                      <span className="text-xs font-sans text-text-primary">
                        Rs.{item.total_debit.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isActive ? "#fd7e14" : color,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-black/[0.05] flex justify-between">
            <span className="text-sm font-semibold text-text-primary">Total</span>
            <span className="text-sm font-sans font-bold text-text-primary">
              Rs.{totalExpenses.toLocaleString("en-IN")}
            </span>
          </div>
        </GlassCard>

        {/* Transaction list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
                className="glass-input pl-9"
              />
            </div>
            <button
              onClick={() =>
                setShowOnly(showOnly === "all" ? "unreviewed" : "all")
              }
              className={cn(
                "px-3 py-2 rounded-button text-xs font-medium border transition-all",
                showOnly === "unreviewed"
                  ? "bg-accent-muted text-accent border-accent-light"
                  : "bg-surface-DEFAULT text-text-secondary border-black/[0.05]"
              )}
            >
              Unreviewed
            </button>
          </div>

          {activeCategory && (
            <p className="text-xs text-text-muted px-1">
              Filtered:{" "}
              <span className="text-accent font-medium">
                {summaryItems.find((s) => s.category_id === activeCategory)
                  ?.category_name ?? "Category"}
              </span>
            </p>
          )}

          <GlassCard padding="none">
            {txnLoading ? (
              <div className="space-y-0">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-5 py-3.5 border-b border-black/[0.05]"
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-48 bg-black/[0.06] rounded animate-pulse" />
                      <div className="h-3 w-32 bg-black/[0.04] rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-20 bg-black/[0.06] rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-text-muted">
                {transactions.length === 0
                  ? "No transactions yet. Upload a bank statement to get started."
                  : "No transactions match your filters"}
              </div>
            ) : (
              filtered.map((txn, idx) => {
                const catColor = txn.category_id
                  ? (colorMap.get(txn.category_id) ?? FALLBACK_COLOR)
                  : FALLBACK_COLOR;
                const catName =
                  txn.expense_categories?.name ?? "Uncategorized";

                return (
                  <div
                    key={txn.id}
                    className={cn(
                      "flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-black/[0.015] transition-colors",
                      idx < filtered.length - 1 && "border-b border-black/[0.05]"
                    )}
                    onClick={() => setEditingTxnId(txn.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {txn.particulars}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-text-muted">
                          {formatDate(txn.transaction_date)}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background: txn.is_auto_categorized
                              ? "rgba(59,130,246,0.08)"
                              : "rgba(253,126,20,0.08)",
                            color: txn.is_auto_categorized
                              ? "#3b82f6"
                              : "#fd7e14",
                          }}
                        >
                          {catName}
                        </span>
                        {!txn.is_auto_categorized && (
                          <span className="text-xs text-yellow-400/80">
                            Manual
                          </span>
                        )}
                        {txn.is_manually_reviewed && (
                          <Check className="w-3 h-3 text-green-400" />
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
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
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
