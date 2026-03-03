"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Users, Building2, Globe, MapPin } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils/cn";

const CLIENTS = [
  {
    id: "11111111-0000-0000-0000-000000000001",
    company_name: "Nandhini Deluxe Hotel",
    display_name: "Nandhini Hotel",
    client_type: "indian_gst" as const,
    region: "india" as const,
    currency: "INR" as const,
    city: "Bangalore",
    country: "India",
    health_score: 82,
    status: "active" as const,
    contact_name: "Ramesh Kumar",
    contact_email: "accounts@nandhinideluxe.com",
    active_projects: 1,
    total_invoiced: 921900,
  },
  {
    id: "22222222-0000-0000-0000-000000000002",
    company_name: "Maximus OIGA",
    display_name: "Maximus",
    client_type: "indian_gst" as const,
    region: "india" as const,
    currency: "INR" as const,
    city: "Bangalore",
    country: "India",
    health_score: 75,
    status: "active" as const,
    contact_name: "Priya Sharma",
    contact_email: "finance@maximusoiga.com",
    active_projects: 1,
    total_invoiced: 590000,
  },
  {
    id: "33333333-0000-0000-0000-000000000003",
    company_name: "Godavari Heritage Hotels",
    display_name: "Godavari Heritage",
    client_type: "indian_gst" as const,
    region: "india" as const,
    currency: "INR" as const,
    city: "Bangalore",
    country: "India",
    health_score: 68,
    status: "active" as const,
    contact_name: "Venkat Rao",
    contact_email: "billing@godavariheritage.com",
    active_projects: 1,
    total_invoiced: 100300,
  },
  {
    id: "44444444-0000-0000-0000-000000000004",
    company_name: "Dentique Dental Care",
    display_name: "Dentique",
    client_type: "international" as const,
    region: "usa" as const,
    currency: "USD" as const,
    city: "Houston",
    country: "USA",
    health_score: 91,
    status: "active" as const,
    contact_name: "Dr. Sarah Mitchell",
    contact_email: "sarah@dentiquedental.com",
    active_projects: 0,
    total_invoiced: 115830,
  },
  {
    id: "55555555-0000-0000-0000-000000000005",
    company_name: "Sea Wonders Tourism",
    display_name: "Sea Wonders",
    client_type: "international" as const,
    region: "uae" as const,
    currency: "AED" as const,
    city: "Dubai",
    country: "UAE",
    health_score: 88,
    status: "active" as const,
    contact_name: "Ahmed Al Rashidi",
    contact_email: "ahmed@seawonders.ae",
    active_projects: 1,
    total_invoiced: 89600,
  },
  {
    id: "66666666-0000-0000-0000-000000000006",
    company_name: "Raj Enterprises",
    display_name: "Raj Enterprises",
    client_type: "indian_non_gst" as const,
    region: "india" as const,
    currency: "INR" as const,
    city: "Bangalore",
    country: "India",
    health_score: 55,
    status: "active" as const,
    contact_name: "Rajesh Patel",
    contact_email: "rajesh@rajenterprises.in",
    active_projects: 1,
    total_invoiced: 17500,
  },
];

const CLIENT_TYPE_LABELS = {
  indian_gst: "Indian GST",
  indian_non_gst: "Non-GST",
  international: "International",
};

const REGION_FLAGS = {
  india: "IN",
  usa: "US",
  uae: "AE",
  uk: "UK",
  other: "--",
};

function HealthBar({ score }: { score: number }) {
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-black/[0.04] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-sans text-text-muted w-6 text-right">{score}</span>
    </div>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "indian_gst" | "indian_non_gst" | "international">("all");

  const filtered = CLIENTS.filter((c) => {
    const matchSearch =
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_name.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.client_type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Clients"
        description={`${CLIENTS.length} total clients`}
        action={
          <Link
            href="/clients/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold text-white transition-all duration-200"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            <Plus className="w-4 h-4" />
            Add Client
          </Link>
        }
      />

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="glass-input pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "indian_gst", "indian_non_gst", "international"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-2 rounded-button text-xs font-medium transition-all duration-150",
                filter === f
                  ? "bg-accent-muted text-accent border border-accent-light"
                  : "bg-surface-DEFAULT text-text-secondary hover:text-text-primary border border-black/[0.05] hover:border-black/[0.08]"
              )}
            >
              {f === "all" ? "All" : CLIENT_TYPE_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Client grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients found"
          description="Try adjusting your search or add a new client."
          action={{ label: "Add Client", onClick: () => {} }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <GlassCard padding="md" className="group hover:border-black/[0.10] transition-all duration-200 h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-button flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: "rgba(253,126,20,0.15)", border: "1px solid rgba(253,126,20,0.2)" }}
                    >
                      {client.company_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                        {client.display_name ?? client.company_name}
                      </p>
                      <p className="text-xs text-text-muted truncate">{client.company_name}</p>
                    </div>
                  </div>
                  <StatusBadge status={client.status} />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <MapPin className="w-3 h-3 text-text-muted shrink-0" />
                    {client.city}, {client.country}
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-surface-DEFAULT text-text-muted font-sans">
                      {REGION_FLAGS[client.region]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Building2 className="w-3 h-3 text-text-muted shrink-0" />
                    {CLIENT_TYPE_LABELS[client.client_type]}
                    <span className="text-text-muted">-</span>
                    <span className="font-sans">{client.currency}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Globe className="w-3 h-3 text-text-muted shrink-0" />
                    {client.contact_name}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-black/[0.05] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Health score</span>
                    <span className="text-text-secondary">{client.active_projects} active project{client.active_projects !== 1 ? "s" : ""}</span>
                  </div>
                  <HealthBar score={client.health_score} />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
