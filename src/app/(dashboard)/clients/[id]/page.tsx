"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Mail, Phone, Globe, MapPin, Building2,
  FileText, CreditCard, FolderKanban, Edit, Plus,
  CheckCircle2, XCircle, Calendar,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { useClient, useClientStats, useCloseClient, useReactivateClient } from "@/lib/hooks/use-clients";
import { useProjects } from "@/lib/hooks/use-projects";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

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

// ─── Close Confirmation Modal ─────────────────────────────────────────────────

function CloseClientModal({
  clientName,
  onConfirm,
  onCancel,
  isPending,
}: {
  clientName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{
          background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.10)" }}>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Close Client Account</h3>
            <p className="text-sm text-gray-500">{clientName}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
          <p>This will mark <span className="font-semibold text-gray-900">{clientName}</span> as closed.</p>
          <ul className="space-y-1.5 mt-3">
            {[
              "Retainer billing reminders will be stopped",
              "Client will be excluded from active dashboards",
              "All invoices, payments and project history are preserved",
              "You can re-activate this client at any time",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 rounded-button text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-button text-sm font-semibold text-white transition-colors disabled:opacity-70"
            style={{ background: "#ef4444" }}
          >
            {isPending ? "Closing..." : "Close Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ClientDetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-button" />
            <Skeleton className="h-8 w-24 rounded-button" />
            <Skeleton className="h-8 w-28 rounded-button" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const TABS = ["Overview", "Projects", "Invoices", "Payments"];

export default function ClientDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("Overview");
  const [showCloseModal, setShowCloseModal] = useState(false);

  const { data: client, isLoading, isError, error } = useClient(id);
  const { data: stats } = useClientStats(id);
  const { data: projects = [] } = useProjects(id);
  const closeClient = useCloseClient(id);
  const reactivateClient = useReactivateClient(id);

  if (isLoading) return <ClientDetailSkeleton />;

  if (isError || !client) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Link href="/clients" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <div className="rounded-xl px-4 py-3 text-sm text-red-500 border border-red-500/20 bg-red-500/[0.06]">
          Failed to load client: {(error as Error)?.message ?? "Client not found"}
        </div>
      </div>
    );
  }

  const isClosed = client.status === "closed";
  const isRetainer = projects.some((p) => p.engagement_type === "retainer");

  const totalInvoiced = stats?.total_invoiced ?? 0;
  const totalReceived = stats?.total_received ?? 0;
  const outstanding = stats?.outstanding ?? 0;

  function handleCloseConfirm() {
    closeClient.mutate(undefined, {
      onSuccess: () => setShowCloseModal(false),
    });
  }

  function handleReactivate() {
    reactivateClient.mutate();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {showCloseModal && (
        <CloseClientModal
          clientName={client.display_name ?? client.company_name}
          onConfirm={handleCloseConfirm}
          onCancel={() => setShowCloseModal(false)}
          isPending={closeClient.isPending}
        />
      )}

      {/* Back + header */}
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-accent"
              style={{ background: "rgba(253,126,20,0.12)", border: "1px solid rgba(253,126,20,0.2)" }}
            >
              {client.company_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{client.display_name ?? client.company_name}</h1>
              <p className="text-sm text-text-muted">{client.company_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={client.status} />
            <Link
              href={`/clients/${id}/edit`}
              className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT hover:bg-surface-hover border border-black/[0.05] transition-all duration-150"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            {!isClosed && (
              <button
                onClick={() => setShowCloseModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium transition-all duration-150"
                style={{
                  color: "#ef4444",
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)",
                }}
              >
                <XCircle className="w-4 h-4" />
                Close Client
              </button>
            )}
            {isClosed && (
              <button
                onClick={handleReactivate}
                disabled={reactivateClient.isPending}
                className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium transition-all duration-150 disabled:opacity-70"
                style={{
                  color: "#16a34a",
                  background: "rgba(22,163,74,0.06)",
                  border: "1px solid rgba(22,163,74,0.15)",
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                {reactivateClient.isPending ? "Reactivating..." : "Re-activate"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Closed banner */}
      {isClosed && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
        >
          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-red-400 font-medium">This client account is closed.</span>
          <span className="text-red-400/70">Billing reminders paused. All history preserved.</span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard padding="md">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Invoiced</p>
          <CurrencyDisplay amount={totalInvoiced} currency={client.currency} size="md" />
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Received</p>
          <CurrencyDisplay amount={totalReceived} currency={client.currency} size="md" className="text-green-400" />
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Balance Due</p>
          <CurrencyDisplay amount={outstanding} currency={client.currency} size="md" className="text-yellow-400" />
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Health Score</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${client.health_score}%`,
                  backgroundColor: client.health_score >= 80 ? "#16a34a" : client.health_score >= 60 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
            <span className="text-sm font-bold font-sans text-text-primary">{client.health_score}</span>
          </div>
        </GlassCard>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b border-black/[0.05]">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-all duration-150 border-b-2 -mb-px",
                activeTab === tab
                  ? "text-accent border-accent"
                  : "text-text-muted hover:text-text-secondary border-transparent"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "Overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company details */}
              <GlassCard padding="md">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Company Details</h3>
                <div className="space-y-3">
                  {[
                    { icon: Building2, label: "Type",     value: client.client_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) },
                    { icon: MapPin,    label: "Location", value: [client.city, client.country].filter(Boolean).join(", ") || "-" },
                    { icon: Globe,     label: "Currency", value: client.currency },
                    ...(client.gstin ? [{ icon: FileText, label: "GSTIN", value: client.gstin }] : []),
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="text-xs text-text-muted w-20 shrink-0">{label}</span>
                      <span className="text-sm text-text-secondary font-sans">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Billing schedule - only for retainer clients */}
                {isRetainer && (
                  <div className="mt-5 pt-4 border-t border-black/[0.05]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                        <span className="text-xs text-text-muted w-20 shrink-0">Billing Day</span>
                        {client.billing_day !== null && client.billing_day !== undefined ? (
                          <span className="text-sm font-semibold text-blue-500 font-sans">
                            {getOrdinal(client.billing_day)} of every month
                          </span>
                        ) : (
                          <span className="text-sm text-text-muted italic">Not set</span>
                        )}
                      </div>
                      {client.billing_day !== null && !isClosed && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-blue-500 bg-blue-500/10">
                          Active schedule
                        </span>
                      )}
                      {isClosed && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-gray-400 bg-gray-500/10">
                          Paused
                        </span>
                      )}
                    </div>
                    {client.billing_day !== null && !isClosed && (
                      <p className="text-xs text-text-muted mt-2 ml-6">
                        Next invoice reminder: <span className="font-medium text-text-secondary">Apr {client.billing_day}, 2026</span>
                      </p>
                    )}
                  </div>
                )}
              </GlassCard>

              {/* Contacts */}
              <GlassCard padding="md">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Contacts</h3>
                {client.client_contacts.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-4">No contacts added yet</p>
                ) : (
                  <div className="space-y-4">
                    {client.client_contacts.map((contact) => (
                      <div key={contact.id} className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-button flex items-center justify-center text-xs font-bold text-accent shrink-0"
                          style={{ background: "rgba(253,126,20,0.12)" }}
                        >
                          {contact.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-text-primary">{contact.name}</p>
                            {contact.is_primary && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-accent-muted text-accent">Primary</span>
                            )}
                          </div>
                          {contact.designation && (
                            <p className="text-xs text-text-muted">{contact.designation}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent transition-colors">
                              <Mail className="w-3 h-3" /> {contact.email}
                            </a>
                          </div>
                          {contact.phone && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent transition-colors">
                                <Phone className="w-3 h-3" /> {contact.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>
          )}

          {activeTab === "Projects" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Link
                  href="/projects/new"
                  className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </Link>
              </div>
              {projects.length === 0 ? (
                <div className="text-center py-12 text-text-muted text-sm">No projects yet</div>
              ) : (
                projects.map((project) => (
                  <GlassCard key={project.id} padding="md" className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FolderKanban className="w-4 h-4 text-text-muted" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{project.name}</p>
                        <p className="text-xs text-text-muted">
                          {TYPE_LABELS[project.project_type] ?? project.project_type}
                          {project.retainer_amount !== null && (
                            <span className="ml-2 text-blue-500">Retainer</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={project.status} />
                  </GlassCard>
                ))
              )}
            </div>
          )}

          {activeTab === "Invoices" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Link
                  href="/invoices/new"
                  className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Invoice
                </Link>
              </div>
              <GlassCard padding="md">
                <div className="flex flex-col items-center py-10 text-center">
                  <FileText className="w-8 h-8 text-text-muted mb-3" />
                  <p className="text-sm text-text-muted">Invoice list coming soon.</p>
                  <Link href="/invoices" className="text-accent hover:text-accent-hover text-sm mt-2">
                    View all invoices
                  </Link>
                </div>
              </GlassCard>
            </div>
          )}

          {activeTab === "Payments" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <GlassCard padding="md">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Invoiced</p>
                  <CurrencyDisplay amount={totalInvoiced} currency={client.currency} size="md" />
                </GlassCard>
                <GlassCard padding="md">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Received</p>
                  <CurrencyDisplay amount={totalReceived} currency={client.currency} size="md" className="text-green-400" />
                </GlassCard>
                <GlassCard padding="md">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Balance Due</p>
                  <CurrencyDisplay amount={outstanding} currency={client.currency} size="md" className="text-yellow-400" />
                </GlassCard>
              </div>

              <GlassCard padding="md">
                <div className="flex flex-col items-center py-10 text-center">
                  <CreditCard className="w-8 h-8 text-text-muted mb-3" />
                  <p className="text-sm text-text-muted">Payment history coming soon.</p>
                  <Link href="/payments" className="text-accent hover:text-accent-hover text-sm mt-2">
                    View all payments
                  </Link>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
