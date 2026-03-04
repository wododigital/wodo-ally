"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DateFilterMode = "all" | "month" | "quarter" | "custom" | "fy";

export interface DateFilterState {
  mode: DateFilterMode;
  month?: number;       // 0-11 (for month mode)
  year?: number;        // calendar year (for month mode)
  quarter?: number;     // 1-4 Indian FY quarters (for quarter mode)
  fyYear?: number;      // FY start year e.g. 2025 = FY 2025-26
  customStart?: string; // YYYY-MM-DD
  customEnd?: string;   // YYYY-MM-DD
}

export interface DateRange {
  start: Date;
  end: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getCurrentFy(now = new Date()) {
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

function getCurrentIndianQuarter(now = new Date()) {
  const m = now.getMonth();
  if (m >= 3 && m <= 5) return 1;
  if (m >= 6 && m <= 8) return 2;
  if (m >= 9 && m <= 11) return 3;
  return 4;
}

export function resolveDateRange(state: DateFilterState): DateRange | null {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const currentFy = getCurrentFy(now);

  switch (state.mode) {
    case "all":
      return null;

    case "month": {
      const yr = state.year ?? y;
      const mo = state.month ?? m;
      return { start: new Date(yr, mo, 1), end: new Date(yr, mo + 1, 0) };
    }

    case "quarter": {
      const fyStart = state.fyYear ?? currentFy;
      const q = state.quarter ?? 1;
      // Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
      const quarterDefs: [number, number][] = [
        [fyStart, 3],
        [fyStart, 6],
        [fyStart, 9],
        [fyStart + 1, 0],
      ];
      const [qY, qM] = quarterDefs[q - 1];
      return { start: new Date(qY, qM, 1), end: new Date(qY, qM + 3, 0) };
    }

    case "custom": {
      if (!state.customStart || !state.customEnd) return null;
      const end = new Date(state.customEnd);
      end.setHours(23, 59, 59, 999);
      return { start: new Date(state.customStart), end };
    }

    case "fy": {
      const fyStart = state.fyYear ?? currentFy;
      return { start: new Date(fyStart, 3, 1), end: new Date(fyStart + 1, 2, 31) };
    }
  }
}

function getPillLabel(state: DateFilterState): Record<DateFilterMode, string> {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const currentFy = getCurrentFy(now);
  const mo = state.month ?? m;
  const yr = state.year ?? y;
  const q = state.quarter ?? 1;
  const fyY = state.fyYear ?? currentFy;

  return {
    all: "All",
    month: state.mode === "month" ? `${MONTHS[mo]} ${yr}` : "Month",
    quarter: state.mode === "quarter" ? `Q${q} FY ${fyY}-${(fyY + 1).toString().slice(2)}` : "Quarter",
    custom:
      state.mode === "custom" && state.customStart && state.customEnd
        ? `${state.customStart.slice(5)} to ${state.customEnd.slice(5)}`
        : "Custom",
    fy: state.mode === "fy" ? `FY ${fyY}-${(fyY + 1).toString().slice(2)}` : "FY",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface DateFilterProps {
  value: DateFilterState;
  onChange: (state: DateFilterState) => void;
}

export function DateFilter({ value, onChange }: DateFilterProps) {
  const [open, setOpen] = useState<DateFilterMode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentFy = getCurrentFy(now);

  const yearOptions = [currentYear - 2, currentYear - 1, currentYear];
  const fyOptions = [currentFy - 1, currentFy, currentFy + 1];

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const labels = getPillLabel(value);

  function handleModeClick(mode: DateFilterMode) {
    if (mode === "all") {
      onChange({ mode: "all" });
      setOpen(null);
      return;
    }
    if (value.mode === mode) {
      setOpen(open === mode ? null : mode);
    } else {
      let next: DateFilterState = { mode };
      if (mode === "month") next = { mode: "month", year: currentYear, month: now.getMonth() };
      else if (mode === "quarter") next = { mode: "quarter", fyYear: currentFy, quarter: getCurrentIndianQuarter(now) };
      else if (mode === "fy") next = { mode: "fy", fyYear: currentFy };
      else if (mode === "custom") next = { mode: "custom" };
      onChange(next);
      setOpen(mode);
    }
  }

  function pillCls(mode: DateFilterMode) {
    return cn(
      "flex items-center gap-1 px-3 py-1.5 rounded-button text-xs font-medium transition-all whitespace-nowrap",
      value.mode === mode
        ? "bg-white text-text-primary shadow-sm"
        : "text-text-muted hover:text-text-secondary"
    );
  }

  const accentStyle = { background: "#fd7e14" };

  return (
    <div ref={containerRef} className="relative">
      {/* Pill strip */}
      <div
        className="flex items-center gap-0.5 p-1 rounded-button"
        style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}
      >
        <button className={pillCls("all")} onClick={() => handleModeClick("all")}>
          All
        </button>

        <button className={pillCls("month")} onClick={() => handleModeClick("month")}>
          {labels.month}
          {(value.mode === "month" || open === "month") && <ChevronDown className="w-3 h-3" />}
        </button>

        <button className={pillCls("quarter")} onClick={() => handleModeClick("quarter")}>
          {labels.quarter}
          {(value.mode === "quarter" || open === "quarter") && <ChevronDown className="w-3 h-3" />}
        </button>

        <button className={pillCls("custom")} onClick={() => handleModeClick("custom")}>
          <Calendar className="w-3 h-3" />
          {labels.custom}
        </button>

        <button className={pillCls("fy")} onClick={() => handleModeClick("fy")}>
          {labels.fy}
          {(value.mode === "fy" || open === "fy") && <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* ── Month dropdown ── */}
      {open === "month" && (
        <div
          className="absolute top-full left-0 mt-1.5 z-30 rounded-card p-3"
          style={{
            background: "rgba(255,255,255,0.98)",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            minWidth: "220px",
          }}
        >
          {/* Year selector */}
          <div className="flex items-center gap-1 mb-3">
            {yearOptions.map((yr) => (
              <button
                key={yr}
                onClick={() => onChange({ ...value, year: yr })}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-semibold transition-all",
                  (value.year ?? currentYear) === yr
                    ? "text-white"
                    : "text-text-secondary hover:bg-black/[0.04]"
                )}
                style={(value.year ?? currentYear) === yr ? accentStyle : {}}
              >
                {yr}
              </button>
            ))}
          </div>
          {/* Month grid */}
          <div className="grid grid-cols-4 gap-1">
            {MONTHS.map((mo, idx) => (
              <button
                key={mo}
                onClick={() => {
                  onChange({ ...value, mode: "month", month: idx, year: value.year ?? currentYear });
                  setOpen(null);
                }}
                className={cn(
                  "px-2 py-2 rounded text-xs font-medium transition-all text-center",
                  value.month === idx && value.mode === "month"
                    ? "text-white"
                    : "text-text-secondary hover:bg-black/[0.04]"
                )}
                style={value.month === idx && value.mode === "month" ? accentStyle : {}}
              >
                {mo}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Quarter dropdown ── */}
      {open === "quarter" && (
        <div
          className="absolute top-full left-0 mt-1.5 z-30 rounded-card p-3"
          style={{
            background: "rgba(255,255,255,0.98)",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            minWidth: "260px",
          }}
        >
          {/* FY year selector */}
          <div className="flex items-center gap-1 mb-3">
            {fyOptions.map((fy) => (
              <button
                key={fy}
                onClick={() => onChange({ ...value, fyYear: fy })}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-semibold transition-all",
                  (value.fyYear ?? currentFy) === fy
                    ? "text-white"
                    : "text-text-secondary hover:bg-black/[0.04]"
                )}
                style={(value.fyYear ?? currentFy) === fy ? accentStyle : {}}
              >
                FY {fy}-{(fy + 1).toString().slice(2)}
              </button>
            ))}
          </div>
          {/* Quarter buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { q: 1, sub: "Apr - Jun" },
              { q: 2, sub: "Jul - Sep" },
              { q: 3, sub: "Oct - Dec" },
              { q: 4, sub: "Jan - Mar" },
            ].map(({ q, sub }) => (
              <button
                key={q}
                onClick={() => {
                  onChange({ ...value, mode: "quarter", quarter: q, fyYear: value.fyYear ?? currentFy });
                  setOpen(null);
                }}
                className={cn(
                  "flex flex-col items-start px-3 py-2.5 rounded-button transition-all",
                  value.quarter === q && value.mode === "quarter"
                    ? "text-white"
                    : "text-text-secondary hover:bg-black/[0.04]"
                )}
                style={value.quarter === q && value.mode === "quarter" ? accentStyle : {}}
              >
                <span className="text-xs font-semibold">Q{q}</span>
                <span className="text-[10px] opacity-80">{sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Custom date range ── */}
      {open === "custom" && (
        <div
          className="absolute top-full left-0 mt-1.5 z-30 rounded-card p-4"
          style={{
            background: "rgba(255,255,255,0.98)",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            minWidth: "240px",
          }}
        >
          <p className="text-xs font-semibold text-text-secondary mb-3">Select Date Range</p>
          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1">
                From
              </label>
              <input
                type="date"
                value={value.customStart ?? ""}
                onChange={(e) => onChange({ ...value, mode: "custom", customStart: e.target.value })}
                className="glass-input text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1">
                To
              </label>
              <input
                type="date"
                value={value.customEnd ?? ""}
                onChange={(e) => onChange({ ...value, mode: "custom", customEnd: e.target.value })}
                className="glass-input text-sm"
              />
            </div>
          </div>
          <button
            onClick={() => setOpen(null)}
            className="w-full mt-3 px-3 py-1.5 rounded-button text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            Apply
          </button>
        </div>
      )}

      {/* ── FY dropdown ── */}
      {open === "fy" && (
        <div
          className="absolute top-full left-0 mt-1.5 z-30 rounded-card py-1"
          style={{
            background: "rgba(255,255,255,0.98)",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            minWidth: "160px",
          }}
        >
          {fyOptions.map((fy) => (
            <button
              key={fy}
              onClick={() => {
                onChange({ mode: "fy", fyYear: fy });
                setOpen(null);
              }}
              className={cn(
                "w-full text-left px-4 py-2 text-xs font-medium transition-all",
                value.fyYear === fy && value.mode === "fy"
                  ? "text-accent font-semibold bg-accent-muted"
                  : "text-text-secondary hover:bg-black/[0.03]"
              )}
            >
              FY {fy}-{(fy + 1).toString().slice(2)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
