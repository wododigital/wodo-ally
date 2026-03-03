"use client";

import { useState } from "react";
import { Target, Plus, TrendingUp, Users, IndianRupee } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils/cn";

const TARGETS = [
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
  },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  revenue: IndianRupee,
  mrr: TrendingUp,
  new_clients: Users,
  expense_reduction: TrendingUp,
  custom: Target,
};

const TYPE_COLORS: Record<string, string> = {
  revenue: "#fd7e14",
  mrr: "#3b82f6",
  new_clients: "#16a34a",
  expense_reduction: "#ef4444",
  custom: "#8b5cf6",
};

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

      {showForm && (
        <GlassCard padding="md" variant="accent">
          <h3 className="text-sm font-semibold text-text-primary mb-4">New Target</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Title</label>
              <input type="text" className="glass-input" placeholder="e.g. Annual Revenue Target FY 2026-27" />
            </div>
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
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-button text-sm text-text-secondary bg-surface-DEFAULT border border-black/[0.05]">Cancel</button>
            <button className="px-4 py-2 rounded-button text-sm font-semibold text-white" style={{ background: "#fd7e14" }}>Save Target</button>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {TARGETS.map((target) => {
          const pct = Math.min(Math.round((target.current_amount / target.target_amount) * 100), 100);
          const isCount = target.currency === "count";
          const Icon = TYPE_ICONS[target.type] ?? Target;
          const color = TYPE_COLORS[target.type] ?? "#fd7e14";
          const remaining = target.target_amount - target.current_amount;

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
                <div className="text-right shrink-0 ml-2">
                  <span className="text-lg font-bold font-sans" style={{ color: pct >= 80 ? "#16a34a" : pct >= 50 ? color : "#3b82f6" }}>
                    {pct}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-2 bg-black/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? "#16a34a" : pct >= 50 ? color : "#3b82f6" }}
                  />
                </div>

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

                <p className="text-xs text-text-muted">
                  {isCount
                    ? `${remaining} more ${remaining === 1 ? "client" : "clients"} to go`
                    : `Rs.${(remaining / 100000).toFixed(1)}L remaining to reach goal`}
                </p>

                {target.notes && (
                  <p className="text-xs text-text-muted italic border-t border-black/[0.05] pt-2">{target.notes}</p>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
