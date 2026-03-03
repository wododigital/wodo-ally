"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText, Search, Filter, Download } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

const INVOICES = [
  {
    id: "bbbbbbbb-0000-0000-0000-000000000002",
    invoice_number: "G00111",
    invoice_type: "gst",
    client: "Nandhini Deluxe Hotel",
    currency: "INR" as const,
    total_amount: 76700,
    balance_due: 76700,
    invoice_date: "2026-03-01",
    due_date: "2026-03-08",
    status: "sent" as const,
  },
  {
    id: "bbbbbbbb-0000-0000-0000-000000000004",
    invoice_number: "G00113",
    invoice_type: "gst",
    client: "Maximus OIGA",
    currency: "INR" as const,
    total_amount: 59000,
    balance_due: 59000,
    invoice_date: "2026-03-01",
    due_date: "2026-03-08",
    status: "draft" as const,
  },
  {
    id: "bbbbbbbb-0000-0000-0000-000000000001",
    invoice_number: "G00110",
    invoice_type: "gst",
    client: "Nandhini Deluxe Hotel",
    currency: "INR" as const,
    total_amount: 76700,
    balance_due: 0,
    invoice_date: "2026-02-01",
    due_date: "2026-02-08",
    status: "paid" as const,
  },
  {
    id: "bbbbbbbb-0000-0000-0000-000000000003",
    invoice_number: "G00112",
    invoice_type: "gst",
    client: "Maximus OIGA",
    currency: "INR" as const,
    total_amount: 59000,
    balance_due: 0,
    invoice_date: "2026-02-01",
    due_date: "2026-02-08",
    status: "paid" as const,
  },
  {
    id: "bbbbbbbb-0000-0000-0000-000000000007",
    invoice_number: "NG00201",
    invoice_type: "non_gst",
    client: "Raj Enterprises",
    currency: "INR" as const,
    total_amount: 17500,
    balance_due: 17500,
    invoice_date: "2026-02-15",
    due_date: "2026-02-22",
    status: "overdue" as const,
  },
  {
    id: "bbbbbbbb-0000-0000-0000-000000000006",
    invoice_number: "G00109",
    invoice_type: "international",
    client: "Sea Wonders Tourism",
    currency: "INR" as const,
    total_amount: 89600,
    balance_due: 0,
    invoice_date: "2026-02-01",
    due_date: "2026-02-15",
    status: "paid" as const,
  },
  {
    id: "bbbbbbbb-0000-0000-0000-000000000005",
    invoice_number: "G00108",
    invoice_type: "international",
    client: "Dentique Dental Care",
    currency: "INR" as const,
    total_amount: 115830,
    balance_due: 0,
    invoice_date: "2025-12-01",
    due_date: "2025-12-15",
    status: "paid" as const,
  },
  {
    id: "bbbbbbbb-0000-0000-0000-000000000008",
    invoice_number: null,
    invoice_type: "proforma",
    client: "Godavari Heritage Hotels",
    currency: "INR" as const,
    total_amount: 100300,
    balance_due: 100300,
    invoice_date: "2026-01-15",
    due_date: "2026-01-22",
    status: "sent" as const,
  },
];

const STATUS_TABS = ["all", "draft", "sent", "paid", "overdue", "proforma"] as const;
type StatusTab = typeof STATUS_TABS[number];

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

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");

  const filtered = INVOICES.filter((inv) => {
    const matchTab =
      activeTab === "all" ||
      (activeTab === "proforma" ? inv.invoice_type === "proforma" : inv.status === activeTab);
    const matchSearch =
      (inv.invoice_number ?? "").toLowerCase().includes(search.toLowerCase()) ||
      inv.client.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totals = {
    outstanding: INVOICES.filter((i) => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + i.balance_due, 0),
    paid_this_month: INVOICES.filter((i) => i.status === "paid" && i.invoice_date >= "2026-02-01").reduce((s, i) => s + i.total_amount, 0),
    overdue_count: INVOICES.filter((i) => i.status === "overdue").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Invoices"
        description={`${INVOICES.length} total invoices`}
        action={
          <Link
            href="/invoices/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Link>
        }
      />

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard padding="md">
          <p className="text-xs text-text-muted uppercase tracking-wider">Outstanding</p>
          <p className="text-xl font-bold font-sans mt-1 text-yellow-400">
            Rs.{(totals.outstanding / 1000).toFixed(0)}K
          </p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-xs text-text-muted uppercase tracking-wider">Paid This Month</p>
          <p className="text-xl font-bold font-sans mt-1 text-green-400">
            Rs.{(totals.paid_this_month / 1000).toFixed(0)}K
          </p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-xs text-text-muted uppercase tracking-wider">Overdue</p>
          <p className="text-xl font-bold font-sans mt-1 text-red-400">{totals.overdue_count} invoice{totals.overdue_count !== 1 ? "s" : ""}</p>
        </GlassCard>
      </div>

      {/* Status tabs */}
      <div className="flex border-b border-black/[0.05] gap-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const count = tab === "all"
            ? INVOICES.length
            : tab === "proforma"
            ? INVOICES.filter((i) => i.invoice_type === "proforma").length
            : INVOICES.filter((i) => i.status === tab).length;
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

      {/* Invoice list */}
      {filtered.length === 0 ? (
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
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice, idx) => (
                  <tr
                    key={invoice.id}
                    className={cn(
                      "hover:bg-surface-DEFAULT transition-colors group",
                      idx < filtered.length - 1 && "border-b border-black/[0.05]"
                    )}
                  >
                    <td className="px-5 py-4">
                      <Link href={`/invoices/${invoice.id}`} className="group-hover:text-accent transition-colors">
                        <p className="text-sm font-sans font-semibold text-text-primary">
                          {invoice.invoice_number ?? "PF-2026"}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-text-secondary">{invoice.client}</p>
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
                      <CurrencyDisplay amount={invoice.total_amount} currency={invoice.currency} size="sm" />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="p-1.5 rounded-button text-text-muted hover:text-accent hover:bg-accent-muted transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Download className="w-3.5 h-3.5" />
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
