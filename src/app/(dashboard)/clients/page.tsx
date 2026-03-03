"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Plus, Search, Users, FileText, TrendingUp, Star, CheckCircle2,
  BarChart2, X, Loader2, ChevronDown, Check,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkCard } from "@/components/shared/dark-section";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { cn } from "@/lib/utils/cn";
import { useClients, useCreateClient } from "@/lib/hooks/use-clients";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Database } from "@/types/database";

type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

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
type StatusFilter = "all" | "active" | "inactive" | "closed" | "churned";

const INVOICE_FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "indian_gst", label: "GST Invoice" },
  { value: "indian_non_gst", label: "Non-GST" },
  { value: "international", label: "International" },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "closed", label: "Closed" },
  { value: "churned", label: "Churned" },
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

// ─── CircularHealth ──────────────────────────────────────────────────────────

function CircularHealth({ score }: { score: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
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

// ─── Add Client Modal ─────────────────────────────────────────────────────────

const clientSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  display_name: z.string().optional(),
  region: z.enum(["india", "usa", "uae", "uk", "other"]),
  currency: z.enum(["INR", "USD", "AED", "GBP"]),
  gstin: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  billing_email: z.string().optional().refine(
    (val) => !val?.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    { message: "Enter a valid email" }
  ),
  client_type: z.enum(["indian_gst", "indian_non_gst", "international"]),
});

type ClientFormValues = z.infer<typeof clientSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-0.5">{message}</p>;
}

// ─── Status Dropdown ─────────────────────────────────────────────────────────

function StatusDropdown({
  value,
  onChange,
  options,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
  options: { value: StatusFilter; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => o.value === value) ?? options[0];
  const isFiltered = value !== "all";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-button text-xs font-medium transition-all duration-150 whitespace-nowrap",
          isFiltered
            ? "bg-accent-muted text-accent border border-accent-light"
            : "bg-surface-DEFAULT text-text-secondary hover:text-text-primary border border-black/[0.05] hover:border-black/[0.08]"
        )}
      >
        {selected.label}
        <ChevronDown className={cn("w-3 h-3 transition-transform duration-150", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-30 rounded-xl overflow-hidden min-w-[130px]"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.6) inset",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "w-full flex items-center justify-between gap-3 px-3 py-2 text-xs transition-colors text-left",
                opt.value === value
                  ? "text-accent font-semibold bg-accent/[0.06]"
                  : "text-text-secondary hover:text-text-primary hover:bg-black/[0.03] font-medium"
              )}
            >
              {opt.label}
              {opt.value === value && <Check className="w-3 h-3 shrink-0 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddClientModal({ onClose }: { onClose: () => void }) {
  const createClient = useCreateClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { client_type: "indian_gst", region: "india", currency: "INR" },
  });

  const clientType = watch("client_type");

  function onSubmit(values: ClientFormValues) {
    const clientData: ClientInsert = {
      company_name: values.company_name.trim(),
      display_name: values.display_name?.trim() || null,
      client_type: values.client_type,
      region: values.region,
      currency: values.currency,
      gstin: values.client_type === "indian_gst" ? (values.gstin?.trim() || null) : null,
      city: values.city?.trim() || null,
      country: values.country?.trim() || "India",
      billing_emails: (() => {
        const email = values.billing_email?.trim();
        return email ? [email] : null;
      })(),
    };

    createClient.mutate({ client: clientData }, { onSuccess: () => onClose() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06]">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add New Client</h2>
            <p className="text-sm text-gray-500 mt-0.5">Create a new client account</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="p-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Invoice Type */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Invoice Type</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "indian_gst", label: "GST Invoices", desc: "G-series, 18% GST" },
                { value: "indian_non_gst", label: "Non-GST", desc: "NG-series, 0% tax" },
                { value: "international", label: "International", desc: "G-series, 0% tax" },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setValue("client_type", type.value as ClientFormValues["client_type"], { shouldValidate: true })}
                  className={cn(
                    "p-3 rounded-xl text-left border transition-all duration-150",
                    clientType === type.value
                      ? "border-accent bg-accent-muted"
                      : "border-black/[0.06] bg-gray-50 hover:border-black/[0.10]"
                  )}
                >
                  <p className={cn("text-sm font-medium", clientType === type.value ? "text-accent" : "text-gray-800")}>{type.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Company info */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Company Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-gray-500">Company Name *</label>
                <input {...register("company_name")} type="text" className={cn("glass-input", errors.company_name && "border-red-400")} placeholder="Full legal company name" />
                <FieldError message={errors.company_name?.message} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Display Name</label>
                <input {...register("display_name")} type="text" className="glass-input" placeholder="Short name for UI" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Region</label>
                <select {...register("region")} className="glass-input">
                  <option value="india">India</option>
                  <option value="usa">USA</option>
                  <option value="uae">UAE</option>
                  <option value="uk">UK</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Currency</label>
                <select {...register("currency")} className="glass-input">
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>
              {clientType === "indian_gst" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">GSTIN</label>
                  <input {...register("gstin")} type="text" className="glass-input font-sans" placeholder="29AADCW8591N1ZA" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">City</label>
                <input {...register("city")} type="text" className="glass-input" placeholder="City" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Country</label>
                <input {...register("country")} type="text" className="glass-input" placeholder="India" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Billing Email</label>
                <input {...register("billing_email")} type="text" className={cn("glass-input", errors.billing_email && "border-red-400")} placeholder="accounts@company.com" />
                <FieldError message={errors.billing_email?.message} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-black/[0.05]">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-button text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createClient.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
            >
              {createClient.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {createClient.isPending ? "Creating..." : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Loading skeleton for client grid ────────────────────────────────────────

function ClientCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-button shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-8 rounded" />
          <Skeleton className="h-5 w-14 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-3 border-t border-black/[0.05]">
        <Skeleton className="w-11 h-11 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-8 w-full rounded-card" />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: clients = [], isLoading, isError, error } = useClients();

  const filtered = clients.filter((c) => {
    const matchSearch =
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.display_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.client_type === filter;
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchFilter && matchStatus;
  });

  const counts = INVOICE_FILTERS.reduce<Record<FilterType, number>>((acc, f) => {
    acc[f.value] = f.value === "all"
      ? clients.filter((c) => statusFilter === "all" || c.status === statusFilter).length
      : clients.filter((c) => c.client_type === f.value && (statusFilter === "all" || c.status === statusFilter)).length;
    return acc;
  }, {} as Record<FilterType, number>);

  const activeCount = clients.filter((c) => c.status === "active").length;
  const avgHealth = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.health_score, 0) / clients.length)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} />}

      {/* Client KPIs */}
      <DarkSection>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>Client Overview</p>
          <div className="flex items-center gap-2">
            <Link
              href="/analytics/clients"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium transition-all border bg-white/[0.04] text-white/50 border-white/[0.08] hover:border-white/[0.14] hover:text-white/70"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Analytics
            </Link>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-button text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "rgba(253,126,20,0.85)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Client
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Users,        label: "Total clients",    value: isLoading ? "-" : `${clients.length}`,   sub: "All time",              color: "#3b82f6" },
            { icon: CheckCircle2, label: "Active clients",   value: isLoading ? "-" : `${activeCount}`,      sub: "Currently engaged",     color: "#22c55e" },
            { icon: Star,         label: "Avg health score", value: isLoading ? "-" : `${avgHealth}`,        sub: "Across all clients",    color: "#fd7e14" },
            { icon: TrendingUp,   label: "Total revenue",    value: isLoading ? "-" : "See invoices",        sub: "Lifetime invoiced",     color: "#8b5cf6" },
          ].map((stat) => (
            <DarkCard key={stat.label} className="p-5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3" style={{ background: `${stat.color}18` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <p className="text-xl font-light font-sans mb-0.5" style={{ color: "rgba(255,255,255,0.92)" }}>{stat.value}</p>
              <p className="text-[11px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{stat.label}</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{stat.sub}</p>
            </DarkCard>
          ))}
        </div>
      </DarkSection>

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
        <div className="flex gap-1.5 flex-wrap">
          {/* Invoice type filters */}
          {INVOICE_FILTERS.map((f) => (
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
              <span className={cn("text-[10px] font-sans px-1.5 py-0.5 rounded-full", filter === f.value ? "bg-accent/20 text-accent" : "bg-black/[0.04] text-text-muted")}>
                {counts[f.value] ?? 0}
              </span>
            </button>
          ))}
          {/* Separator */}
          <div className="w-px bg-black/[0.06] self-stretch mx-0.5" />
          {/* Status dropdown */}
          <StatusDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTERS}
          />
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-500 border border-red-500/20 bg-red-500/[0.06]">
          Failed to load clients: {(error as Error)?.message ?? "Unknown error"}
        </div>
      )}

      {/* Client grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <ClientCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients found"
          description="Try adjusting your search or add a new client."
          action={{ label: "Add Client", onClick: () => setShowAddModal(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((client) => {
            const hl = healthLabel(client.health_score);
            const avgDays = client.avg_days_to_pay ?? 0;
            const onTimePct = client.on_time_payment_pct ?? 0;
            const pb = payBehaviorLabel(avgDays, onTimePct);
            const clientSince = new Date(client.created_at).toLocaleString("en-US", { month: "short", year: "numeric" });

            return (
              <div key={client.id} className="relative group">
                <Link href={`/clients/${client.id}`}>
                  <GlassCard padding="md" className="hover:border-black/[0.10] transition-all duration-200 h-full flex flex-col gap-4">
                    {/* Top row: avatar + name */}
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-button flex items-center justify-center text-sm font-bold text-accent shrink-0"
                        style={{ background: "rgba(253,126,20,0.12)", border: "1px solid rgba(253,126,20,0.18)" }}
                      >
                        {client.company_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                          {client.display_name ?? client.company_name}
                        </p>
                        <p className="text-xs text-text-muted truncate mt-0.5">{client.company_name}</p>
                      </div>
                    </div>

                    {/* Invoice type + region + status */}
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", INVOICE_TYPE_COLORS[client.client_type])}>
                        {INVOICE_TYPE_LABELS[client.client_type]}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-sans font-medium text-text-muted px-1.5 py-0.5 rounded bg-surface-DEFAULT border border-black/[0.05]">
                          {REGION_FLAGS[client.region] ?? "--"}
                        </span>
                        <StatusBadge status={client.status} />
                      </div>
                    </div>

                    {/* Health + meta */}
                    <div className="flex items-center gap-3 pt-3 border-t border-black/[0.05]">
                      <CircularHealth score={client.health_score} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold" style={{ color: hl.color }}>{hl.label}</span>
                          {onTimePct > 0 && (
                            <span className="text-[10px] text-text-muted">{onTimePct}% on-time</span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted">Client since {clientSince}</p>
                        {client.billing_day !== null && client.billing_day !== undefined && (
                          <p className="text-[10px] mt-0.5 font-medium text-blue-500">
                            Bills {getOrdinal(client.billing_day)} of month
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Payment behavior footer */}
                    <div
                      className="flex items-center justify-between text-xs px-3 py-2 rounded-card"
                      style={{ background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.04)" }}
                    >
                      <span className="text-text-muted">
                        {avgDays > 0 ? `Pays in ~${avgDays}d` : "No payment data"}
                      </span>
                      {avgDays > 0 && (
                        <span className="font-medium" style={{ color: pb.color }}>{pb.text}</span>
                      )}
                    </div>
                  </GlassCard>
                </Link>

                {/* Hover invoice button */}
                <Link
                  href={`/invoices/new?client=${client.id}&type=proforma`}
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
