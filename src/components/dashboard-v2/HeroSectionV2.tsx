"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Users,
  FileText,
  Upload,
  BarChart2,
  AlertCircle,
  CheckCircle2,
  FileBarChart,
  UserPlus,
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

// ─── Chart data ───────────────────────────────────────────────────────────────

const PROJECT_GROWTH: MonthlyGrowth[] = [
  { month: "Jan", projects: 42, growthPercent: 12 },
  { month: "Feb", projects: 58, growthPercent: 18 },
  { month: "Mar", projects: 51, growthPercent: -6 },
];

// ─── Quick Actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { href: "/onboard",         label: "Onboard new client",       icon: UserPlus  },
  { href: "/invoices/new",    label: "Create invoice",           icon: FileText  },
  { href: "/expenses/upload", label: "Upload bank statement",    icon: Upload    },
  { href: "/reports",         label: "Generate investor report", icon: BarChart2 },
];

function QuickActionsDropdown() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-hero-qa]")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
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
          {QUICK_ACTIONS.map((action, idx) => (
            <Link
              key={action.href}
              href={action.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-black/5 transition-colors"
              style={{
                borderBottom:
                  idx < QUICK_ACTIONS.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
              }}
            >
              <action.icon className="w-4 h-4 shrink-0" style={{ color: "#fd7e14" }} />
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Accordion data ───────────────────────────────────────────────────────────

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
  rows: PanelRow[]; // max 3
}

const PANELS: Panel[] = [
  {
    id: "revenue",
    title: "Revenue",
    summary: "Rs.3.21L",
    summaryColor: "#16a34a",
    rows: [
      { label: "Jan 2025", value: "Rs.2.90L" },
      { label: "Feb 2025", value: "Rs.3.12L" },
      { label: "Mar 2025", value: "Rs.3.21L", color: "#fd7e14" },
    ],
  },
  {
    id: "collections",
    title: "Collections",
    summary: "64% rate",
    summaryColor: "#fd7e14",
    rows: [
      {
        label: "Nandhini Hotel",
        value: "Paid",
        color: "#16a34a",
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
      {
        label: "Maximus OIGA",
        value: "Overdue",
        color: "#ef4444",
        icon: <AlertCircle className="w-3 h-3" />,
      },
      {
        label: "Raj Enterprises",
        value: "Overdue",
        color: "#ef4444",
        icon: <AlertCircle className="w-3 h-3" />,
      },
    ],
  },
  {
    id: "outstanding",
    title: "Outstanding",
    summary: "Rs.2.53L",
    summaryColor: "#ef4444",
    rows: [
      { label: "0–30 days",  value: "Rs.76.7k", color: "#f59e0b" },
      { label: "31–60 days", value: "Rs.42.0k", color: "#ef4444" },
      { label: "60+ days",   value: "Rs.17.5k", color: "#ef4444" },
    ],
  },
];

const PANEL_IDS = PANELS.map((p) => p.id);

// ─── Accordion panels with auto-animation ────────────────────────────────────

function AccordionPanels() {
  const [openId, setOpenId] = useState<string | null>("revenue");
  const [paused, setPaused] = useState(false);

  // Cycle through panels every 3 s; stop on hover/focus, resume on leave
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setOpenId((current) => {
        const idx = PANEL_IDS.indexOf(current ?? "");
        return PANEL_IDS[(idx + 1) % PANEL_IDS.length];
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <div
      className="space-y-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {PANELS.map((panel) => {
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
                boxShadow:
                  "0 1px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
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
                  className="w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0"
                  style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                />
              </CollapsibleTrigger>

              <CollapsibleContent forceMount>
                <div
                  style={{
                    overflow: "hidden",
                    maxHeight: isOpen ? "180px" : "0px",
                    opacity: isOpen ? 1 : 0,
                    transition:
                      "max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease",
                  }}
                >
                  <div
                    className="px-4 pb-3"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    <div className="pt-2.5 space-y-2">
                      {panel.rows.map((row, i) => (
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
                      ))}
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

// ─── Right column ─────────────────────────────────────────────────────────────

function RightColumn() {
  return (
    <div className="relative">

      {/* Semicircle growth chart */}
      <HeroProjectsGrowthChart data={PROJECT_GROWTH} />

      {/*
        Accordion panels:
        - Desktop: absolute, right: 0 → flush with right edge of chart
        - Mobile: normal flow below the chart
      */}
      <div
        className="mt-4 lg:mt-0 lg:absolute lg:top-4 lg:z-20 lg:w-[36%] space-y-2"
        style={{ right: 0 }}
      >
        <AccordionPanels />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HeroSectionV2() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start py-10">

      {/* ── Left: pill → headline → narrative → action row ───────────────── */}
      <div className="flex flex-col">

        {/* Pill */}
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

        {/* Headline */}
        <h1
          className="mt-4 text-[2.5rem] font-light text-gray-900 tracking-tight"
          style={{ lineHeight: 1.1 }}
        >
          Your Financial<br />Snapshot
        </h1>

        {/* Narrative */}
        <p className="mt-6 text-sm text-gray-500 leading-relaxed max-w-[360px]">
          You&apos;re{" "}
          <span className="font-medium text-gray-800">64% toward</span> your Rs.60L
          annual target. Revenue grew{" "}
          <span className="font-medium text-green-600">18.4%</span> last month.
          3 items need attention this week.
        </p>

        {/* Action row */}
        <div className="flex items-center gap-3 mt-8 flex-wrap">
          <Link
            href="/reports/march-2026"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            style={{
              background: "rgba(255,255,255,0.65)",
              border: "1px solid rgba(0,0,0,0.1)",
              color: "#374151",
            }}
          >
            <FileBarChart className="w-4 h-4 shrink-0" style={{ color: "#fd7e14" }} />
            March 2026 report
          </Link>

          <QuickActionsDropdown />
        </div>
      </div>

      {/* ── Right: semicircle chart + animated accordion overlay ──────────── */}
      <RightColumn />
    </div>
  );
}
