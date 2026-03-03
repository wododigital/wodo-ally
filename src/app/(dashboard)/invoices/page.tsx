"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, FileText, Search, ChevronDown, Pencil, CheckCircle2, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkLabel, DarkCard } from "@/components/shared/dark-section";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { useInvoices, useUpdateInvoice, useGenerateRetainerInvoices } from "@/lib/hooks/use-invoices";
import type { InvoiceListItem } from "@/lib/hooks/use-invoices";

// Suppress unused import warning - DarkLabel is imported from dark-section
void DarkLabel;

const STATUS_TABS = ["all", "draft", "sent", "paid", "overdue", "proforma"] as const;
type StatusTab = typeof STATUS_TABS[number];

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent", "cancelled"],
  sent: ["paid", "overdue", "cancelled"],
  overdue: ["paid", "sent", "cancelled"],
  paid: [],
  proforma: ["sent", "cancelled"],
  cancelled: ["draft"],
};

const TYPE_LABELS: Record<string, string> = {
  gst: "GST",
  international: "Intl.",
  non_gst: "Non-GST",
  proforma: "Proforma",
};

const TYPE_COLORS: Record<string, string> = {
  gst: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  international: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  non_gst: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  proforma: "text-text-muted bg-surface-DEFAULT border-black/[0.05]",
};

type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "partially_paid" | "overdue" | "cancelled";

function StatusDropdown({
  status,
  onChange,
}: {
  status: string;
  onChange: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = STATUS_TRANSITIONS[status] ?? [];

  if (options.length === 0) {
    return <StatusBadge status={status as Parameters<typeof StatusBadge>[0]["status"]} />;
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="flex items-center gap-1 group/sd"
        title="Change status"
      >
        <StatusBadge status={status as Parameters<typeof StatusBadge>[0]["status"]} />
        <ChevronDown className="w-3 h-3 text-text-muted opacity-0 group-hover/sd:opacity-100 transition-opacity" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div
            className="absolute left-0 top-full mt-1 z-20 py-1.5 rounded-xl min-w-[110px]"
            style={{
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            }}
          >
            {options.map((s) => (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); onChange(s); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs capitalize hover:bg-black/[0.04] transition-colors text-text-secondary hover:text-text-primary"
              >
                {s === "paid" ? "Mark Paid" : s === "sent" ? "Mark Sent" : s === "overdue" ? "Mark Overdue" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");

  const { data: invoices = [], isLoading } = useInvoices();
  const updateInvoice = useUpdateInvoice();
  const generateRetainer = useGenerateRetainerInvoices();

  function getDisplayNumber(inv: InvoiceListItem): string {
    if (inv.invoice_type === "proforma") return inv.proforma_ref ?? "PF-DRAFT";
    return inv.invoice_number ?? "DRAFT";
  }

  const filtered = invoices.filter((inv) => {
    const matchTab =
      activeTab === "all" ||
      (activeTab === "proforma" ? inv.invoice_type === "proforma" : inv.status === activeTab);
    const displayNum = getDisplayNumber(inv);
    const matchSearch =
      displayNum.toLowerCase().includes(search.toLowerCase()) ||
      inv.client_name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totals = {
    outstanding: invoices
      .filter((i) => ["sent", "overdue"].includes(i.status))
      .reduce((s, i) => s + (i.balance_due ?? 0), 0),
    paid_this_month: invoices
      .filter((i) => i.status === "paid" && i.invoice_date >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
      .reduce((s, i) => s + (i.total_amount ?? 0), 0),
    overdue_count: invoices.filter((i) => i.status === "overdue").length,
  };

  function handleStatusChange(invoiceId: string, newStatus: string) {
    updateInvoice.mutate({
      id: invoiceId,
      data: {
        status: newStatus as InvoiceStatus,
        ...(newStatus === "paid" ? { paid_at: new Date().toISOString() } : {}),
        ...(newStatus === "sent" ? { sent_at: new Date().toISOString() } : {}),
      },
    });
  }

  function getTabCount(tab: StatusTab): number {
    if (tab === "all") return invoices.length;
    if (tab === "proforma") return invoices.filter((i) => i.invoice_type === "proforma").length;
    return invoices.filter((i) => i.status === tab).length;
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Invoice KPIs */}
      <DarkSection>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>Invoice Overview</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => generateRetainer.mutate()}
              disabled={generateRetainer.isPending}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-button text-xs font-medium transition-all border bg-white/[0.04] text-white/50 border-white/[0.08] hover:border-white/[0.14] hover:text-white/70 disabled:opacity-50"
              title="Generate retainer invoices for this month"
            >
              <RefreshCw className={cn("w-3 h-3", generateRetainer.isPending && "animate-spin")} />
              Retainer Invoices
            </button>
            <Link href="/analytics/invoices"
              className="px-2.5 py-1 rounded-button text-xs font-medium transition-all border bg-white/[0.04] text-white/50 border-white/[0.08] hover:border-white/[0.14] hover:text-white/70">
              Analytics
            </Link>
            <Link href="/invoices/new"
              className="flex items-center gap-1.5 px-3 py-1 rounded-button text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "rgba(253,126,20,0.85)" }}>
              <Plus className="w-3 h-3" />
              New Invoice
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: FileText,     label: "Total invoices",   value: `${invoices.length}`,                                  sub: "All time",                      color: "#3b82f6" },
            { icon: CheckCircle2, label: "Paid this month",  value: `Rs.${(totals.paid_this_month / 1000).toFixed(0)}K`,   sub: "Current month collections",     color: "#22c55e" },
            { icon: Clock,        label: "Outstanding",      value: `Rs.${(totals.outstanding / 1000).toFixed(0)}K`,       sub: "Sent + awaiting payment",       color: "#f59e0b" },
            { icon: AlertCircle,  label: "Overdue",          value: `${totals.overdue_count} invoice${totals.overdue_count !== 1 ? "s" : ""}`, sub: "Follow-up needed", color: "#ef4444" },
          ].map((stat) => (
            <DarkCard key={stat.label} className="p-5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
                style={{ background: `${stat.color}18` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <p className="text-xl font-light font-sans mb-0.5" style={{ color: "rgba(255,255,255,0.92)" }}>
                {isLoading ? "-" : stat.value}
              </p>
              <p className="text-[11px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{stat.label}</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{stat.sub}</p>
            </DarkCard>
          ))}
        </div>
      </DarkSection>

      {/* Status tabs */}
      <div className="flex border-b border-black/[0.05] gap-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const count = getTabCount(tab);
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px capitalize whitespace-nowrap flex items-center gap-1.5",
                activeTab === tab
                  ? "text-accent border-accent"
                  : "text-text-muted hover:text-text-secondary border-transparent"
              )}
            >
              {tab}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full font-sans",
                activeTab === tab ? "bg-accent-muted text-accent" : "bg-surface-DEFAULT text-text-muted"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by invoice number or client..."
          className="glass-input pl-9"
        />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <GlassCard padding="md">
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-text-muted">Loading invoices...</p>
          </div>
        </GlassCard>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices found" description="Create your first invoice." />
      ) : (
        <GlassCard padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.05]">
                  <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider text-text-muted">Invoice</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-muted">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-muted hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-muted hidden md:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-muted">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice, idx) => (
                  <tr
                    key={invoice.id}
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                    className={cn(
                      "hover:bg-surface-DEFAULT transition-colors cursor-pointer group",
                      idx < filtered.length - 1 && "border-b border-black/[0.05]"
                    )}
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-sans font-semibold text-text-primary group-hover:text-accent transition-colors">
                        {getDisplayNumber(invoice)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-text-secondary">{invoice.client_name}</p>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded border font-medium",
                        TYPE_COLORS[invoice.invoice_type]
                      )}>
                        {TYPE_LABELS[invoice.invoice_type]}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-sm text-text-muted font-sans">{formatDate(invoice.invoice_date)}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <CurrencyDisplay
                        amount={invoice.total_amount}
                        currency={invoice.currency as "INR" | "USD" | "AED"}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <StatusDropdown
                        status={invoice.status}
                        onChange={(s) => handleStatusChange(invoice.id, s)}
                      />
                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/invoices/${invoice.id}/edit`}
                        className="p-1.5 rounded-button text-text-muted hover:text-accent hover:bg-accent-muted transition-all opacity-0 group-hover:opacity-100 inline-flex"
                        title="Edit invoice"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
