"use client";

import { useState } from "react";
import Link from "next/link";
import { NewInvoiceModal } from "@/components/shared/new-invoice-modal";
import { CheckCircle2, Target, ArrowRight, AlertCircle, Clock, FileText, TrendingUp, IndianRupee, Zap, Calendar } from "lucide-react";
import { NeedsAttentionV2 } from "./NeedsAttentionV2";
import { FinancialTargetsV2 } from "./FinancialTargetsV2";
import { formatDate } from "@/lib/utils/format";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttentionType = "overdue" | "pending" | "action";

interface AttentionItem {
  id: string; type: AttentionType;
  title: string; client: string;
  amount: string; dueLabel: string; action: string;
  balanceDue: number;
}
interface PaymentItem {
  client: string; amount: string; date: string; invoice: string;
  rawAmount: number;
}
interface TargetItem {
  title: string; current: number; target: number; unit: string;
  targetType?: string;
}
interface PipelineItem {
  id: string;
  client: string;
  description: string;
  amount: string;
  rawAmount: number;
  scheduledDate: string;
  expectedPaymentDate: string;
  type: "retainer" | "milestone" | "one_time";
}

interface DarkSectionTabsProps {
  attentionItems: AttentionItem[];
  payments: PaymentItem[];
  targets: TargetItem[];
  pipelineItems: PipelineItem[];
  monthlyReceived?: number;
  outstanding?: number;
}

type TabId = "attention" | "payments" | "targets" | "pipeline";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtMoney(amount: number): string {
  if (amount >= 100000) return `Rs.${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `Rs.${(amount / 1000).toFixed(1)}K`;
  return `Rs.${amount.toLocaleString("en-IN")}`;
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-widest font-bold mb-5"
      style={{ color: "rgba(255,255,255,0.55)" }}>
      {children}
    </p>
  );
}

function InnerCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
      }}>
      {children}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DarkSectionTabs({ attentionItems, payments, targets, pipelineItems, monthlyReceived, outstanding }: DarkSectionTabsProps) {
  const [active, setActive] = useState<TabId>("attention");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "attention", label: "Attention", count: attentionItems.length },
    { id: "payments",  label: "Payments"  },
    { id: "targets",   label: "Targets"   },
    { id: "pipeline",  label: "Pipeline", count: pipelineItems.length },
  ];

  return (
    <div className="rounded-[20px] md:rounded-[24px] p-4 md:p-7 lg:p-10" style={{ background: "#1d1f2e" }}>
      {showInvoiceModal && <NewInvoiceModal onClose={() => setShowInvoiceModal(false)} />}

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 md:mb-7 lg:mb-10">
        <div
          className="flex items-center gap-0.5 p-1 md:p-1.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[11px] md:text-[12px] font-semibold transition-all duration-150 whitespace-nowrap"
              style={
                active === tab.id
                  ? { background: "#fd7e14", color: "#ffffff" }
                  : { color: "rgba(255,255,255,0.45)" }
              }
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none"
                  style={{
                    background: active === tab.id ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                    color:      active === tab.id ? "#fff" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Full-width two-column content ────────────────────────────────────── */}
      {active === "attention" && <AttentionTab items={attentionItems} />}
      {active === "payments"  && <PaymentsTab  payments={payments} monthlyReceived={monthlyReceived} outstanding={outstanding} />}
      {active === "targets"   && <TargetsTab   targets={targets}      />}
      {active === "pipeline"  && <PipelineTab  items={pipelineItems} onCreateInvoice={() => setShowInvoiceModal(true)} />}
    </div>
  );
}

// ─── Attention tab ────────────────────────────────────────────────────────────

function AttentionTab({ items }: { items: AttentionItem[] }) {
  const overdueItems  = items.filter((i) => i.type === "overdue");
  const pendingItems  = items.filter((i) => i.type === "pending");
  const actionItems   = items.filter((i) => i.type === "action");
  const totalAtRisk   = items.reduce((sum, i) => sum + i.balanceDue, 0);

  const summaryRows = [
    { label: "Overdue",      count: overdueItems.length, color: "#ef4444", icon: AlertCircle },
    { label: "Follow up",    count: pendingItems.length, color: "#f59e0b", icon: Clock       },
    { label: "Needs action", count: actionItems.length,  color: "#9ca3af", icon: FileText    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-7 items-stretch">
      {/* Main list — 2 cols */}
      <div className="lg:col-span-2 flex flex-col">
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <SectionLabel>Needs Attention</SectionLabel>
          <Link href="/invoices"
            className="text-xs font-semibold flex items-center gap-1 hover:opacity-80"
            style={{ color: "#fd7e14" }}>
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <NeedsAttentionV2 items={items} variant="dark" className="flex-1" />
      </div>

      {/* Summary + at-risk — hidden on mobile, shown on lg */}
      <div className="hidden lg:block">
        <InnerCard className="p-5 lg:p-6 h-full">
          <p className="text-[11px] uppercase tracking-widest font-bold mb-5"
            style={{ color: "rgba(255,255,255,0.55)" }}>
            Summary
          </p>
          <div className="space-y-4 mb-6">
            {summaryRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <row.icon className="w-3.5 h-3.5 shrink-0" style={{ color: row.color }} />
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {row.label}
                  </span>
                </div>
                <span
                  className="text-sm font-bold font-sans px-2.5 py-0.5 rounded-full"
                  style={{ background: `${row.color}18`, color: row.color }}
                >
                  {row.count}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] uppercase tracking-widest font-bold mb-3"
              style={{ color: "rgba(255,255,255,0.55)" }}>
              Total at risk
            </p>
            <p className="text-3xl font-light font-sans mb-1" style={{ color: "rgba(255,255,255,0.92)" }}>
              {fmtMoney(totalAtRisk)}
            </p>
            <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Across {items.length} open item{items.length !== 1 ? "s" : ""}
            </p>
            <Link href="/invoices"
              className="flex items-center gap-2 text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ color: "#fd7e14" }}>
              <Zap className="w-3.5 h-3.5" />
              Take action
            </Link>
          </div>
        </InnerCard>
      </div>
    </div>
  );
}

// ─── Payments tab ─────────────────────────────────────────────────────────────

function PaymentsTab({ payments, monthlyReceived, outstanding }: { payments: PaymentItem[]; monthlyReceived?: number; outstanding?: number }) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear  = now.getFullYear();

  const thisMonthPayments = payments.filter((p) => {
    const d = new Date(p.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-7 items-stretch">
      {/* Payments list — 2 cols */}
      <div className="lg:col-span-2 flex flex-col">
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <SectionLabel>Recent Payments</SectionLabel>
          <Link href="/payments"
            className="text-xs font-semibold flex items-center gap-1 hover:opacity-80"
            style={{ color: "#fd7e14" }}>
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <InnerCard className="flex-1">
          {payments.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No payments recorded yet</p>
            </div>
          ) : payments.map((p, idx) => (
            <div key={idx}
              className="flex items-center justify-between px-4 md:px-6 py-3.5 md:py-5"
              style={{ borderBottom: idx < payments.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div className="min-w-0 flex-1 pr-3">
                <p className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {p.client}
                </p>
                <p className="hidden sm:block text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {p.invoice} &middot; {formatDate(p.date)}
                </p>
              </div>
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <span className="text-sm font-light font-sans" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {p.amount}
                </span>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              </div>
            </div>
          ))}
        </InnerCard>
      </div>

      {/* Stats + outstanding — hidden on mobile */}
      <div className="hidden lg:block">
        <InnerCard className="p-5 lg:p-6 h-full">
          <p className="text-[11px] uppercase tracking-widest font-bold mb-5"
            style={{ color: "rgba(255,255,255,0.55)" }}>
            This Month
          </p>
          <div className="space-y-5 mb-6">
            {[
              {
                label: "Total received",
                value: fmtMoney(monthlyReceived ?? 0),
                icon: IndianRupee,
                color: "#22c55e",
              },
              {
                label: "Payments this month",
                value: `${thisMonthPayments.length} recorded`,
                icon: CheckCircle2,
                color: "#fd7e14",
              },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className="w-3.5 h-3.5 shrink-0" style={{ color: stat.color }} />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
                    {stat.label}
                  </span>
                </div>
                <p className="text-lg font-light font-sans pl-5" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] uppercase tracking-widest font-bold mb-3"
              style={{ color: "rgba(255,255,255,0.55)" }}>
              Still Outstanding
            </p>
            <p className="text-3xl font-light font-sans mb-1" style={{ color: "#ef4444" }}>
              {fmtMoney(outstanding ?? 0)}
            </p>
            <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Balance due across open invoices
            </p>
            <Link href="/invoices"
              className="flex items-center gap-2 text-xs font-semibold hover:opacity-80"
              style={{ color: "#fd7e14" }}>
              <TrendingUp className="w-3.5 h-3.5" />
              View invoices
            </Link>
          </div>
        </InnerCard>
      </div>
    </div>
  );
}

// ─── Targets tab ──────────────────────────────────────────────────────────────

function TargetsTab({ targets }: { targets: TargetItem[] }) {
  const revenueTarget = targets.find((t) => t.targetType === "revenue") ?? targets[0];
  const mrrTarget     = targets.find((t) => t.targetType === "mrr");

  const earned    = revenueTarget?.current ?? 0;
  const goal      = revenueTarget?.target ?? 0;
  const remaining = Math.max(0, goal - earned);
  const pct       = goal > 0 ? Math.min(Math.round((earned / goal) * 100), 100) : 0;

  const mrr          = mrrTarget?.current ?? 0;
  const monthsNeeded = mrr > 0 ? (remaining / mrr).toFixed(1) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-7">
      {/* Targets list — 2 cols */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <SectionLabel>Financial Targets</SectionLabel>
          <Link href="/targets"
            className="text-xs font-semibold hover:opacity-80"
            style={{ color: "#fd7e14" }}>
            Manage
          </Link>
        </div>
        {targets.length === 0 ? (
          <InnerCard className="p-6">
            <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
              No targets set yet. <Link href="/targets" style={{ color: "#fd7e14" }}>Add targets</Link>
            </p>
          </InnerCard>
        ) : (
          <FinancialTargetsV2 targets={targets} variant="dark" />
        )}
      </div>

      {/* Goal summary card — hidden on mobile */}
      <div className="hidden lg:flex flex-col gap-5">
        {revenueTarget && (
          <InnerCard className="p-6">
            <p className="text-[11px] uppercase tracking-widest font-bold mb-5"
              style={{ color: "rgba(255,255,255,0.55)" }}>
              Annual Progress
            </p>

            {/* Circular-style percentage */}
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 text-xl font-bold font-sans"
                style={{
                  background: "conic-gradient(#fd7e14 0% " + pct + "%, rgba(255,255,255,0.08) " + pct + "% 100%)",
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: "#1d1f2e" }}>
                  <span className="text-sm font-bold" style={{ color: "#fd7e14" }}>{pct}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.92)" }}>
                  {pct >= 80 ? "On track" : pct >= 50 ? "In progress" : "Behind target"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
                  FY goal
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: "Earned",    value: fmtMoney(earned),    color: "#22c55e" },
                { label: "Target",    value: fmtMoney(goal),      color: "rgba(255,255,255,0.5)" },
                { label: "Remaining", value: fmtMoney(remaining), color: "#f59e0b" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{row.label}</span>
                  <span className="text-sm font-light font-sans" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </InnerCard>
        )}

        {remaining > 0 && (
          <InnerCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl" style={{ background: "rgba(253,126,20,0.2)" }}>
                <Target className="w-4 h-4" style={{ color: "#fd7e14" }} />
              </div>
              <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.92)" }}>
                {monthsNeeded ? "Push needed" : "Target gap"}
              </p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              {fmtMoney(remaining)} more to close the year.
              {mrr > 0 && monthsNeeded
                ? ` With current MRR of ${fmtMoney(mrr)}, you need ${monthsNeeded} strong months.`
                : " Keep tracking progress on the targets page."}
            </p>
          </InnerCard>
        )}
      </div>
    </div>
  );
}

// ─── Pipeline tab ─────────────────────────────────────────────────────────────

function PipelineTab({ items, onCreateInvoice }: { items: PipelineItem[]; onCreateInvoice: () => void }) {
  const now = new Date();
  const nextMonth       = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const pipelineMonth   = `${MONTHS[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`;

  const retainerCount   = items.filter((i) => i.type === "retainer").length;
  const milestoneCount  = items.filter((i) => i.type === "milestone").length;
  const totalToInvoice  = items.reduce((sum, i) => sum + i.rawAmount, 0);
  const retainerTotal   = items
    .filter((i) => i.type === "retainer")
    .reduce((sum, i) => sum + i.rawAmount, 0);
  const twoMonthForecast = retainerTotal * 2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-7 items-stretch">
      {/* Invoice list — 2 cols */}
      <div className="lg:col-span-2 flex flex-col">
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <SectionLabel>Invoices to Raise - {pipelineMonth}</SectionLabel>
          <Link href="/pipeline"
            className="text-xs font-semibold flex items-center gap-1 hover:opacity-80"
            style={{ color: "#fd7e14" }}>
            Full pipeline <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <InnerCard className="flex-1">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No scheduled invoices pending</p>
            </div>
          ) : items.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-4 md:px-6 py-3.5 md:py-4"
              style={{ borderBottom: idx < items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1 pr-3">
                <div
                  className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center shrink-0 mt-0.5"
                  style={{ background: item.type === "retainer" ? "rgba(253,126,20,0.15)" : "rgba(59,130,246,0.15)" }}
                >
                  <Calendar
                    className="w-3.5 h-3.5"
                    style={{ color: item.type === "retainer" ? "#fd7e14" : "#3b82f6" }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.9)" }}>
                    {item.client}
                  </p>
                  <p className="hidden sm:block text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.38)" }}>
                    {item.description}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>
                    {item.scheduledDate} &middot; Pay {item.expectedPaymentDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <span className="text-sm font-light font-sans" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {item.amount}
                </span>
                <button
                  onClick={onCreateInvoice}
                  className="text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(253,126,20,0.2)", color: "#fd7e14" }}
                >
                  Create
                </button>
              </div>
            </div>
          ))}
        </InnerCard>
      </div>

      {/* Summary card — hidden on mobile */}
      <div className="hidden lg:block">
        <InnerCard className="p-5 lg:p-6 h-full">
          <p className="text-[11px] uppercase tracking-widest font-bold mb-5"
            style={{ color: "rgba(255,255,255,0.55)" }}>
            {pipelineMonth} Pipeline
          </p>
          <div className="space-y-5 mb-6">
            {[
              { label: "Total to invoice",  value: fmtMoney(totalToInvoice),           icon: FileText,     color: "#fd7e14" },
              { label: "Retainer invoices", value: `${retainerCount} client${retainerCount !== 1 ? "s" : ""}`,   icon: IndianRupee, color: "#22c55e" },
              { label: "Milestone items",   value: `${milestoneCount} deliver${milestoneCount !== 1 ? "ies" : "y"}`, icon: Calendar,   color: "#3b82f6" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className="w-3.5 h-3.5 shrink-0" style={{ color: stat.color }} />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
                    {stat.label}
                  </span>
                </div>
                <p className="text-lg font-light font-sans pl-5" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] uppercase tracking-widest font-bold mb-3"
              style={{ color: "rgba(255,255,255,0.55)" }}>
              Next 2-month forecast
            </p>
            <p className="text-3xl font-light font-sans mb-1" style={{ color: "rgba(255,255,255,0.92)" }}>
              {fmtMoney(twoMonthForecast)}
            </p>
            <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Retainer MRR over next 2 months
            </p>
            <Link href="/pipeline"
              className="flex items-center gap-2 text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ color: "#fd7e14" }}>
              <TrendingUp className="w-3.5 h-3.5" />
              View full pipeline
            </Link>
          </div>
        </InnerCard>
      </div>
    </div>
  );
}
