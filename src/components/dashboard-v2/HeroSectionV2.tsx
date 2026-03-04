"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { NewInvoiceModal } from "@/components/shared/new-invoice-modal";
import {
  ChevronDown,
  ChevronRight,
  Users,
  FileText,
  Upload,
  BarChart2,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Clock,
} from "lucide-react";
import {
  Collapsible as CollapsibleRoot,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@radix-ui/react-collapsible";
import {
  HeroProjectsGrowthChart,
  type MonthlyGrowth,
} from "./HeroProjectsGrowthChart";
import { useMonthlyPL } from "@/lib/hooks/use-analytics";
import { useCollectionsInvoices } from "@/lib/hooks/use-invoices";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRevenue(amount: number): string {
  if (amount >= 100000) return `Rs.${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `Rs.${(amount / 1000).toFixed(1)}K`;
  return `Rs.${Math.round(amount).toLocaleString("en-IN")}`;
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

type HeroAction = { label: string; icon: React.ElementType } & (
  | { href: string; onClick?: never }
  | { onClick: () => void; href?: never }
);

function QuickActionsDropdown() {
  const [open, setOpen] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const QUICK_ACTIONS: HeroAction[] = [
    { href: "/onboard",         label: "Onboard new client",       icon: UserPlus  },
    { onClick: () => setShowInvoiceModal(true), label: "Create invoice", icon: FileText },
    { href: "/expenses/upload", label: "Upload bank statement",    icon: Upload    },
    { href: "/reports",         label: "Generate investor report", icon: BarChart2 },
  ];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-hero-qa]")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      {showInvoiceModal && <NewInvoiceModal onClose={() => setShowInvoiceModal(false)} />}
      <div className="relative" data-hero-qa>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap"
          style={{ background: "#fd7e14" }}
        >
          Quick Actions
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div
            className="absolute left-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-50"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.9)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            {QUICK_ACTIONS.map((action, idx) => {
              const itemClass = "flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-black/5 transition-colors w-full text-left";
              const itemStyle = { borderBottom: idx < QUICK_ACTIONS.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none" };
              const content = <><action.icon className="w-4 h-4 shrink-0" style={{ color: "#fd7e14" }} />{action.label}</>;
              if (action.href) {
                return <Link key={action.label} href={action.href} onClick={() => setOpen(false)} className={itemClass} style={itemStyle}>{content}</Link>;
              }
              return <button key={action.label} onClick={() => { action.onClick!(); setOpen(false); }} className={itemClass} style={itemStyle}>{content}</button>;
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Accordion data types ─────────────────────────────────────────────────────

interface PanelRow {
  label: string;
  value: string;
  color?: string;
  icon?: ReactNode;
}

interface Panel {
  id: string;
  title: string;
  summary: string;
  summaryColor: string;
  rows: PanelRow[];
}

const PANEL_IDS = ["revenue", "collections", "outstanding"];

// ─── Accordion panels ─────────────────────────────────────────────────────────

function AccordionPanels({ panels, animated = true }: { panels: Panel[]; animated?: boolean }) {
  const [openId, setOpenId] = useState<string | null>("revenue");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!animated || paused) return;
    const timer = setInterval(() => {
      setOpenId((current) => {
        const idx = PANEL_IDS.indexOf(current ?? "");
        return PANEL_IDS[(idx + 1) % PANEL_IDS.length];
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [animated, paused]);

  return (
    <div
      className="space-y-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {panels.map((panel) => {
        const isOpen = openId === panel.id;
        return (
          <CollapsibleRoot
            key={panel.id}
            open={isOpen}
            onOpenChange={(open) => setOpenId(open ? panel.id : null)}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.84)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,0.9)",
                borderRadius: 10,
                boxShadow: "0 1px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
                overflow: "hidden",
              }}
            >
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-black/[0.025]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {panel.title}
                  </span>
                  <span
                    className="text-sm font-bold font-sans leading-none"
                    style={{ color: panel.summaryColor }}
                  >
                    {panel.summary}
                  </span>
                </div>
                <ChevronRight
                  className="w-3.5 h-3.5 text-gray-400 shrink-0"
                  style={{
                    transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                    transition: animated ? "transform 0.2s ease" : "none",
                  }}
                />
              </CollapsibleTrigger>

              <CollapsibleContent forceMount>
                <div
                  style={{
                    overflow: "hidden",
                    maxHeight: isOpen ? "180px" : "0px",
                    opacity: isOpen ? 1 : 0,
                    transition: animated
                      ? "max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease"
                      : "none",
                  }}
                >
                  <div
                    className="px-4 pb-3"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    <div className="pt-2.5 space-y-2">
                      {panel.rows.length === 0 ? (
                        <p className="text-[11px] text-gray-400">No data yet</p>
                      ) : (
                        panel.rows.map((row, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {row.icon && (
                                <span style={{ color: row.color ?? "#9ca3af" }}>
                                  {row.icon}
                                </span>
                              )}
                              <span className="text-[11px] text-gray-500">{row.label}</span>
                            </div>
                            <span
                              className="text-[11px] font-semibold font-sans"
                              style={{ color: row.color ?? "#374151" }}
                            >
                              {row.value}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </CollapsibleRoot>
        );
      })}
    </div>
  );
}

// ─── Right column (desktop only) ─────────────────────────────────────────────

function RightColumn({ panels, growthData }: { panels: Panel[]; growthData: MonthlyGrowth[] }) {
  return (
    <div className="relative">
      {growthData.length >= 2 && <HeroProjectsGrowthChart data={growthData} />}
      <div
        className="mt-4 lg:mt-0 lg:absolute lg:top-4 lg:z-20 lg:w-[36%] space-y-2"
        style={{ right: 20 }}
      >
        <AccordionPanels panels={panels} animated={true} />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HeroSectionV2() {
  const { data: plRows = [] } = useMonthlyPL();
  const { data: collections = [] } = useCollectionsInvoices();

  // Revenue panel: last 3 months from P&L
  const last3PL = plRows.slice(-3);
  const latestRevenue = last3PL[last3PL.length - 1]?.total_revenue ?? 0;
  const revenuePanel: Panel = {
    id: "revenue",
    title: "Revenue",
    summary: last3PL.length > 0 ? formatRevenue(latestRevenue) : "No data",
    summaryColor: "#16a34a",
    rows: last3PL.map((r) => ({ label: r.month_label, value: formatRevenue(r.total_revenue) })),
  };

  // Collections panel: top 3 open invoices by urgency
  const top3 = collections.slice(0, 3);
  const overdueCount = collections.filter((c) => c.urgency === "overdue").length;
  const collectionsPanel: Panel = {
    id: "collections",
    title: "Collections",
    summary: collections.length === 0
      ? "All clear"
      : overdueCount > 0
        ? `${overdueCount} overdue`
        : `${collections.length} open`,
    summaryColor: overdueCount > 0 ? "#ef4444" : collections.length > 0 ? "#f59e0b" : "#16a34a",
    rows: top3.map((c) => ({
      label: c.client_name,
      value: c.urgency === "overdue" ? "Overdue" : c.urgency === "due_soon" ? "Due Soon" : "Upcoming",
      color: c.urgency === "overdue" ? "#ef4444" : c.urgency === "due_soon" ? "#f59e0b" : "#3b82f6",
      icon: c.urgency === "overdue"
        ? <AlertCircle className="w-3 h-3" />
        : c.urgency === "due_soon"
          ? <Clock className="w-3 h-3" />
          : <CheckCircle2 className="w-3 h-3" />,
    })),
  };

  // Outstanding panel: group by urgency type
  const overdueAmt   = collections.filter((c) => c.urgency === "overdue").reduce((s, c) => s + (c.balance_due ?? 0), 0);
  const dueSoonAmt   = collections.filter((c) => c.urgency === "due_soon").reduce((s, c) => s + (c.balance_due ?? 0), 0);
  const upcomingAmt  = collections.filter((c) => c.urgency === "upcoming").reduce((s, c) => s + (c.balance_due ?? 0), 0);
  const totalOutstanding = overdueAmt + dueSoonAmt + upcomingAmt;
  const outstandingPanel: Panel = {
    id: "outstanding",
    title: "Outstanding",
    summary: totalOutstanding > 0 ? formatRevenue(totalOutstanding) : "Rs.0",
    summaryColor: overdueAmt > 0 ? "#ef4444" : totalOutstanding > 0 ? "#f59e0b" : "#16a34a",
    rows: [
      { label: "Overdue",   value: overdueAmt  > 0 ? formatRevenue(overdueAmt)  : "None", color: overdueAmt  > 0 ? "#ef4444" : "#9ca3af" },
      { label: "Due Soon",  value: dueSoonAmt  > 0 ? formatRevenue(dueSoonAmt)  : "None", color: dueSoonAmt  > 0 ? "#f59e0b" : "#9ca3af" },
      { label: "Upcoming",  value: upcomingAmt > 0 ? formatRevenue(upcomingAmt) : "None", color: "#3b82f6"  },
    ],
  };

  const panels: Panel[] = [revenuePanel, collectionsPanel, outstandingPanel];

  // Revenue growth chart: last 3 months MoM%
  const growthData: MonthlyGrowth[] = last3PL.map((row, i) => {
    const prev = last3PL[i - 1];
    const pct = prev && prev.total_revenue > 0
      ? Math.round(((row.total_revenue - prev.total_revenue) / prev.total_revenue) * 100)
      : 0;
    return { month: row.month_label.slice(0, 3), projects: row.total_revenue, growthPercent: pct };
  });

  // Narrative: MoM revenue change
  const prevRevenue = last3PL[last3PL.length - 2]?.total_revenue ?? 0;
  const momPct = latestRevenue > 0 && prevRevenue > 0
    ? Math.round(((latestRevenue - prevRevenue) / prevRevenue) * 100)
    : null;
  const attentionCount = collections.filter((c) => c.urgency === "overdue" || c.urgency === "due_soon").length;

  return (
    <div className="py-6 lg:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14 items-start">

        {/* Left: pill, headline, narrative, action row */}
        <div className="flex flex-col">
          <span
            className="self-start px-4 py-1.5 rounded-full text-[12px] font-medium"
            style={{
              background: "rgba(255,255,255,0.65)",
              border: "1px solid rgba(0,0,0,0.08)",
              color: "#6b7280",
            }}
          >
            Welcome Back
          </span>

          <h1
            className="mt-4 text-[2rem] md:text-[2.5rem] font-light text-gray-900 tracking-tight"
            style={{ lineHeight: 1.1 }}
          >
            Your Financial<br />Snapshot
          </h1>

          <p className="mt-4 md:mt-6 text-sm text-gray-500 leading-relaxed max-w-[360px]">
            {latestRevenue > 0 ? (
              <>
                Latest month revenue:{" "}
                <span className="font-medium text-gray-800">{formatRevenue(latestRevenue)}</span>.
                {momPct !== null && (
                  <>
                    {" "}Revenue{" "}
                    <span className={`font-medium ${momPct >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {momPct >= 0 ? `+${momPct}%` : `${momPct}%`}
                    </span>
                    {" "}vs prior month.
                  </>
                )}
                {attentionCount > 0 && (
                  <>
                    {" "}{attentionCount} invoice{attentionCount !== 1 ? "s" : ""} need attention.
                  </>
                )}
              </>
            ) : (
              <>
                Track revenue, collections, and cash flow for{" "}
                <span className="font-medium text-gray-800">WODO Digital</span>.{" "}
                Start by adding your first invoice.
              </>
            )}
          </p>

          <div className="flex items-center gap-3 mt-6 md:mt-8 flex-wrap">
            <Link
              href="/onboard"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
              style={{
                background: "rgba(255,255,255,0.65)",
                border: "1px solid rgba(0,0,0,0.1)",
                color: "#374151",
              }}
            >
              <UserPlus className="w-4 h-4 shrink-0" style={{ color: "#fd7e14" }} />
              Onboard Client
            </Link>
            <QuickActionsDropdown />
          </div>

          {/* Mobile-only accordion */}
          <div className="lg:hidden mt-6">
            <AccordionPanels panels={panels} animated={false} />
          </div>
        </div>

        {/* Right: semicircle chart + accordion overlay (desktop only) */}
        <div className="hidden lg:block">
          <RightColumn panels={panels} growthData={growthData} />
        </div>
      </div>
    </div>
  );
}
