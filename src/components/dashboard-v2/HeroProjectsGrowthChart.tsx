"use client";

import { useId } from "react";
import { ResponsiveContainer, PieChart, Pie, Customized } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MonthlyGrowth = {
  month: string;
  projects: number;
  growthPercent: number;
};

type Props = {
  data: MonthlyGrowth[]; // exactly 3 entries, oldest → newest
};

// ─── Layout ───────────────────────────────────────────────────────────────────
//
// Each arc has cx = its own radius, so the left end of every arc's diameter
// lands at x = cx - R = 0. All three domes share the same left anchor point
// and fan rightward with their own widths.
//
const CHART_H = 320;

// Outer → inner arc radii (pixels). Largest rendered first (lowest z-order).
const RADII = [260, 220, 126] as const;

// Per-arc gradient stops — horizontal left→right
// arc0 outer: near-transparent warm white → faint orange
// arc1 middle: soft warm cream → soft orange
// arc2 inner: light warm → orange-coral
const GRAD_STOPS = [
  { color0: "#FFF0E0", op0: 0.4,  color1: "#FFA230", op1: 0.7  },
  { color0: "#FFF5EB", op0: 0.5,  color1: "#FFA230", op1: 0.35 },
  { color0: "#F5F0EB", op0: 0.35, color1: "#FFA230", op1: 0.2  },
] as const;

// ─── Label geometry ───────────────────────────────────────────────────────────
//
// Each arc has its own cx = R, so the pt() helper takes cx explicitly.
// For a point at angle θ on an arc centred at (cx, CHART_H):
//   SVG x = cx + R · cos(θ)
//   SVG y = CHART_H − R · sin(θ)

const toRad = (deg: number) => (deg * Math.PI) / 180;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pt(cx: number, r: number, deg: number): [number, number] {
  const rad = toRad(deg);
  return [cx + r * Math.cos(rad), CHART_H - r * Math.sin(rad)];
}

function growthColor(g: number): string {
  if (g > 0) return "#fd7e14";
  if (g < 0) return "#ef4444";
  return "#9ca3af";
}

// ─── Gradient defs (rendered as SVG defs via Customized) ─────────────────────

function GradDefs({ uid }: { uid: string }) {
  return (
    <defs>
      {GRAD_STOPS.map((g, i) => (
        <linearGradient key={i} id={`g${uid}${i}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={g.color0} stopOpacity={g.op0} />
          <stop offset="100%" stopColor={g.color1} stopOpacity={g.op1} />
        </linearGradient>
      ))}
    </defs>
  );
}

// ─── Arc labels (rendered as SVG text+circle via Customized) ─────────────────

function ArcLabels({ months }: { months: MonthlyGrowth[] }) {
  return (
    <g>
      {months.slice(0, 3).map((m, i) => {
        const R     = RADII[i];
        const cx    = R; // each arc's center-x equals its radius
        const color = growthColor(m.growthPercent);
        const sign  = m.growthPercent > 0 ? "+" : "";

        // Dot: exactly on the arc circumference at 90° (top center)
        const [dotX, dotY] = pt(cx, R, 90);

        // Growth %: above the dot, outside the arc
        const labX = dotX;
        const labY = dotY - 18;

        // Month: below the dot, inside the arc
        const mX = dotX;
        const mY = dotY + 18;

        return (
          <g key={m.month}>
            {/* Dot on the arc at 12 o'clock */}
            <circle cx={dotX} cy={dotY} r={3.5} fill={color} />

            {/* Growth % — above the dot */}
            <text
              x={labX}
              y={labY}
              textAnchor="middle"
              fill={color}
              fontSize={13}
              fontWeight={600}
              fontFamily="var(--font-manrope), system-ui, sans-serif"
            >
              {sign}{m.growthPercent}%
            </text>

            {/* Month — below the dot, inside the arc */}
            <text
              x={mX}
              y={mY}
              textAnchor="middle"
              fill="rgba(107,114,128,0.65)"
              fontSize={10}
              fontWeight={500}
            >
              {m.month.toUpperCase()}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ─── Single-sector data (value=100 = full sweep) ──────────────────────────────

const PIE_DATA = [{ value: 100 }];

// ─── Component ────────────────────────────────────────────────────────────────

export function HeroProjectsGrowthChart({ data }: Props) {
  // Per-instance IDs so two charts on the same page never clash
  const uid    = useId().replace(/[^a-zA-Z0-9]/g, "");
  const months = data.slice(0, 3);

  return (
    <div>
      {/* ── Chart ── */}
      <div style={{ width: "100%", height: CHART_H, display: "flex", justifyContent: "flex-start" }}>
        <ResponsiveContainer width={RADII[0] * 2 + 40} height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>

            {/* 1. Gradient definitions */}
            <Customized component={() => <GradDefs uid={uid} />} />

            {/* 2. Arcs — largest first so smaller arcs render on top.
                Each cx = its own radius so all left edges land at x=0. */}
            <Pie
              data={PIE_DATA}
              dataKey="value"
              cx={RADII[0]} cy={CHART_H}
              startAngle={180} endAngle={0}
              innerRadius={0} outerRadius={RADII[0]}
              fill={`url(#g${uid}0)`}
              stroke="#FFA230" strokeWidth={0.5} strokeOpacity={0.15}
              isAnimationActive={false}
            />
            <Pie
              data={PIE_DATA}
              dataKey="value"
              cx={RADII[1]} cy={CHART_H}
              startAngle={180} endAngle={0}
              innerRadius={0} outerRadius={RADII[1]}
              fill={`url(#g${uid}1)`}
              stroke="#FFA230" strokeWidth={0.5} strokeOpacity={0.15}
              isAnimationActive={false}
            />
            <Pie
              data={PIE_DATA}
              dataKey="value"
              cx={RADII[2]} cy={CHART_H}
              startAngle={180} endAngle={0}
              innerRadius={0} outerRadius={RADII[2]}
              fill={`url(#g${uid}2)`}
              stroke="#FFA230" strokeWidth={0.5} strokeOpacity={0.15}
              isAnimationActive={false}
            />

            {/* 3. Labels on top of all arcs */}
            <Customized component={() => <ArcLabels months={months} />} />

          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ── Caption ── */}
      <p
        style={{
          textAlign:  "center",
          fontSize:   12,
          color:      "#9ca3af",
          marginTop:  18,
          lineHeight: 1.5,
        }}
      >
        New projects added over the last 3 months
      </p>
    </div>
  );
}
