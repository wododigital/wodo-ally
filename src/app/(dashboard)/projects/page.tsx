"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, Search, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkLabel, DarkCard } from "@/components/shared/dark-section";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

// ─── Mock data ─────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    id: "aaaaaaaa-0000-0000-0000-000000000001",
    name: "SEO & Google My Business",
    client: "Nandhini Hotel",
    client_id: "11111111-0000-0000-0000-000000000001",
    type: "seo",
    engagement: "retainer",
    monthly_value: 65000,
    currency: "INR",
    value: "Rs.65,000/mo",
    status: "active_execution" as const,
    start: "2025-04-01",
    end: "2026-03-31",
    progress_pct: 88,
  },
  {
    id: "aaaaaaaa-0000-0000-0000-000000000002",
    name: "SEO Retainer - Maximus",
    client: "Maximus OIGA",
    client_id: "22222222-0000-0000-0000-000000000002",
    type: "seo",
    engagement: "retainer",
    monthly_value: 50000,
    currency: "INR",
    value: "Rs.50,000/mo",
    status: "active_execution" as const,
    start: "2025-06-01",
    end: "2026-05-31",
    progress_pct: 75,
  },
  {
    id: "aaaaaaaa-0000-0000-0000-000000000003",
    name: "Website Development - Dentique",
    client: "Dentique Dental Care",
    client_id: "44444444-0000-0000-0000-000000000004",
    type: "web_development",
    engagement: "one_time",
    monthly_value: 0,
    currency: "USD",
    value: "$1,350",
    status: "completed" as const,
    start: "2025-11-01",
    end: "2025-12-15",
    progress_pct: 100,
  },
  {
    id: "aaaaaaaa-0000-0000-0000-000000000004",
    name: "SEO & Digital Marketing",
    client: "Sea Wonders",
    client_id: "55555555-0000-0000-0000-000000000005",
    type: "seo",
    engagement: "retainer",
    monthly_value: 22000,
    currency: "AED",
    value: "AED 4,000/mo",
    status: "active_execution" as const,
    start: "2025-08-01",
    end: "2026-07-31",
    progress_pct: 65,
  },
  {
    id: "aaaaaaaa-0000-0000-0000-000000000005",
    name: "Brand Identity - Godavari",
    client: "Godavari Heritage",
    client_id: "33333333-0000-0000-0000-000000000003",
    type: "branding",
    engagement: "one_time",
    monthly_value: 0,
    currency: "INR",
    value: "Rs.85,000",
    status: "design_phase" as const,
    start: "2026-01-15",
    end: null,
    progress_pct: 40,
  },
  {
    id: "aaaaaaaa-0000-0000-0000-000000000006",
    name: "Website - Raj Enterprises",
    client: "Raj Enterprises",
    client_id: "66666666-0000-0000-0000-000000000006",
    type: "web_development",
    engagement: "one_time",
    monthly_value: 0,
    currency: "INR",
    value: "Rs.35,000",
    status: "development_phase" as const,
    start: "2026-02-01",
    end: null,
    progress_pct: 30,
  },
];

// ─── Constants ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  seo: "SEO",
  web_development: "Web Dev",
  branding: "Branding",
  ui_ux_design: "UI/UX",
  google_ads: "Google Ads",
  social_media: "Social Media",
  gmb: "GMB",
  full_service: "Full Service",
  other: "Other",
};

const SERVICE_COLORS: Record<string, string> = {
  seo:             "#fd7e14",
  gmb:             "#f59e0b",
  web_development: "#3b82f6",
  branding:        "#8b5cf6",
  google_ads:      "#22c55e",
  social_media:    "#ec4899",
  ui_ux_design:    "#06b6d4",
  content_marketing:"#84cc16",
  full_service:    "#6366f1",
  other:           "#9ca3af",
};

const ACTIVE_STATUSES = ["onboarding","design_phase","development_phase","deployment_qa","setup_strategy","active_execution","maintenance"];

type TrajectoryLabel = "On Track" | "Delayed" | "Completed" | "On Hold";
type TrajectoryStyle = { label: TrajectoryLabel; color: string; bg: string };

function getTrajectory(project: typeof PROJECTS[0]): TrajectoryStyle {
  const s = project.status as string;
  if (s === "completed") return { label: "Completed", color: "#16a34a", bg: "rgba(22,163,74,0.10)" };
  if (s === "on_hold" || s === "cancelled") return { label: "On Hold", color: "#9ca3af", bg: "rgba(156,163,175,0.10)" };
  const start = new Date(project.start);
  const now   = new Date("2026-03-03");
  const endDate = project.end ? new Date(project.end) : null;
  if (!endDate) {
    return project.progress_pct >= 50
      ? { label: "On Track", color: "#3b82f6", bg: "rgba(59,130,246,0.10)" }
      : { label: "Delayed",  color: "#ef4444", bg: "rgba(239,68,68,0.10)" };
  }
  const totalMs   = endDate.getTime() - start.getTime();
  const elapsedMs = now.getTime() - start.getTime();
  const elapsedPct = Math.min(elapsedMs / totalMs, 1) * 100;
  const delta = project.progress_pct - elapsedPct;
  if (delta >= 5)  return { label: "On Track", color: "#16a34a", bg: "rgba(22,163,74,0.10)" };
  if (delta >= -8) return { label: "On Track", color: "#3b82f6", bg: "rgba(59,130,246,0.10)" };
  return { label: "Delayed", color: "#ef4444", bg: "rgba(239,68,68,0.10)" };
}

function getDaysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - new Date("2026-03-03").getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "retainer" | "one_time">("all");

  const filtered = PROJECTS.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.engagement === filter;
    return matchSearch && matchFilter;
  });

  const activeRetainers = PROJECTS.filter((p) => p.engagement === "retainer" && ACTIVE_STATUSES.includes(p.status));
  const committedMRR    = activeRetainers.reduce((s, p) => s + p.monthly_value, 0);
  const activeCount     = PROJECTS.filter((p) => ACTIVE_STATUSES.includes(p.status)).length;
  const oneTimeActive   = PROJECTS.filter((p) => p.engagement === "one_time" && ACTIVE_STATUSES.includes(p.status)).length;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Project KPIs */}
      <DarkSection>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>Project Overview</p>
          <div className="flex items-center gap-2">
            <Link href="/analytics/projects"
              className="px-2.5 py-1 rounded-button text-xs font-medium transition-all border bg-white/[0.04] text-white/50 border-white/[0.08] hover:border-white/[0.14] hover:text-white/70">
              Analytics
            </Link>
            <Link href="/projects/new"
              className="flex items-center gap-1.5 px-3 py-1 rounded-button text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "rgba(253,126,20,0.85)" }}>
              <Plus className="w-3 h-3" />
              New Project
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: TrendingUp,   label: "Committed MRR",    value: `Rs.${(committedMRR/1000).toFixed(0)}K`,  sub: "From active retainers",     color: "#fd7e14" },
            { icon: FolderKanban, label: "Active projects",  value: `${activeCount}`,                          sub: `${PROJECTS.length} total`,  color: "#22c55e" },
            { icon: Users,        label: "Retainers",        value: `${activeRetainers.length}`,               sub: "Recurring monthly work",    color: "#3b82f6" },
            { icon: CheckCircle2, label: "One-time active",  value: `${oneTimeActive}`,                        sub: "In delivery",               color: "#8b5cf6" },
          ].map((stat) => (
            <DarkCard key={stat.label} className="p-5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
                style={{ background: `${stat.color}18` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <p className="text-xl font-light font-sans mb-0.5" style={{ color: "rgba(255,255,255,0.92)" }}>
                {stat.value}
              </p>
              <p className="text-[11px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{stat.label}</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{stat.sub}</p>
            </DarkCard>
          ))}
        </div>
      </DarkSection>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="glass-input pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "retainer", "one_time"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-2 rounded-button text-xs font-medium transition-all duration-150",
                filter === f
                  ? "bg-accent-muted text-accent border border-accent-light"
                  : "bg-surface-DEFAULT text-text-secondary border border-black/[0.05] hover:border-black/[0.08]"
              )}
            >
              {f === "all" ? "All" : f === "retainer" ? "Retainer" : "One-Time"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Add a project to start tracking work and billing."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => {
            const traj = getTrajectory(project);
            const daysLeft = getDaysRemaining(project.end);
            const showDaysLeft = project.engagement === "one_time" && project.status !== "completed" && daysLeft !== null;

            return (
              <GlassCard key={project.id} padding="none">
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-9 h-9 rounded-button flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "rgba(253,126,20,0.10)", border: "1px solid rgba(253,126,20,0.15)" }}
                    >
                      <FolderKanban className="w-4 h-4 text-text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-text-primary">{project.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded bg-surface-DEFAULT text-text-muted border border-black/[0.05]">
                          {TYPE_LABELS[project.type] ?? project.type}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-surface-DEFAULT text-text-muted border border-black/[0.05]">
                          {project.engagement === "retainer" ? "Retainer" : "One-Time"}
                        </span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: traj.bg, color: traj.color }}
                        >
                          {traj.label}
                        </span>
                        {showDaysLeft && (
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{
                              background: daysLeft! <= 14 ? "rgba(239,68,68,0.10)" : "rgba(0,0,0,0.04)",
                              color: daysLeft! <= 14 ? "#ef4444" : "#6b7280",
                            }}
                          >
                            {daysLeft! > 0 ? `${daysLeft}d left` : `${Math.abs(daysLeft!)}d overdue`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <Link
                          href={`/clients/${project.client_id}`}
                          className="text-xs text-text-muted hover:text-accent transition-colors"
                        >
                          {project.client}
                        </Link>
                        <span className="text-text-muted text-xs">-</span>
                        <span className="text-xs text-text-muted">Started {formatDate(project.start)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm font-sans font-semibold text-text-primary">{project.value}</span>
                      <StatusBadge status={project.status} />
                    </div>
                  </div>

                  {project.status !== "completed" && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${project.progress_pct}%`,
                            backgroundColor: traj.color,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-sans text-text-muted shrink-0">{project.progress_pct}%</span>
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
