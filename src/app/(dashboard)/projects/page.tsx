"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, Search } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

const PROJECTS = [
  {
    id: "aaaaaaaa-0000-0000-0000-000000000001",
    name: "SEO & Google My Business",
    client: "Nandhini Hotel",
    client_id: "11111111-0000-0000-0000-000000000001",
    type: "seo",
    engagement: "retainer",
    value: "Rs.65,000/mo",
    status: "active_execution" as const,
    start: "2025-04-01",
    end: "2026-03-31",
  },
  {
    id: "aaaaaaaa-0000-0000-0000-000000000002",
    name: "SEO Retainer - Maximus",
    client: "Maximus OIGA",
    client_id: "22222222-0000-0000-0000-000000000002",
    type: "seo",
    engagement: "retainer",
    value: "Rs.50,000/mo",
    status: "active_execution" as const,
    start: "2025-06-01",
    end: "2026-05-31",
  },
  {
    id: "aaaaaaaa-0000-0000-0000-000000000003",
    name: "Website Development - Dentique",
    client: "Dentique Dental Care",
    client_id: "44444444-0000-0000-0000-000000000004",
    type: "web_development",
    engagement: "one_time",
    value: "$1,350",
    status: "completed" as const,
    start: "2025-11-01",
    end: null,
  },
  {
    id: "aaaaaaaa-0000-0000-0000-000000000004",
    name: "SEO & Digital Marketing",
    client: "Sea Wonders",
    client_id: "55555555-0000-0000-0000-000000000005",
    type: "seo",
    engagement: "retainer",
    value: "AED 4,000/mo",
    status: "active_execution" as const,
    start: "2025-08-01",
    end: "2026-07-31",
  },
  {
    id: "aaaaaaaa-0000-0000-0000-000000000005",
    name: "Brand Identity - Godavari",
    client: "Godavari Heritage",
    client_id: "33333333-0000-0000-0000-000000000003",
    type: "branding",
    engagement: "one_time",
    value: "Rs.85,000",
    status: "design_phase" as const,
    start: "2026-01-15",
    end: null,
  },
  {
    id: "aaaaaaaa-0000-0000-0000-000000000006",
    name: "Website - Raj Enterprises",
    client: "Raj Enterprises",
    client_id: "66666666-0000-0000-0000-000000000006",
    type: "web_development",
    engagement: "one_time",
    value: "Rs.35,000",
    status: "development_phase" as const,
    start: "2026-02-01",
    end: null,
  },
];

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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Projects"
        description={`${PROJECTS.filter((p) => p.status === "active_execution").length} active, ${PROJECTS.length} total`}
        action={
          <Link
            href="/projects/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        }
      />

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
          {filtered.map((project) => (
            <GlassCard key={project.id} padding="none">
              <div className="flex items-center gap-4 px-5 py-4">
                <div
                  className="w-9 h-9 rounded-button flex items-center justify-center shrink-0"
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
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <Link
                      href={`/clients/${project.client_id}`}
                      className="text-xs text-text-muted hover:text-accent transition-colors"
                    >
                      {project.client}
                    </Link>
                    <span className="text-text-muted">-</span>
                    <span className="text-xs text-text-muted">Started {formatDate(project.start)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-sans font-semibold text-text-primary">{project.value}</span>
                  <StatusBadge status={project.status} />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
