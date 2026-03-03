"use client";

import { useState } from "react";
import { Target, Plus, TrendingUp, Users, IndianRupee, TrendingDown, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { cn } from "@/lib/utils/cn";
import {
  useTargets,
  useCreateTarget,
  useDeleteTarget,
  useRefreshTargetProgress,
} from "@/lib/hooks/use-targets";
import type { Database } from "@/types/database";

type TargetRow = Database["public"]["Tables"]["financial_targets"]["Row"];
type TargetType = TargetRow["target_type"];
type PeriodType = TargetRow["period_type"];

// ─── FY helpers ───────────────────────────────────────────────────────────────

const CURRENT_FY = "2025-26";

/**
 * Computes what fraction of the target period has elapsed (0 to 1).
 * Indian FY: Apr 1 2025 - Mar 31 2026 for '2025-26'
 */
function computeElapsedPct(target: TargetRow): number {
  const now = new Date();

  const [startYearStr] = (target.financial_year ?? CURRENT_FY).split("-");
  const fyStartYear = parseInt(startYearStr, 10);

  if (target.period_type === "annual") {
    const periodStart = new Date(fyStartYear, 3, 1); // Apr 1
    const periodEnd = new Date(fyStartYear + 1, 2, 31); // Mar 31
    const total = periodEnd.getTime() - periodStart.getTime();
    const elapsed = Math.min(now.getTime() - periodStart.getTime(), total);
    return Math.max(0, Math.min(1, elapsed / total));
  }

  if (target.period_type === "quarterly" && target.quarter) {
    const quarterBounds: Record<number, { start: Date; end: Date }> = {
      1: { start: new Date(fyStartYear, 3, 1), end: new Date(fyStartYear, 5, 30) },
      2: { start: new Date(fyStartYear, 6, 1), end: new Date(fyStartYear, 8, 30) },
      3: { start: new Date(fyStartYear, 9, 1), end: new Date(fyStartYear, 11, 31) },
      4: { start: new Date(fyStartYear + 1, 0, 1), end: new Date(fyStartYear + 1, 2, 31) },
    };
    const bounds = quarterBounds[target.quarter];
    if (!bounds) return 0;
    const total = bounds.end.getTime() - bounds.start.getTime();
    const elapsed = Math.min(now.getTime() - bounds.start.getTime(), total);
    return Math.max(0, Math.min(1, elapsed / total));
  }

  if (target.period_type === "monthly" && target.month) {
    // Calendar year for this month in the FY
    const calYear = target.month >= 4 ? fyStartYear : fyStartYear + 1;
    const periodStart = new Date(calYear, target.month - 1, 1);
    const periodEnd = new Date(calYear, target.month, 0); // last day
    const total = periodEnd.getTime() - periodStart.getTime();
    const elapsed = Math.min(now.getTime() - periodStart.getTime(), total);
    return Math.max(0, Math.min(1, elapsed / total));
  }

  return 0;
}

function getDeadlineLabel(target: TargetRow): string {
  const [startYearStr] = (target.financial_year ?? CURRENT_FY).split("-");
  const fyStartYear = parseInt(startYearStr, 10);

  if (target.period_type === "annual") return "Mar 31, " + (fyStartYear + 1);

  if (target.period_type === "quarterly" && target.quarter) {
    const quarterEnds: Record<number, string> = {
      1: `Jun 30, ${fyStartYear}`,
      2: `Sep 30, ${fyStartYear}`,
      3: `Dec 31, ${fyStartYear}`,
      4: `Mar 31, ${fyStartYear + 1}`,
    };
    return quarterEnds[target.quarter] ?? "";
  }

  if (target.period_type === "monthly" && target.month) {
    const calYear = target.month >= 4 ? fyStartYear : fyStartYear + 1;
    const lastDay = new Date(calYear, target.month, 0).getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[target.month - 1]} ${lastDay}, ${calYear}`;
  }

  return "";
}

// ─── Display helpers ──────────────────────────────────────────────────────────

const TYPE_ICONS: Record<TargetType, React.ElementType> = {
  revenue: IndianRupee,
  mrr: TrendingUp,
  new_clients: Users,
  expense_reduction: TrendingDown,
  custom: Target,
};

const TYPE_COLORS: Record<TargetType, string> = {
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
  Ahead:    { label: "Ahead",    bg: "rgba(22,163,74,0.10)",  color: "#16a34a" },
  "On Track": { label: "On Track", bg: "rgba(59,130,246,0.10)", color: "#3b82f6" },
  Behind:   { label: "Behind",   bg: "rgba(239,68,68,0.10)",  color: "#ef4444" },
};

function getProjectedLabel(target: TargetRow, elapsedPct: number): string | null {
  const { current_amount, target_amount } = target;
  const deadlineLabel = getDeadlineLabel(target);
  if (current_amount >= target_amount) return "Completed";
  if (elapsedPct <= 0) return null;
  const periodMonths = target.period_type === "annual" ? 12 : target.period_type === "quarterly" ? 3 : 1;
  const monthsElapsed = elapsedPct * periodMonths;
  if (monthsElapsed === 0) return null;
  const pacePerMonth = current_amount / monthsElapsed;
  const remaining = target_amount - current_amount;
  const monthsNeeded = pacePerMonth > 0 ? remaining / pacePerMonth : Infinity;
  const monthsLeft = periodMonths - monthsElapsed;
  if (monthsNeeded <= monthsLeft + 0.5) return `By ${deadlineLabel} at current pace`;
  const extraMonths = Math.ceil(monthsNeeded - monthsLeft);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const today = new Date();
  today.setMonth(today.getMonth() + extraMonths);
  return `Projected: ${months[today.getMonth()]} ${today.getFullYear()} at current pace`;
}

// ─── New Target form state ─────────────────────────────────────────────────────

interface TargetFormState {
  title: string;
  target_type: TargetType;
  period_type: PeriodType;
  target_amount: string;
  notes: string;
}

const INITIAL_FORM: TargetFormState = {
  title: "",
  target_type: "revenue",
  period_type: "annual",
  target_amount: "",
  notes: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TargetsPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TargetFormState>(INITIAL_FORM);

  const { data: targets = [], isLoading } = useTargets(CURRENT_FY);
  const createTarget = useCreateTarget();
  const deleteTarget = useDeleteTarget();
  const refreshProgress = useRefreshTargetProgress();

  function updateForm(field: keyof TargetFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.target_amount);
    if (!form.title.trim() || isNaN(amount) || amount <= 0) return;

    createTarget.mutate(
      {
        title: form.title.trim(),
        target_type: form.target_type,
        period_type: form.period_type,
        financial_year: CURRENT_FY,
        target_amount: amount,
        notes: form.notes.trim() || null,
        currency: form.target_type === "new_clients" ? "count" : "INR",
      },
      {
        onSuccess: () => {
          setForm(INITIAL_FORM);
          setShowForm(false);
        },
      }
    );
  }

  function handleDelete(target: TargetRow) {
    if (!confirm(`Delete target "${target.title}"?`)) return;
    deleteTarget.mutate({ id: target.id, financial_year: target.financial_year });
  }

  const isCount = (t: TargetRow) => t.target_type === "new_clients";

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Financial Targets"
        description="Set and track your business goals"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshProgress.mutate(CURRENT_FY)}
              disabled={refreshProgress.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.08] transition-all disabled:opacity-60"
            >
              {refreshProgress.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <RefreshCw className="w-4 h-4" />
              }
              Refresh Progress
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
            >
              <Plus className="w-4 h-4" />
              New Target
            </button>
          </div>
        }
      />

      {/* New Target Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
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
            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="e.g. Annual Revenue Target FY 2026-27"
                    value={form.title}
                    onChange={(e) => updateForm("title", e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Type</label>
                    <select
                      className="glass-input"
                      value={form.target_type}
                      onChange={(e) => updateForm("target_type", e.target.value as TargetType)}
                    >
                      <option value="revenue">Revenue</option>
                      <option value="mrr">MRR</option>
                      <option value="new_clients">New Clients</option>
                      <option value="expense_reduction">Expense Reduction</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Period</label>
                    <select
                      className="glass-input"
                      value={form.period_type}
                      onChange={(e) => updateForm("period_type", e.target.value as PeriodType)}
                    >
                      <option value="annual">Annual</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Financial Year</label>
                    <select className="glass-input" value={CURRENT_FY} disabled>
                      <option value="2025-26">2025-26</option>
                      <option value="2026-27">2026-27</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      Target {form.target_type === "new_clients" ? "(Count)" : "(Amount)"}
                    </label>
                    <input
                      type="number"
                      className="glass-input font-sans"
                      placeholder="0"
                      min="1"
                      step={form.target_type === "new_clients" ? "1" : "0.01"}
                      value={form.target_amount}
                      onChange={(e) => updateForm("target_amount", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Notes (optional)</label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="e.g. Target set at board meeting"
                    value={form.notes}
                    onChange={(e) => updateForm("notes", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-button text-sm text-text-secondary bg-surface-DEFAULT border border-black/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTarget.isPending}
                  className="px-4 py-2 rounded-button text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-70"
                  style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                >
                  {createTarget.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-button" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-7 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-16 rounded-card" />
                <Skeleton className="h-16 rounded-card" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Targets grid */}
      {!isLoading && targets.length === 0 && (
        <GlassCard padding="md">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Target className="w-7 h-7 text-text-muted" />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">No targets yet</h3>
            <p className="text-sm text-text-secondary">Add a financial target to start tracking progress</p>
          </div>
        </GlassCard>
      )}

      {!isLoading && targets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {targets.map((target) => {
            const pct = Math.min(Math.round((target.current_amount / target.target_amount) * 100), 100);
            const countTarget = isCount(target);
            const Icon = TYPE_ICONS[target.target_type] ?? Target;
            const color = TYPE_COLORS[target.target_type] ?? "#fd7e14";
            const remaining = target.target_amount - target.current_amount;
            const elapsedPct = computeElapsedPct(target);
            const trajectory = getTrajectory(pct, elapsedPct);
            const { bg: tBg, color: tColor, label: tLabel } = TRAJECTORY_STYLES[trajectory];
            const projected = getProjectedLabel(target, elapsedPct);
            const deadlineLabel = getDeadlineLabel(target);
            const periodLabel = target.period_type.charAt(0).toUpperCase() + target.period_type.slice(1);

            // Monthly pace breakdown
            const periodMonths = target.period_type === "annual" ? 12 : target.period_type === "quarterly" ? 3 : 1;
            const monthsElapsed = Math.round(elapsedPct * periodMonths);
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
                      <p className="text-xs text-text-muted mt-0.5">{periodLabel} - FY {target.financial_year}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    <span className="text-lg font-bold font-sans" style={{ color: pct >= 80 ? "#16a34a" : pct >= 50 ? color : "#3b82f6" }}>
                      {pct}%
                    </span>
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
                      style={{ left: `${elapsedPct * 100}%` }}
                      title={`${Math.round(elapsedPct * 100)}% of period elapsed`}
                    />
                  </div>
                  <p className="text-[10px] text-text-muted">
                    {Math.round(elapsedPct * 100)}% of period elapsed
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-card" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}>
                      <p className="text-xs text-text-muted">Current</p>
                      <p className="text-base font-bold font-sans text-text-primary mt-0.5">
                        {countTarget
                          ? target.current_amount
                          : `Rs.${(target.current_amount / 100000).toFixed(1)}L`}
                      </p>
                    </div>
                    <div className="p-3 rounded-card" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}>
                      <p className="text-xs text-text-muted">Target</p>
                      <p className="text-base font-bold font-sans text-text-primary mt-0.5">
                        {countTarget
                          ? target.target_amount
                          : `Rs.${(target.target_amount / 100000).toFixed(1)}L`}
                      </p>
                    </div>
                  </div>

                  {/* Monthly pace */}
                  {!countTarget && avgPerMonth > 0 && (
                    <div className="flex items-center justify-between text-xs text-text-muted border-t border-black/[0.05] pt-2.5">
                      <span>Avg/month so far</span>
                      <span className="font-sans font-medium text-text-secondary">
                        Rs.{(avgPerMonth / 1000).toFixed(0)}K
                      </span>
                    </div>
                  )}
                  {!countTarget && neededPerMonth > 0 && (
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
                    {countTarget
                      ? `${Math.max(0, remaining)} more ${remaining === 1 ? "client" : "clients"} to go`
                      : `Rs.${(Math.max(0, remaining) / 100000).toFixed(1)}L remaining to reach goal`}
                  </p>

                  {target.notes && (
                    <p className="text-xs text-text-muted italic">{target.notes}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-black/[0.04]">
                    <span className="text-[10px] text-text-muted">Deadline: {deadlineLabel}</span>
                    <button
                      onClick={() => handleDelete(target)}
                      disabled={deleteTarget.isPending}
                      className="flex items-center gap-1 text-[11px] text-text-muted hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
