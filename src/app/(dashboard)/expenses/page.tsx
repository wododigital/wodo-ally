"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Upload,
  Search,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkCard } from "@/components/shared/dark-section";
import { DateFilter, DateFilterState, resolveDateRange } from "@/components/shared/date-filter";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import {
  useTransactions,
  useExpenseCategories,
  useExpenseSummary,
} from "@/lib/hooks/use-transactions";

const FALLBACK_COLOR = "#9ca3af";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ mode: "all" });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const dateRange = useMemo(() => resolveDateRange(dateFilter), [dateFilter]);

  const summaryPeriod = dateRange
    ? {
        from: dateRange.start.toISOString().split("T")[0],
        to: dateRange.end.toISOString().split("T")[0],
      }
    : undefined;

  const { data: transactions = [], isLoading: txnLoading } = useTransactions({
    categoryId: activeCategory ?? undefined,
    search: search || undefined,
  });
  const { data: summaryItems = [], isLoading: summaryLoading } = useExpenseSummary(summaryPeriod);
  const { data: categories = [] } = useExpenseCategories();

  // Build color map
  const colorMap = new Map<string, string>();
  for (const c of categories) {
    if (c.id && c.color) colorMap.set(c.id, c.color);
  }

  // Client-side date filter
  const periodFiltered = useMemo(() => {
    if (!dateRange) return transactions;
    return transactions.filter((t) => {
      if (!t.transaction_date) return false;
      const d = new Date(t.transaction_date);
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [transactions, dateRange]);

  // KPI values
  const totalExpenses = periodFiltered.reduce((s, t) => s + (t.debit ?? 0), 0);
  const uncategorized = periodFiltered.filter((t) => !t.category_id).length;
  const reviewed = periodFiltered.filter((t) => t.is_manually_reviewed).length;
  const totalCatExpenses = summaryItems.reduce((s, c) => s + c.total_debit, 0);

  // Show last 10 in the panel
  const recentTransactions = periodFiltered.slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Dark KPI header */}
      <DarkSection>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
            Expenses Overview
          </p>
          <Link
            href="/expenses/upload"
            className="flex items-center gap-2 px-3.5 py-2 rounded-button text-xs font-semibold text-white shrink-0"
            style={{ background: "rgba(253,126,20,0.85)", border: "1px solid rgba(253,126,20,0.3)" }}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Statement
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: TrendingDown,  label: "Total Expenses", value: txnLoading ? "-" : `Rs.${(totalExpenses / 1000).toFixed(1)}K`, sub: "Debits in period",     color: "#ef4444" },
            { icon: BarChart3,     label: "Transactions",   value: txnLoading ? "-" : String(periodFiltered.length),               sub: "In selected period", color: "#3b82f6" },
            { icon: AlertCircle,   label: "Uncategorized",  value: txnLoading ? "-" : String(uncategorized),                       sub: "Need review",        color: "#f59e0b" },
            { icon: CheckCircle2,  label: "Reviewed",       value: txnLoading ? "-" : String(reviewed),                            sub: "Manually reviewed",  color: "#22c55e" },
          ].map((stat) => (
            <DarkCard key={stat.label} className="p-5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
                style={{ background: `${stat.color}18` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <p className="text-xl font-light font-sans mb-0.5" style={{ color: "rgba(255,255,255,0.92)" }}>
                {stat.value}
              </p>
              <p className="text-[11px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{stat.label}</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{stat.sub}</p>
            </DarkCard>
          ))}
        </div>
      </DarkSection>

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

      {/* 30 / 70 layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[30%_1fr] gap-6">

        {/* Left: Category breakdown */}
        <GlassCard padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">By Category</h3>
            {activeCategory && (
              <button onClick={() => setActiveCategory(null)} className="text-xs text-accent hover:underline">
                Clear
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
            <p className="text-xs text-text-muted py-4 text-center">No expense data</p>
          ) : (
            <div className="space-y-3">
              {summaryItems.map((item) => {
                const pct = totalCatExpenses > 0
                  ? Math.round((item.total_debit / totalCatExpenses) * 100)
                  : 0;
                const color = item.category_color ?? FALLBACK_COLOR;
                const isActive = activeCategory === item.category_id;

                return (
                  <button
                    key={item.category_id ?? "__uncategorized__"}
                    onClick={() => setActiveCategory(isActive ? null : (item.category_id ?? null))}
                    className={cn(
                      "w-full text-left transition-all rounded-card px-2 py-1.5 -mx-2",
                      isActive ? "bg-accent-muted" : "hover:bg-black/[0.025]"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-xs", isActive ? "text-accent font-medium" : "text-text-secondary")}>
                        {item.category_name}
                      </span>
                      <span className="text-xs font-sans text-text-primary">
                        Rs.{item.total_debit.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: isActive ? "#fd7e14" : color }}
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
              Rs.{totalCatExpenses.toLocaleString("en-IN")}
            </span>
          </div>
        </GlassCard>

        {/* Right: Recent transactions */}
        <GlassCard padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
            <h3 className="text-sm font-semibold text-text-primary">Recent Transactions</h3>
            <Link
              href="/expenses/transactions"
              className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              View all {periodFiltered.length > 0 ? `${periodFiltered.length} ` : ""}transactions
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {txnLoading ? (
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
          ) : recentTransactions.length === 0 ? (
            <div className="py-16 text-center text-sm text-text-muted">
              {transactions.length === 0
                ? "No transactions yet. Upload a bank statement to get started."
                : "No transactions match your filters."}
            </div>
          ) : (
            <>
              {recentTransactions.map((txn, idx) => {
                const catColor = txn.category_id
                  ? (colorMap.get(txn.category_id) ?? FALLBACK_COLOR)
                  : FALLBACK_COLOR;
                const catName = txn.expense_categories?.name ?? "Uncategorized";

                return (
                  <div
                    key={txn.id}
                    className={cn(
                      "flex items-center gap-4 px-5 py-3.5",
                      idx < recentTransactions.length - 1 && "border-b border-black/[0.05]"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{txn.particulars}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-text-muted">{formatDate(txn.transaction_date)}</span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: `${catColor}15`, color: catColor }}
                        >
                          {catName}
                        </span>
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
              })}

              {periodFiltered.length > 10 && (
                <div className="px-5 py-4 border-t border-black/[0.06]">
                  <Link
                    href="/expenses/transactions"
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-button text-sm font-medium text-accent border border-accent-light hover:bg-accent-muted transition-all"
                  >
                    View all {periodFiltered.length} transactions
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
