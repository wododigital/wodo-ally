"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Target, ArrowRight, AlertCircle, Clock, FileText, TrendingUp, IndianRupee, Zap } from "lucide-react";
import { NeedsAttentionV2 } from "./NeedsAttentionV2";
import { FinancialTargetsV2 } from "./FinancialTargetsV2";
import { formatDate } from "@/lib/utils/format";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttentionType = "overdue" | "pending" | "action";

interface AttentionItem {
  id: string; type: AttentionType;
  title: string; client: string;
  amount: string; dueLabel: string; action: string;
}
interface PaymentItem {
  client: string; amount: string; date: string; invoice: string;
}
interface TargetItem {
  title: string; current: number; target: number; unit: string;
}

interface DarkSectionTabsProps {
  attentionItems: AttentionItem[];
  payments: PaymentItem[];
  targets: TargetItem[];
}

type TabId = "attention" | "payments" | "targets";

// ─── Shared ───────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-widest font-bold mb-5"
      style={{ color: "rgba(255,255,255,0.3)" }}>
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

export function DarkSectionTabs({ attentionItems, payments, targets }: DarkSectionTabsProps) {
  const [active, setActive] = useState<TabId>("attention");

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "attention", label: "Attention", count: attentionItems.length },
    { id: "payments",  label: "Payments"  },
    { id: "targets",   label: "Targets"   },
  ];

  return (
    <div className="rounded-[24px] p-10" style={{ background: "#1d1f2e" }}>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-10">
        <div
          className="flex items-center gap-1 p-1.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-150 whitespace-nowrap"
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
      {active === "payments"  && <PaymentsTab  payments={payments}    />}
      {active === "targets"   && <TargetsTab   targets={targets}      />}
    </div>
  );
}

// ─── Attention tab ────────────────────────────────────────────────────────────

function AttentionTab({ items }: { items: AttentionItem[] }) {
  const overdueItems  = items.filter((i) => i.type === "overdue");
  const pendingItems  = items.filter((i) => i.type === "pending");
  const actionItems   = items.filter((i) => i.type === "action");

  const summaryRows = [
    { label: "Overdue",      count: overdueItems.length, color: "#ef4444", icon: AlertCircle },
    { label: "Follow up",    count: pendingItems.length, color: "#f59e0b", icon: Clock       },
    { label: "Needs action", count: actionItems.length,  color: "#9ca3af", icon: FileText    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-stretch">
      {/* Main list — 2 cols */}
      <div className="lg:col-span-2 flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <SectionLabel>Needs Attention</SectionLabel>
          <Link href="/invoices"
            className="text-xs font-semibold flex items-center gap-1 hover:opacity-80"
            style={{ color: "#fd7e14" }}>
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <NeedsAttentionV2 items={items} variant="dark" className="flex-1" />
      </div>

      {/* Summary + at-risk — single card */}
      <div>
        <InnerCard className="p-6 h-full">
          <p className="text-[11px] uppercase tracking-widest font-bold mb-5"
            style={{ color: "rgba(255,255,255,0.3)" }}>
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
              style={{ color: "rgba(255,255,255,0.3)" }}>
              Total at risk
            </p>
            <p className="text-3xl font-light font-sans mb-1" style={{ color: "rgba(255,255,255,0.92)" }}>
              Rs.1,95,200
            </p>
            <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Across {items.length} open items
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

function PaymentsTab({ payments }: { payments: PaymentItem[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-stretch">
      {/* Payments list — 2 cols */}
      <div className="lg:col-span-2 flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <SectionLabel>Recent Payments</SectionLabel>
          <Link href="/payments"
            className="text-xs font-semibold flex items-center gap-1 hover:opacity-80"
            style={{ color: "#fd7e14" }}>
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <InnerCard className="flex-1">
          {payments.map((p, idx) => (
            <div key={idx}
              className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: idx < payments.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {p.client}
                </p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {p.invoice} &middot; {formatDate(p.date)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-light font-sans" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {p.amount}
                </span>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              </div>
            </div>
          ))}
        </InnerCard>
      </div>

      {/* Stats + outstanding — single card */}
      <div>
        <InnerCard className="p-6 h-full">
          <p className="text-[11px] uppercase tracking-widest font-bold mb-5"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            This Month
          </p>
          <div className="space-y-5 mb-6">
            {[
              { label: "Total received",    value: "Rs.2,19,800", icon: IndianRupee,  color: "#22c55e" },
              { label: "Avg. payment time", value: "4.2 days",    icon: Clock,        color: "#3b82f6" },
              { label: "Invoices cleared",  value: "3 of 7",      icon: CheckCircle2, color: "#fd7e14" },
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
              style={{ color: "rgba(255,255,255,0.3)" }}>
              Still Outstanding
            </p>
            <p className="text-3xl font-light font-sans mb-1" style={{ color: "#ef4444" }}>
              Rs.2,53,500
            </p>
            <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
              4 invoices pending payment
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
  const annualTarget = targets[0];
  const pct = annualTarget
    ? Math.min(Math.round((annualTarget.current / annualTarget.target) * 100), 100)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
      {/* Targets list — 2 cols */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-5">
          <SectionLabel>Financial Targets</SectionLabel>
          <Link href="/targets"
            className="text-xs font-semibold hover:opacity-80"
            style={{ color: "#fd7e14" }}>
            Manage
          </Link>
        </div>
        <FinancialTargetsV2 targets={targets} variant="dark" />
      </div>

      {/* Goal summary card — 1 col */}
      <div className="flex flex-col gap-5">
        <InnerCard className="p-6">
          <p className="text-[11px] uppercase tracking-widest font-bold mb-5"
            style={{ color: "rgba(255,255,255,0.3)" }}>
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
                On track
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
                FY 2025-26 goal
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: "Earned",     value: "Rs.38.45L", color: "#22c55e" },
              { label: "Target",     value: "Rs.60L",    color: "rgba(255,255,255,0.5)" },
              { label: "Remaining",  value: "Rs.21.55L", color: "#f59e0b" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{row.label}</span>
                <span className="text-sm font-light font-sans" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </InnerCard>

        <InnerCard className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl" style={{ background: "rgba(253,126,20,0.2)" }}>
              <Target className="w-4 h-4" style={{ color: "#fd7e14" }} />
            </div>
            <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.92)" }}>
              Q4 push needed
            </p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
            Rs.21.55L more to close the year. With current MRR of Rs.3.85L, you need 5.6 strong months.
          </p>
        </InnerCard>
      </div>
    </div>
  );
}
