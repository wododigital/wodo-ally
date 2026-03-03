"use client";

import { useState } from "react";
import {
  FilePlus,
  Search,
  ChevronDown,
  Download,
  Pencil,
  FileText,
  Calendar,
  DollarSign,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContractStatus = "active" | "cancelled" | "draft";
type ContractType = "retainer" | "project";

interface Contract {
  id: string;
  client: string;
  contractType: ContractType;
  serviceLabel: string;
  startDate: string;
  endDate: string;
  valueDisplay: string;
  currency: "INR" | "USD" | "AED";
  status: ContractStatus;
}

// ---------------------------------------------------------------------------
// Static mock data
// ---------------------------------------------------------------------------

const CONTRACTS: Contract[] = [
  {
    id: "ctr1",
    client: "Nandhini Deluxe Hotel",
    contractType: "retainer",
    serviceLabel: "SEO Retainer",
    startDate: "Apr 2024",
    endDate: "Mar 2025",
    valueDisplay: "\u20B930,000/mo",
    currency: "INR",
    status: "active",
  },
  {
    id: "ctr2",
    client: "Maximus OIGA",
    contractType: "retainer",
    serviceLabel: "SEO Retainer",
    startDate: "Jun 2024",
    endDate: "May 2025",
    valueDisplay: "\u20B945,000/mo",
    currency: "INR",
    status: "active",
  },
  {
    id: "ctr3",
    client: "Godavari Heritage",
    contractType: "retainer",
    serviceLabel: "SEO Retainer",
    startDate: "Jan 2025",
    endDate: "Dec 2025",
    valueDisplay: "\u20B940,000/mo",
    currency: "INR",
    status: "active",
  },
  {
    id: "ctr4",
    client: "Dentique Dental Care",
    contractType: "project",
    serviceLabel: "Web Development Project",
    startDate: "Jan 2026",
    endDate: "Jun 2026",
    valueDisplay: "$2,500 total",
    currency: "USD",
    status: "active",
  },
];

const STATUS_FILTERS = ["All", "Active", "Expired", "Draft"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const TYPE_BADGE: Record<ContractType, string> = {
  retainer: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  project: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

const CURRENCY_COLOR: Record<Contract["currency"], string> = {
  INR: "text-green-400",
  USD: "text-yellow-400",
  AED: "text-teal-400",
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function matchesStatusFilter(status: ContractStatus, filter: StatusFilter): boolean {
  if (filter === "All") return true;
  if (filter === "Expired") return status === "cancelled";
  return status === filter.toLowerCase();
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ContractsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = CONTRACTS.filter((c) => {
    const matchSearch =
      c.client.toLowerCase().includes(search.toLowerCase()) ||
      c.serviceLabel.toLowerCase().includes(search.toLowerCase());
    const matchStatus = matchesStatusFilter(c.status, statusFilter);
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Contracts"
        description="Service agreements and engagement letters"
        action={
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            <FilePlus className="w-4 h-4" />
            New Contract
          </button>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client or contract type..."
            className="glass-input pl-9"
          />
        </div>

        {/* Status dropdown */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 rounded-button text-sm text-text-secondary bg-surface-DEFAULT border border-white/5 hover:border-white/15 hover:text-text-primary transition-all whitespace-nowrap"
          >
            <span className="font-medium">{statusFilter === "All" ? "All Statuses" : statusFilter}</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", filterOpen && "rotate-180")} />
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-20 glass-card py-1.5 min-w-[140px]">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => { setStatusFilter(f); setFilterOpen(false); }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors",
                    statusFilter === f
                      ? "text-accent bg-accent/5 font-medium"
                      : "text-text-secondary hover:text-text-primary hover:bg-white/4"
                  )}
                >
                  {f === "All" ? "All Statuses" : f}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contract list */}
      {filtered.length === 0 ? (
        <GlassCard padding="none">
          <EmptyState
            icon={FileText}
            title="No contracts found"
            description={
              search || statusFilter !== "All"
                ? "Try adjusting your search or filter."
                : "Create a contract to track service agreements with your clients."
            }
          />
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contract card
// ---------------------------------------------------------------------------

function ContractCard({ contract }: { contract: Contract }) {
  return (
    <GlassCard padding="md" className="group hover:border-white/12 transition-all">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-surface-DEFAULT border border-white/5 flex items-center justify-center shrink-0 group-hover:border-white/10 transition-all">
          <FileText className="w-5 h-5 text-text-muted" />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-semibold text-text-primary leading-tight">{contract.client}</p>
            <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", TYPE_BADGE[contract.contractType])}>
              {contract.contractType === "retainer" ? "Retainer" : "Project"}
            </span>
            <StatusBadge status={contract.status} />
          </div>

          <p className="text-sm text-text-secondary mb-3">{contract.serviceLabel}</p>

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {contract.startDate} - {contract.endDate}
            </span>
            <span className={cn("flex items-center gap-1.5 font-sans tabular-nums font-semibold", CURRENCY_COLOR[contract.currency])}>
              <DollarSign className="w-3.5 h-3.5" />
              {contract.valueDisplay}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button
            title="Download PDF"
            className="p-2 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT border border-transparent hover:border-white/5 transition-all"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            title="Edit contract"
            className="p-2 rounded-button text-text-muted hover:text-accent hover:bg-accent/5 border border-transparent hover:border-accent/20 transition-all"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
