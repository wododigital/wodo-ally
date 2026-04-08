"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, Search, TrendingUp, Users, CheckCircle2, BarChart2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkCard } from "@/components/shared/dark-section";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { AddProjectModal } from "@/components/shared/add-project-modal";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { useProjects, useUpdateProject } from "@/lib/hooks/use-projects";

// ─── Constants ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  seo: "SEO",
  web_development: "Web Dev",
  branding: "Branding",
  ui_ux_design: "UI/UX",
  google_ads: "Google Ads",
  social_media: "Social Media",
  gmb: "GMB",
  content_marketing: "Content",
  full_service: "Full Service",
  other: "Other",
};

const ACTIVE_STATUSES = [
  "onboarding",
  "design_phase",
  "development_phase",
  "deployment_qa",
  "setup_strategy",
  "active_execution",
  "maintenance",
];

type TrajectoryLabel = "On Track" | "Delayed" | "Completed" | "On Hold";
type TrajectoryStyle = { label: TrajectoryLabel; color: string; bg: string };

function getTrajectory(
  status: string,
  progressPct: number,
  startDate: string | null,
  endDate: string | null
): TrajectoryStyle {
  if (status === "completed") return { label: "Completed", color: "#16a34a", bg: "rgba(22,163,74,0.10)" };
  if (status === "on_hold" || status === "cancelled") return { label: "On Hold", color: "#9ca3af", bg: "rgba(156,163,175,0.10)" };

  const now = new Date();

  if (!startDate || !endDate) {
    return progressPct >= 50
      ? { label: "On Track", color: "#3b82f6", bg: "rgba(59,130,246,0.10)" }
      : { label: "Delayed", color: "#ef4444", bg: "rgba(239,68,68,0.10)" };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = now.getTime() - start.getTime();
  const elapsedPct = Math.min(elapsedMs / totalMs, 1) * 100;
  const delta = progressPct - elapsedPct;

  if (delta >= 5)  return { label: "On Track", color: "#16a34a", bg: "rgba(22,163,74,0.10)" };
  if (delta >= -8) return { label: "On Track", color: "#3b82f6", bg: "rgba(59,130,246,0.10)" };
  return { label: "Delayed", color: "#ef4444", bg: "rgba(239,68,68,0.10)" };
}

function getDaysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function ProjectRowSkeleton() {
  return (
    <div className="glass-card px-5 py-4">
      <div className="flex items-start gap-4">
        <Skeleton className="w-9 h-9 rounded-button shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Progress Bar with inline edit ──────────────────────────────────────────

function ProgressBar({ projectId, pct, color }: { projectId: string; pct: number; color: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pct);
  const updateProject = useUpdateProject();

  function save() {
    if (draft !== pct) {
      updateProject.mutate({ id: projectId, data: { progress_pct: draft } });
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={draft}
          onChange={(e) => setDraft(Number(e.target.value))}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          className="flex-1 accent-accent h-1.5 cursor-pointer"
          autoFocus
        />
        <span className="text-[10px] font-sans text-accent font-semibold shrink-0 w-8 text-right">{draft}%</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 group cursor-pointer"
      onClick={() => { setDraft(pct); setEditing(true); }}
      title="Click to update progress"
    >
      <div className="flex-1 h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-sans text-text-muted group-hover:text-accent shrink-0 transition-colors">{pct}%</span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "retainer" | "one_time">("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: projects = [], isLoading, isError, error } = useProjects();

  const filtered = projects.filter((p) => {
    const clientName = p.clients?.company_name ?? "";
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.engagement_type === filter;
    return matchSearch && matchFilter;
  });

  const activeRetainers = projects.filter(
    (p) => p.engagement_type === "retainer" && ACTIVE_STATUSES.includes(p.status)
  );
  const committedMRR = activeRetainers.reduce((s, p) => s + (p.retainer_amount ?? 0), 0);
  const activeCount = projects.filter((p) => ACTIVE_STATUSES.includes(p.status)).length;
  const oneTimeActive = projects.filter(
    (p) => p.engagement_type === "one_time" && ACTIVE_STATUSES.includes(p.status)
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {showAddModal && <AddProjectModal onClose={() => setShowAddModal(false)} />}

      {/* Project KPIs */}
      <DarkSection>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>Project Overview</p>
          <div className="flex items-center gap-2">
            <Link href="/analytics/projects"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium transition-all border bg-white/[0.04] text-white/50 border-white/[0.08] hover:border-white/[0.14] hover:text-white/70">
              <BarChart2 className="w-3.5 h-3.5" />
              Analytics
            </Link>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-button text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "rgba(253,126,20,0.85)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: TrendingUp,   label: "Committed MRR",    value: isLoading ? "-" : `Rs.${(committedMRR / 1000).toFixed(0)}K`,  sub: "From active retainers",           color: "#fd7e14" },
            { icon: FolderKanban, label: "Active projects",  value: isLoading ? "-" : `${activeCount}`,                            sub: `${projects.length} total`,        color: "#22c55e" },
            { icon: Users,        label: "Retainers",        value: isLoading ? "-" : `${activeRetainers.length}`,                 sub: "Recurring monthly work",          color: "#3b82f6" },
            { icon: CheckCircle2, label: "One-time active",  value: isLoading ? "-" : `${oneTimeActive}`,                          sub: "In delivery",                     color: "#8b5cf6" },
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

      {/* Error state */}
      {isError && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-500 border border-red-500/20 bg-red-500/[0.06]">
          Failed to load projects: {(error as Error)?.message ?? "Unknown error"}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <ProjectRowSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Add a project to start tracking work and billing."
          action={{ label: "New Project", onClick: () => setShowAddModal(true) }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => {
            const traj = getTrajectory(
              project.status,
              project.progress_pct,
              project.contract_start_date,
              project.contract_end_date
            );
            const daysLeft = getDaysRemaining(project.contract_end_date);
            const showDaysLeft =
              project.engagement_type === "one_time" &&
              project.status !== "completed" &&
              daysLeft !== null;

            const clientName = project.clients?.company_name ?? "Unknown Client";

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
                          {TYPE_LABELS[project.project_type] ?? project.project_type}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-surface-DEFAULT text-text-muted border border-black/[0.05]">
                          {project.engagement_type === "retainer" ? "Retainer" : "One-Time"}
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
                          {clientName}
                        </Link>
                        {project.contract_start_date && (
                          <>
                            <span className="text-text-muted text-xs">-</span>
                            <span className="text-xs text-text-muted">Started {formatDate(project.contract_start_date)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      {project.retainer_amount !== null ? (
                        <span className="text-sm font-sans font-semibold text-text-primary">
                          {project.retainer_currency ?? "INR"} {(project.retainer_amount ?? 0).toLocaleString()}/mo
                        </span>
                      ) : project.total_value !== null ? (
                        <span className="text-sm font-sans font-semibold text-text-primary">
                          {(project.total_value ?? 0).toLocaleString()}
                        </span>
                      ) : null}
                      <StatusBadge status={project.status} />
                    </div>
                  </div>

                  {project.status !== "completed" && (
                    <ProgressBar projectId={project.id} pct={project.progress_pct ?? 0} color={traj.color} />
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
