"use client";

import { useState } from "react";
import Link from "next/link";
import { Receipt, Upload, Search, TrendingDown, Filter } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

const TRANSACTIONS = [
  { id: "1", date: "2026-02-28", particulars: "GOOGLE WORKSPACE MONTHLY", debit: 1499, credit: null, category: "Software & Tools", auto: true },
  { id: "2", date: "2026-02-27", particulars: "UBER TECHNOLOGIES - TRIP FEE", debit: 380, credit: null, category: "Travel & Conveyance", auto: true },
  { id: "3", date: "2026-02-25", particulars: "DIGITALOCEAN SINGAPORE - DROPLETS", debit: 6200, credit: null, category: "Hosting & Infrastructure", auto: true },
  { id: "4", date: "2026-02-24", particulars: "AMAZON PAY - OFFICE SUPPLIES", debit: 2450, credit: null, category: "Office & Admin", auto: true },
  { id: "5", date: "2026-02-22", particulars: "FREELANCER PAYMENT - RAVI KUMAR DESIGN", debit: 15000, credit: null, category: "Freelancer Payments", auto: false },
  { id: "6", date: "2026-02-20", particulars: "BANK CHARGES - NEFT TRANSACTION FEE", debit: 17.7, credit: null, category: "Banking & Finance", auto: true },
  { id: "7", date: "2026-02-18", particulars: "SKYDO INWARD - SEA WONDERS INV G00109", debit: null, credit: 89600, category: "Income", auto: false },
  { id: "8", date: "2026-02-15", particulars: "NOTION TEAM MONTHLY - PRODUCTIVITY", debit: 1200, credit: null, category: "Software & Tools", auto: true },
  { id: "9", date: "2026-02-12", particulars: "ZOMATO BUSINESS - TEAM LUNCH", debit: 1850, credit: null, category: "Office & Admin", auto: true },
  { id: "10", date: "2026-02-10", particulars: "NANDHINIDELUXE PAYMENT - INV G00110", debit: null, credit: 76700, category: "Income", auto: false },
];

const CATEGORY_SUMMARY = [
  { name: "Software & Tools", amount: 2699, color: "#3b82f6", pct: 9 },
  { name: "Hosting & Infrastructure", amount: 6200, color: "#8b5cf6", pct: 21 },
  { name: "Freelancer Payments", amount: 15000, color: "#ec4899", pct: 50 },
  { name: "Office & Admin", amount: 4300, color: "#22c55e", pct: 14 },
  { name: "Travel & Conveyance", amount: 380, color: "#eab308", pct: 1 },
  { name: "Banking & Finance", amount: 17.7, color: "#ef4444", pct: 1 },
];

const totalExpenses = CATEGORY_SUMMARY.reduce((s, c) => s + c.amount, 0);

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [showOnly, setShowOnly] = useState<"all" | "unreviewed">("all");

  const filtered = TRANSACTIONS.filter((t) => {
    const matchSearch = t.particulars.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = showOnly === "all" || !t.auto;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Expenses" value={`Rs.${(totalExpenses / 1000).toFixed(1)}K`} icon={TrendingDown} trend="neutral" change="Feb 2026" />
        <StatCard title="Total Credits" value="Rs.1.66L" icon={Receipt} trend="up" change="Payments received" />
        <StatCard title="Uncategorized" value="2" icon={Filter} trend="neutral" change="Need review" />
        <StatCard title="Transactions" value={String(TRANSACTIONS.length)} icon={Receipt} trend="neutral" change="This month" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category breakdown */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">By Category</h3>
          <div className="space-y-3">
            {CATEGORY_SUMMARY.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-secondary">{cat.name}</span>
                  <span className="text-xs font-sans text-text-primary">Rs.{cat.amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between">
            <span className="text-sm font-semibold text-text-primary">Total</span>
            <span className="text-sm font-sans font-bold text-text-primary">Rs.{totalExpenses.toLocaleString("en-IN")}</span>
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
              onClick={() => setShowOnly(showOnly === "all" ? "unreviewed" : "all")}
              className={cn(
                "px-3 py-2 rounded-button text-xs font-medium border transition-all",
                showOnly === "unreviewed"
                  ? "bg-accent-muted text-accent border-accent-light"
                  : "bg-surface-DEFAULT text-text-secondary border-white/5"
              )}
            >
              Unreviewed
            </button>
          </div>

          <GlassCard padding="none">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-text-muted">No transactions found</div>
            ) : (
              filtered.map((txn, idx) => (
                <div
                  key={txn.id}
                  className={cn(
                    "flex items-center gap-4 px-5 py-3.5",
                    idx < filtered.length - 1 && "border-b border-white/5"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{txn.particulars}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted">{formatDate(txn.date)}</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background: txn.auto ? "rgba(59,130,246,0.08)" : "rgba(253,126,20,0.08)",
                          color: txn.auto ? "#3b82f6" : "#fd7e14",
                        }}
                      >
                        {txn.category}
                      </span>
                      {!txn.auto && (
                        <span className="text-xs text-yellow-400/80">Manual</span>
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
              ))
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
