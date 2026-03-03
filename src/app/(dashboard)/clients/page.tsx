"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Users, FileText } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils/cn";

// ─── Mock data ─────────────────────────────────────────────────────────────

const CLIENTS = [
  {
    id: "11111111-0000-0000-0000-000000000001",
    company_name: "Nandhini Deluxe Hotel",
    display_name: "Nandhini Hotel",
    invoice_type: "indian_gst" as const,
    region: "india" as const,
    currency: "INR" as const,
    health_score: 82,
    status: "active" as const,
    total_invoiced: 921900,
    first_invoice: "Apr 2025",
    avg_days_to_pay: 7.2,
    on_time_pct: 100,
    billing_day: 1,
  },
  {
    id: "22222222-0000-0000-0000-000000000002",
    company_name: "Maximus OIGA",
    display_name: "Maximus",
    invoice_type: "indian_gst" as const,
    region: "india" as const,
    currency: "INR" as const,
    health_score: 75,
    status: "active" as const,
    total_invoiced: 590000,
    first_invoice: "Jun 2025",
    avg_days_to_pay: 18.5,
    on_time_pct: 72,
    billing_day: 1,
  },
  {
    id: "33333333-0000-0000-0000-000000000003",
    company_name: "Godavari Heritage Hotels",
    display_name: "Godavari Heritage",
    invoice_type: "indian_gst" as const,
    region: "india" as const,
    currency: "INR" as const,
    health_score: 68,
    status: "active" as const,
    total_invoiced: 100300,
    first_invoice: "Jan 2026",
    avg_days_to_pay: 14.0,
    on_time_pct: 85,
  },
  {
    id: "44444444-0000-0000-0000-000000000004",
    company_name: "Dentique Dental Care",
    display_name: "Dentique",
    invoice_type: "international" as const,
    region: "usa" as const,
    currency: "USD" as const,
    health_score: 91,
    status: "active" as const,
    total_invoiced: 115830,
    first_invoice: "Dec 2025",
    avg_days_to_pay: 9.0,
    on_time_pct: 95,
  },
  {
    id: "55555555-0000-0000-0000-000000000005",
    company_name: "Sea Wonders Tourism",
    display_name: "Sea Wonders",
    invoice_type: "international" as const,
    region: "uae" as const,
    currency: "AED" as const,
    health_score: 88,
    status: "active" as const,
    total_invoiced: 89600,
    first_invoice: "Aug 2025",
    avg_days_to_pay: 11.3,
    on_time_pct: 90,
    billing_day: 1,
  },
  {
    id: "66666666-0000-0000-0000-000000000006",
    company_name: "Raj Enterprises",
    display_name: "Raj Enterprises",
    invoice_type: "indian_non_gst" as const,
    region: "india" as const,
    currency: "INR" as const,
    health_score: 55,
    status: "active" as const,
    total_invoiced: 17500,
    first_invoice: "Feb 2026",
    avg_days_to_pay: 31.0,
    on_time_pct: 50,
  },
];

// ─── Constants ─────────────────────────────────────────────────────────────

const INVOICE_TYPE_LABELS = {
  indian_gst: "GST Invoice",
  indian_non_gst: "Non-GST",
  international: "International",
};

const INVOICE_TYPE_COLORS = {
  indian_gst: "text-blue-500 bg-blue-500/[0.08] border-blue-500/20",
  indian_non_gst: "text-yellow-500 bg-yellow-500/[0.08] border-yellow-500/20",
  international: "text-purple-500 bg-purple-500/[0.08] border-purple-500/20",
};

const REGION_FLAGS: Record<string, string> = {
  india: "IN",
  usa: "US",
  uae: "AE",
  uk: "UK",
  other: "--",
};

type FilterType = "all" | "indian_gst" | "indian_non_gst" | "international";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "indian_gst", label: "GST Invoice" },
  { value: "indian_non_gst", label: "Non-GST" },
  { value: "international", label: "International" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function healthLabel(score: number): { label: string; color: string } {
  if (score >= 85) return { label: "Excellent", color: "#16a34a" };
  if (score >= 70) return { label: "Good", color: "#3b82f6" };
  if (score >= 55) return { label: "Fair", color: "#f59e0b" };
  return { label: "At Risk", color: "#ef4444" };
}

function payBehaviorLabel(days: number, pct: number): { text: string; color: string } {
  if (days <= 10 && pct >= 90) return { text: "Prompt payer", color: "#16a34a" };
  if (days <= 20 && pct >= 75) return { text: "Usually on time", color: "#3b82f6" };
  if (days <= 30 && pct >= 60) return { text: "Occasional delays", color: "#f59e0b" };
  return { text: "Slow payer", color: "#ef4444" };
}

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function formatRevenue(amount: number, currency: string) {
  if (currency === "USD") return `$${(amount / 1000).toFixed(1)}K`;
  if (currency === "AED") return `AED ${(amount / 1000).toFixed(0)}K`;
  if (amount >= 100000) return `Rs.${(amount / 100000).toFixed(1)}L`;
  return `Rs.${(amount / 1000).toFixed(0)}K`;
}

// ─── CircularHealth ──────────────────────────────────────────────────────────

function CircularHealth({ score }: { score: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="3.5" />
        <circle
          cx="22" cy="22" r={r}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold font-sans leading-none" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = CLIENTS.filter((c) => {
    const matchSearch =
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      c.display_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.invoice_type === filter;
    return matchSearch && matchFilter;
  });

  // counts per filter tab
  const counts = FILTERS.reduce<Record<FilterType, number>>((acc, f) => {
    acc[f.value] = f.value === "all"
      ? CLIENTS.length
      : CLIENTS.filter((c) => c.invoice_type === f.value).length;
    return acc;
  }, {} as Record<FilterType, number>);

  return (
    <div className="space-y-8 animate-fade-in">
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

      {/* Search + filter tabs */}
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
        {/* Tab pills with counts */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-button text-xs font-medium transition-all duration-150 whitespace-nowrap",
                filter === f.value
                  ? "bg-accent-muted text-accent border border-accent-light"
                  : "bg-surface-DEFAULT text-text-secondary hover:text-text-primary border border-black/[0.05] hover:border-black/[0.08]"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "text-[10px] font-sans px-1.5 py-0.5 rounded-full",
                  filter === f.value ? "bg-accent/20 text-accent" : "bg-black/[0.04] text-text-muted"
                )}
              >
                {counts[f.value]}
              </span>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((client) => {
            const hl = healthLabel(client.health_score);
            const pb = payBehaviorLabel(client.avg_days_to_pay, client.on_time_pct);

            return (
              <div key={client.id} className="relative group">
                <Link href={`/clients/${client.id}`}>
                  <GlassCard
                    padding="md"
                    className="hover:border-black/[0.10] transition-all duration-200 h-full flex flex-col gap-4"
                  >
                    {/* Header: avatar + names */}
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-button flex items-center justify-center text-sm font-bold text-accent shrink-0"
                        style={{ background: "rgba(253,126,20,0.12)", border: "1px solid rgba(253,126,20,0.18)" }}
                      >
                        {client.company_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                          {client.display_name}
                        </p>
                        <p className="text-xs text-text-muted truncate mt-0.5">{client.company_name}</p>
                      </div>
                    </div>

                    {/* Invoice type + country + status */}
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded border font-medium",
                        INVOICE_TYPE_COLORS[client.invoice_type]
                      )}>
                        {INVOICE_TYPE_LABELS[client.invoice_type]}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-sans font-medium text-text-muted px-1.5 py-0.5 rounded bg-surface-DEFAULT border border-black/[0.05]">
                          {REGION_FLAGS[client.region]}
                        </span>
                        <StatusBadge status={client.status} />
                      </div>
                    </div>

                    {/* Health score + revenue */}
                    <div className="flex items-center gap-4 pt-3 border-t border-black/[0.05]">
                      <CircularHealth score={client.health_score} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-semibold" style={{ color: hl.color }}>{hl.label}</span>
                        </div>
                        <p className="text-sm font-bold font-sans text-text-primary">
                          {formatRevenue(client.total_invoiced, client.currency)}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">since {client.first_invoice}</p>
                      </div>
                    </div>

                    {/* Payment behaviour */}
                    <div
                      className="flex items-center justify-between text-xs px-3 py-2 rounded-card"
                      style={{ background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.04)" }}
                    >
                      <span className="text-text-muted">Pays in ~{client.avg_days_to_pay}d</span>
                      <div className="flex items-center gap-2">
                        {(client as typeof client & { billing_day?: number }).billing_day && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-blue-500 bg-blue-500/10">
                            Bills {getOrdinal((client as typeof client & { billing_day?: number }).billing_day!)}
                          </span>
                        )}
                        <span className="font-medium" style={{ color: pb.color }}>{pb.text}</span>
                      </div>
                    </div>
                  </GlassCard>
                </Link>

                {/* Hover quick action: Create Invoice */}
                <Link
                  href={`/invoices/new?client=${client.id}`}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center gap-1.5 px-2.5 py-1.5 rounded-button text-[11px] font-medium text-white z-10"
                  style={{ background: "#fd7e14" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <FileText className="w-3 h-3" />
                  Invoice
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
