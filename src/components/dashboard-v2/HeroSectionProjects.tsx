"use client";

import Link from "next/link";
import { FolderOpen, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import {
  HeroProjectsGrowthChart,
  type MonthlyGrowth,
} from "./HeroProjectsGrowthChart";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeroSectionProjectsProps {
  data: MonthlyGrowth[];
}

// ─── Right column ─────────────────────────────────────────────────────────────

function ProjectsRightColumn({ data }: { data: MonthlyGrowth[] }) {
  return (
    <div>
      <HeroProjectsGrowthChart data={data} />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HeroSectionProjects({ data }: HeroSectionProjectsProps) {
  // Derive a simple headline stat from the latest month
  const latest    = data[data.length - 1];
  const isUp      = (latest?.growthPercent ?? 0) >= 0;
  const TrendIcon = isUp ? TrendingUp : TrendingDown;
  const trendColor= isUp ? "#16a34a" : "#ef4444";
  const sign      = isUp ? "+" : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start py-10">

      {/* ── Left column ───────────────────────────────────────────────────── */}
      <div className="flex flex-col">

        {/* Pill */}
        <span
          className="self-start px-4 py-1.5 rounded-full text-[12px] font-medium"
          style={{
            background: "rgba(255,255,255,0.65)",
            border:     "1px solid rgba(0,0,0,0.08)",
            color:      "#6b7280",
          }}
        >
          Project Activity
        </span>

        {/* Headline */}
        <h2
          className="mt-4 text-[2.5rem] font-light text-gray-900 tracking-tight"
          style={{ lineHeight: 1.1 }}
        >
          New Project<br />Momentum
        </h2>

        {/* Narrative */}
        <p className="mt-6 text-sm text-gray-500 leading-relaxed max-w-[360px]">
          {latest?.projects ?? 0} projects onboarded in{" "}
          <span className="font-medium text-gray-800">{latest?.month ?? "Mar"}</span>.
          Growth is{" "}
          <span
            className="font-medium"
            style={{ color: trendColor }}
          >
            {sign}{latest?.growthPercent ?? 0}%
          </span>{" "}
          vs the previous month. February was the strongest month this quarter.
        </p>

        {/* Inline stat row */}
        <div className="flex items-center gap-6 mt-6">
          {data.slice(0, 3).map((m) => {
            const pos  = m.growthPercent >= 0;
            const c    = pos ? "#16a34a" : "#ef4444";
            const s    = pos ? "+" : "";
            return (
              <div key={m.month}>
                <p
                  className="text-[1.35rem] font-light font-sans leading-none"
                  style={{ color: c }}
                >
                  {s}{m.growthPercent}%
                </p>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                  {m.month}
                </p>
              </div>
            );
          })}
          <div
            className="w-px self-stretch"
            style={{ background: "rgba(0,0,0,0.08)" }}
          />
          <div>
            <p className="text-[1.35rem] font-light font-sans leading-none text-gray-800">
              {data.reduce((s, m) => s + m.projects, 0)}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">
              Total projects
            </p>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-3 mt-8 flex-wrap">
          <Link
            href="/clients"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            style={{
              background: "rgba(255,255,255,0.65)",
              border:     "1px solid rgba(0,0,0,0.1)",
              color:      "#374151",
            }}
          >
            <FolderOpen className="w-4 h-4 shrink-0" style={{ color: "#fd7e14" }} />
            View all projects
          </Link>

          <Link
            href="/analytics"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            style={{
              background: "#fd7e14",
              color:      "#ffffff",
            }}
          >
            <TrendIcon className="w-4 h-4 shrink-0" />
            Growth report
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Right column: glass container + chart ─────────────────────────── */}
      <ProjectsRightColumn data={data} />
    </div>
  );
}
