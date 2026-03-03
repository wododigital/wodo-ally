"use client";

import { useState } from "react";
import { Target, Plus, TrendingUp, Users, IndianRupee, TrendingDown } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils/cn";

// ─── Types ─────────────────────────────────────────────────────────────────

interface FinancialTarget {
  id: string;
  title: string;
  type: "revenue" | "mrr" | "new_clients" | "expense_reduction" | "custom";
  period: "Annual" | "Quarterly" | "Monthly";
  financial_year: string;
  target_amount: number;
  current_amount: number;
  currency: "INR" | "count";
  notes?: string;
  /** Fraction of the period already elapsed (0–1) */
  elapsed_pct: number;
  /** Human-readable period deadline */
  deadline_label: string;
}

// ─── Mock data ──────────────────────────────────────────────────────────────
// FY 2025-26 = Apr 2025 – Mar 2026. Current date: Mar 2026 → 11/12 months = 91.7% elapsed.
// Q4 = Jan–Mar 2026. Current date = early Mar → ~70% of quarter elapsed.

const TARGETS: FinancialTarget[] = [
  {
    id: "1",
    title: "Annual Revenue FY 2025-26",
    type: "revenue",
    period: "Annual",
    financial_year: "2025-26",
    target_amount: 6000000,
    current_amount: 3845000,
    currency: "INR",
    notes: "Target set at April 2025 board meeting",
    elapsed_pct: 0.917,
    deadline_label: "Mar 31, 2026",
  },
  {
    id: "2",
    title: "Monthly MRR Target - Q4",
    type: "mrr",
    period: "Quarterly",
    financial_year: "2025-26",
    target_amount: 500000,
    current_amount: 385000,
    currency: "INR",
    notes: "Q4 retainer revenue target",
    elapsed_pct: 0.70,
    deadline_label: "Mar 31, 2026",
  },
  {
    id: "3",
    title: "New Clients - Q4 FY26",
    type: "new_clients",
    period: "Quarterly",
    financial_year: "2025-26",
    target_amount: 5,
    current_amount: 2,
    currency: "count",
    notes: "Target 5 new clients in Jan-Mar 2026",
    elapsed_pct: 0.70,
    deadline_label: "Mar 31, 2026",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ElementType> = {
  revenue: IndianRupee,
  mrr: TrendingUp,
  new_clients: Users,
  expense_reduction: TrendingDown,
  custom: Target,
};

const TYPE_COLORS: Record<string, string> = {
  revenue: "#fd7e14",
  mrr: "#3b82f6",
  new_clients: "#16a34a",
  expense_reduction: "#ef4444",
  custom: "#8b5cf6",
};

type Trajectory = "On Track" | "Behind" | "Ahead";

function getTrajectory(pct: number, elapsed: number): Trajectory {
  const delta = pct / 100 - elapsed;
  if (delta >= 0.05) return "Ahead";
  if (delta <= -0.08) return "Behind";
  return "On Track";
}

const TRAJECTORY_STYLES: Record<Trajectory, { label: string; bg: string; color: string }> = {
  "Ahead":    { label: "Ahead",    bg: "rgba(22,163,74,0.10)",  color: "#16a34a" },
  "On Track": { label: "On Track", bg: "rgba(59,130,246,0.10)", color: "#3b82f6" },
  "Behind":   { label: "Behind",   bg: "rgba(239,68,68,0.10)",  color: "#ef4444" },
};

function getProjectedLabel(target: FinancialTarget): string | null {
  const { current_amount, target_amount, elapsed_pct, deadline_label } = target;
  if (current_amount >= target_amount) return "Completed";
  if (elapsed_pct <= 0) return null;
  // months remaining to complete at current pace
  const monthsElapsed = elapsed_pct * (target.period === "Annual" ? 12 : target.period === "Quarterly" ? 3 : 1);
  if (monthsElapsed === 0) return null;
  const pacePerMonth = current_amount / monthsElapsed;
  const remaining = target_amount - current_amount;
  const monthsNeeded = remaining / pacePerMonth;
  // Approximate: if we need fewer months than remain → on track → mention deadline
  const periodMonths = target.period === "Annual" ? 12 : target.period === "Quarterly" ? 3 : 1;
  const monthsLeft = periodMonths - monthsElapsed;
  if (monthsNeeded <= monthsLeft + 0.5) return `By ${deadline_label} at current pace`;
  const extraMonths = Math.ceil(monthsNeeded - monthsLeft);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const today = new Date(2026, 2, 3); // March 2026
  today.setMonth(today.getMonth() + extraMonths);
  return `Projected: ${months[today.getMonth()]} ${today.getFullYear()} at current pace`;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TargetsPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Financial Targets"
        description="Set and track your business goals"
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            <Plus className="w-4 h-4" />
            New Target
          </button>
        }
      />

      {/* New Target Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          {/* Modal */}
          <div className="relative w-full max-w-lg glass-card rounded-card shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-black/[0.06]">
              <h3 className="text-sm font-semibold text-text-primary">New Target</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-text-muted hover:text-text-primary transition-colors text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Title</label>
                <input type="text" className="glass-input" placeholder="e.g. Annual Revenue Target FY 2026-27" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Type</label>
                  <select className="glass-input">
                    <option value="revenue">Revenue</option>
                    <option value="mrr">MRR</option>
                    <option value="new_clients">New Clients</option>
                    <option value="expense_reduction">Expense Reduction</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Period</label>
                  <select className="glass-input">
                    <option value="annual">Annual</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Financial Year</label>
                  <select className="glass-input">
                    <option value="2025-26">2025-26</option>
                    <option value="2026-27">2026-27</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Target Amount</label>
                  <input type="number" className="glass-input font-sans" placeholder="0" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Notes (optional)</label>
                <input type="text" className="glass-input" placeholder="e.g. Target set at board meeting" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-black/[0.06]">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-button text-sm text-text-secondary bg-surface-DEFAULT border border-black/[0.05]"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-button text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
              >
                Save Target
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {TARGETS.map((target) => {
          const pct = Math.min(Math.round((target.current_amount / target.target_amount) * 100), 100);
          const isCount = target.currency === "count";
          const Icon = TYPE_ICONS[target.type] ?? Target;
          const color = TYPE_COLORS[target.type] ?? "#fd7e14";
          const remaining = target.target_amount - target.current_amount;
          const trajectory = getTrajectory(pct, target.elapsed_pct);
          const { bg: tBg, color: tColor, label: tLabel } = TRAJECTORY_STYLES[trajectory];
          const projected = getProjectedLabel(target);

          // Monthly pace breakdown
          const periodMonths = target.period === "Annual" ? 12 : target.period === "Quarterly" ? 3 : 1;
          const monthsElapsed = Math.round(target.elapsed_pct * periodMonths);
          const avgPerMonth = monthsElapsed > 0 ? target.current_amount / monthsElapsed : 0;
          const neededPerMonth = monthsElapsed < periodMonths
            ? remaining / (periodMonths - monthsElapsed)
            : 0;

          return (
            <GlassCard key={target.id} padding="md">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-button" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary leading-snug">{target.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{target.period} - FY {target.financial_year}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <span className="text-lg font-bold font-sans" style={{ color: pct >= 80 ? "#16a34a" : pct >= 50 ? color : "#3b82f6" }}>
                    {pct}%
                  </span>
                  {/* Trajectory badge */}
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: tBg, color: tColor }}
                  >
                    {tLabel}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Progress bar */}
                <div className="relative h-2 bg-black/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? "#16a34a" : pct >= 50 ? color : "#3b82f6" }}
                  />
                  {/* Time elapsed marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-black/20 rounded-full"
                    style={{ left: `${target.elapsed_pct * 100}%` }}
                    title={`${Math.round(target.elapsed_pct * 100)}% of period elapsed`}
                  />
                </div>
                <p className="text-[10px] text-text-muted">
                  {Math.round(target.elapsed_pct * 100)}% of period elapsed
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-card" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <p className="text-xs text-text-muted">Current</p>
                    <p className="text-base font-bold font-sans text-text-primary mt-0.5">
                      {isCount ? target.current_amount : `Rs.${(target.current_amount / 100000).toFixed(1)}L`}
                    </p>
                  </div>
                  <div className="p-3 rounded-card" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <p className="text-xs text-text-muted">Target</p>
                    <p className="text-base font-bold font-sans text-text-primary mt-0.5">
                      {isCount ? target.target_amount : `Rs.${(target.target_amount / 100000).toFixed(1)}L`}
                    </p>
                  </div>
                </div>

                {/* Monthly pace */}
                {!isCount && avgPerMonth > 0 && (
                  <div className="flex items-center justify-between text-xs text-text-muted border-t border-black/[0.05] pt-2.5">
                    <span>Avg/month so far</span>
                    <span className="font-sans font-medium text-text-secondary">
                      Rs.{(avgPerMonth / 1000).toFixed(0)}K
                    </span>
                  </div>
                )}
                {!isCount && neededPerMonth > 0 && (
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>Needed/month to hit goal</span>
                    <span className="font-sans font-medium" style={{ color: neededPerMonth > avgPerMonth * 1.1 ? "#ef4444" : "#16a34a" }}>
                      Rs.{(neededPerMonth / 1000).toFixed(0)}K
                    </span>
                  </div>
                )}

                {/* Projected label */}
                {projected && (
                  <p className="text-xs text-text-muted italic">{projected}</p>
                )}

                {/* Remaining */}
                <p className="text-xs text-text-muted border-t border-black/[0.05] pt-2">
                  {isCount
                    ? `${remaining} more ${remaining === 1 ? "client" : "clients"} to go`
                    : `Rs.${(remaining / 100000).toFixed(1)}L remaining to reach goal`}
                </p>

                {target.notes && (
                  <p className="text-xs text-text-muted italic">{target.notes}</p>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
