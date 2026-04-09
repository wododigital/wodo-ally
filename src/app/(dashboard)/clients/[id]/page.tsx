"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Mail, Phone, Globe, MapPin, Building2,
  FileText, FolderKanban, Edit, Plus, Receipt,
  CheckCircle2, XCircle, Calendar, Upload, X as XIcon, Loader2,
  Send, ClipboardCheck, Clock, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getFinancialYear } from "@/lib/utils/format";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkCard } from "@/components/shared/dark-section";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { useClient, useClientStats, useCloseClient, useReactivateClient } from "@/lib/hooks/use-clients";
import { useProjects } from "@/lib/hooks/use-projects";
import { useContracts } from "@/lib/hooks/use-contracts";
import { AddProjectModal } from "@/components/shared/add-project-modal";
import { NewInvoiceModal } from "@/components/shared/new-invoice-modal";

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

// ─── TDS Upload Modal ─────────────────────────────────────────────────────────

interface TdsCertificate {
  id: string;
  financial_year: string;
  quarter: number;
  amount: number | null;
  received_date: string | null;
  notes: string | null;
  file_url: string | null;
  created_at: string;
}

function TdsUploadModal({
  clientId,
  onClose,
  onSuccess,
}: {
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [financialYear, setFinancialYear] = useState(getFinancialYear());
  const [quarter, setQuarter] = useState(1);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const currentYear = new Date().getFullYear();
  const fyOptions = [
    `${currentYear - 1}-${String(currentYear).slice(2)}`,
    `${currentYear}-${String(currentYear + 1).slice(2)}`,
    `${currentYear - 2}-${String(currentYear - 1).slice(2)}`,
  ];

  async function handleSave() {
    if (!financialYear || !quarter) { toast.error("Financial year and quarter are required"); return; }
    setUploading(true);
    try {
      let fileUrl: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `tds/${clientId}/${financialYear}-Q${quarter}-${Date.now()}.${ext}`;
        const { error: storageErr } = await supabase.storage
          .from("documents")
          .upload(path, file, { upsert: true });
        if (storageErr) throw new Error(storageErr.message);
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("tds_certificates").insert({
        client_id: clientId,
        financial_year: financialYear,
        quarter,
        certificate_received: true,
        received_date: new Date().toISOString().split("T")[0],
        amount: amount ? parseFloat(amount) : null,
        file_url: fileUrl,
        notes: [title, notes].filter(Boolean).join(" - ") || null,
      });

      if (error) throw new Error(error.message);
      toast.success("TDS certificate saved");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save TDS certificate");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl flex flex-col"
        style={{ maxHeight: "90vh", background: "rgba(255,255,255,0.98)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 24px 64px rgba(0,0,0,0.16)" }}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Upload TDS Certificate</h3>
            <p className="text-xs text-gray-400 mt-0.5">Attach certificate and save details</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Title / Description</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q1 FY25-26 TDS Certificate"
              className="glass-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Financial Year *</label>
              <select value={financialYear} onChange={(e) => setFinancialYear(e.target.value)} className="glass-input">
                {fyOptions.map((fy) => <option key={fy} value={fy}>{fy}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Quarter *</label>
              <select value={quarter} onChange={(e) => setQuarter(Number(e.target.value))} className="glass-input">
                <option value={1}>Q1 (Apr-Jun)</option>
                <option value={2}>Q2 (Jul-Sep)</option>
                <option value={3}>Q3 (Oct-Dec)</option>
                <option value={4}>Q4 (Jan-Mar)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">TDS Amount (Rs.)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              className="glass-input font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate File (PDF)</label>
            <div
              className="relative flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
              style={{ borderColor: file ? "rgba(253,126,20,0.4)" : "rgba(0,0,0,0.1)" }}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <Upload className="w-5 h-5 text-gray-400" />
              {file ? (
                <p className="text-sm text-accent font-medium truncate max-w-full">{file.name}</p>
              ) : (
                <p className="text-sm text-gray-400">Click to upload PDF or image</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              className="glass-input"
            />
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-black/[0.06] shrink-0" style={{ background: "rgba(255,255,255,0.96)" }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-button text-sm font-medium text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-button text-sm font-semibold text-white disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {uploading ? "Saving..." : "Save Certificate"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
        style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
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
          <button onClick={onCancel} disabled={isPending} className="px-4 py-2 rounded-button text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isPending} className="px-4 py-2 rounded-button text-sm font-semibold text-white transition-colors disabled:opacity-70" style={{ background: "#ef4444" }}>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-5 space-y-2" style={{ background: "rgba(255,255,255,0.06)" }}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const TABS = ["Overview", "Projects", "Invoices & Payments"];

export default function ClientDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("Overview");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showTdsModal, setShowTdsModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceModalProjectId, setInvoiceModalProjectId] = useState("");
  const [tdsRefreshKey, setTdsRefreshKey] = useState(0);
  const [tdsCerts, setTdsCerts] = useState<TdsCertificate[]>([]);
  const [tdsLoading, setTdsLoading] = useState(false);

  const { data: client, isLoading, isError, error } = useClient(id);
  const { data: stats } = useClientStats(id);
  const { data: projects = [] } = useProjects(id);
  const { data: contracts = [] } = useContracts({ clientId: id });
  const closeClient = useCloseClient(id);
  const reactivateClient = useReactivateClient(id);

  // Fetch TDS certificates for this client
  useEffect(() => {
    let mounted = true;
    async function fetchTds() {
      setTdsLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("tds_certificates")
        .select("*")
        .eq("client_id", id)
        .order("financial_year", { ascending: false })
        .order("quarter", { ascending: false });
      if (mounted) {
        setTdsCerts((data as TdsCertificate[]) ?? []);
        setTdsLoading(false);
      }
    }
    fetchTds();
    return () => { mounted = false; };
  }, [id, tdsRefreshKey]);

  if (isLoading) return <ClientDetailSkeleton />;

  if (isError || !client) {
    return (
      <div className="rounded-xl px-4 py-3 text-sm text-red-500 border border-red-500/20 bg-red-500/[0.06]">
        Failed to load client: {(error as Error)?.message ?? "Client not found"}
      </div>
    );
  }

  const isClosed = client.status === "closed";
  const isRetainer = projects.some((p) => p.engagement_type === "retainer");

  const totalInvoiced = stats?.total_invoiced ?? 0;
  const totalReceived = stats?.total_received ?? 0;
  const outstanding = stats?.outstanding ?? 0;

  function handleCloseConfirm() {
    closeClient.mutate(undefined, { onSuccess: () => setShowCloseModal(false) });
  }

  function handleReactivate() {
    reactivateClient.mutate();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[
        { label: "Clients", href: "/clients" },
        { label: client.display_name ?? client.company_name },
      ]} />

      {showAddProjectModal && (
        <AddProjectModal onClose={() => setShowAddProjectModal(false)} preselectedClientId={id} />
      )}

      {showInvoiceModal && (
        <NewInvoiceModal
          onClose={() => { setShowInvoiceModal(false); setInvoiceModalProjectId(""); }}
          preselectedClientId={id}
          preselectedType="proforma"
          preselectedProjectId={invoiceModalProjectId}
        />
      )}

      {showTdsModal && (
        <TdsUploadModal
          clientId={id}
          onClose={() => setShowTdsModal(false)}
          onSuccess={() => setTdsRefreshKey((k) => k + 1)}
        />
      )}

      {showCloseModal && (
        <CloseClientModal
          clientName={client.display_name ?? client.company_name}
          onConfirm={handleCloseConfirm}
          onCancel={() => setShowCloseModal(false)}
          isPending={closeClient.isPending}
        />
      )}

      {/* Header */}
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
          {!isClosed ? (
            <button
              onClick={() => setShowCloseModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium transition-all duration-150"
              style={{ color: "#ef4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <XCircle className="w-4 h-4" />
              Close Client
            </button>
          ) : (
            <button
              onClick={handleReactivate}
              disabled={reactivateClient.isPending}
              className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium transition-all duration-150 disabled:opacity-70"
              style={{ color: "#16a34a", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.15)" }}
            >
              <CheckCircle2 className="w-4 h-4" />
              {reactivateClient.isPending ? "Reactivating..." : "Re-activate"}
            </button>
          )}
        </div>
      </div>

      {/* Closed banner */}
      {isClosed && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-red-400 font-medium">This client account is closed.</span>
          <span className="text-red-400/70">Billing reminders paused. All history preserved.</span>
        </div>
      )}

      {/* KPI Stats - dark styling */}
      <DarkSection>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Invoiced", value: <CurrencyDisplay amount={totalInvoiced} currency={client.currency} size="md" />, color: "#3b82f6" },
            { label: "Total Received", value: <CurrencyDisplay amount={totalReceived} currency={client.currency} size="md" className="text-green-400" />, color: "#22c55e" },
            { label: "Balance Due", value: <CurrencyDisplay amount={outstanding} currency={client.currency} size="md" className="text-yellow-400" />, color: "#f59e0b" },
            {
              label: "Health Score",
              value: (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${client.health_score}%`,
                        backgroundColor: client.health_score >= 80 ? "#16a34a" : client.health_score >= 60 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold font-sans" style={{ color: "rgba(255,255,255,0.9)" }}>{client.health_score}</span>
                </div>
              ),
              color: "#fd7e14",
            },
          ].map((stat) => (
            <DarkCard key={stat.label} className="p-4">
              <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</p>
              <div>{stat.value}</div>
            </DarkCard>
          ))}
        </div>
      </DarkSection>

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
          {/* Overview Tab */}
          {activeTab === "Overview" && (
            <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-gray-400 bg-gray-500/10">Paused</span>
                      )}
                    </div>
                  </div>
                )}
              </GlassCard>

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

            {/* TDS Certificates */}
            <GlassCard padding="md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary">TDS Certificates</h3>
                <button
                  onClick={() => setShowTdsModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-semibold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload TDS
                </button>
              </div>

              {tdsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <div key={i} className="h-10 bg-black/[0.04] rounded animate-pulse" />)}
                </div>
              ) : tdsCerts.length === 0 ? (
                <div className="py-6 text-center">
                  <FileText className="w-7 h-7 text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-muted">No TDS certificates uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tdsCerts.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.04)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "rgba(253,126,20,0.1)" }}
                        >
                          <FileText className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            FY {cert.financial_year} - Q{cert.quarter}
                          </p>
                          {cert.notes && <p className="text-xs text-text-muted truncate max-w-xs">{cert.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {cert.amount !== null && (
                          <span className="text-sm font-sans font-semibold text-text-primary">
                            Rs.{cert.amount.toLocaleString("en-IN")}
                          </span>
                        )}
                        {cert.file_url ? (
                          <a
                            href={cert.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:text-accent-hover font-medium"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-text-muted">No file</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Contract Status */}
            <GlassCard padding="md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary">Contracts</h3>
                <Link
                  href={`/contracts?client=${id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] hover:text-text-primary transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View All
                </Link>
              </div>

              {contracts.length === 0 ? (
                <div className="py-6 text-center">
                  <FileText className="w-7 h-7 text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-muted">No contracts yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contracts.map((contract) => {
                    const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
                      draft:      { icon: Clock,           label: "Draft",           color: "#9ca3af", bg: "rgba(0,0,0,0.03)" },
                      sent:       { icon: Send,            label: "Shared",          color: "#3b82f6", bg: "rgba(59,130,246,0.06)" },
                      signed:     { icon: ClipboardCheck,  label: "Signed",          color: "#22c55e", bg: "rgba(34,197,94,0.06)" },
                      active:     { icon: CheckCircle2,    label: "Active",          color: "#22c55e", bg: "rgba(34,197,94,0.06)" },
                      completed:  { icon: CheckCircle2,    label: "Completed",       color: "#16a34a", bg: "rgba(22,163,74,0.06)" },
                      terminated: { icon: AlertCircle,     label: "Terminated",      color: "#ef4444", bg: "rgba(239,68,68,0.06)" },
                    };
                    const cfg = statusConfig[contract.status] ?? statusConfig.draft;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={contract.id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.color}20` }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `${cfg.color}15` }}
                          >
                            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{contract.title}</p>
                            {contract.contract_date && (
                              <p className="text-xs text-text-muted">{new Date(contract.contract_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                            style={{ color: cfg.color, background: `${cfg.color}12`, borderColor: `${cfg.color}30` }}
                          >
                            {cfg.label}
                          </span>
                          {contract.signed_date && (
                            <span className="text-xs text-text-muted">Signed {new Date(contract.signed_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === "Projects" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddProjectModal(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </div>
              {projects.length === 0 ? (
                <div className="text-center py-12 text-text-muted text-sm">No projects yet</div>
              ) : (
                projects.map((project) => (
                  <GlassCard key={project.id} padding="md" className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FolderKanban className="w-4 h-4 text-text-muted shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{project.name}</p>
                        <p className="text-xs text-text-muted">
                          {TYPE_LABELS[project.project_type] ?? project.project_type}
                          {project.retainer_amount !== null && (
                            <span className="ml-2 text-blue-500">Retainer</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { setInvoiceModalProjectId(project.id); setShowInvoiceModal(true); }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-button text-xs font-medium transition-all"
                        style={{ color: "#fd7e14", background: "rgba(253,126,20,0.08)", border: "1px solid rgba(253,126,20,0.18)" }}
                      >
                        <Receipt className="w-3 h-3" />
                        Invoice
                      </button>
                      <StatusBadge status={project.status} />
                    </div>
                  </GlassCard>
                ))
              )}
            </div>
          )}

          {/* Invoices & Payments Tab */}
          {activeTab === "Invoices & Payments" && (
            <div className="space-y-4">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4">
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

              {/* Invoice list */}
              <GlassCard padding="md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-text-primary">Invoices</h3>
                  <button
                    onClick={() => { setInvoiceModalProjectId(""); setShowInvoiceModal(true); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-button text-xs font-medium text-white bg-accent hover:bg-accent-hover transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Invoice
                  </button>
                </div>
                <div className="flex flex-col items-center py-8 text-center">
                  <FileText className="w-7 h-7 text-text-muted mb-2" />
                  <p className="text-sm text-text-muted">Invoice list coming soon.</p>
                  <p className="text-xs text-text-muted mt-0.5">Payment date and status will be shown inline.</p>
                  <Link href="/invoices" className="text-accent hover:text-accent-hover text-sm mt-3">
                    View all invoices
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
