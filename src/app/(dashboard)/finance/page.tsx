"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Search,
  Upload,
  TrendingDown,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkLabel, DarkCard } from "@/components/shared/dark-section";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { useTransactions } from "@/lib/hooks/use-transactions";
import type { Database } from "@/types/database";

// ─── Types ─────────────────────────────────────────────────────────────────────

type InvoicePayment = Database["public"]["Tables"]["invoice_payments"]["Row"];
type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];

interface PaymentWithDetails extends InvoicePayment {
  invoices: Pick<Invoice, "id" | "invoice_number" | "total_amount"> & {
    clients: Pick<Client, "id" | "company_name" | "display_name"> | null;
  } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  "Software & Tools": "#3b82f6",
  "Hosting & Infrastructure": "#8b5cf6",
  "Freelancer Payments": "#ec4899",
  "Office & Admin": "#16a34a",
  "Banking & Finance": "#9ca3af",
  "Travel & Conveyance": "#f59e0b",
};

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  skydo_usd: "Skydo (USD)",
  skydo_aed: "Skydo (AED)",
  skydo_gbp: "Skydo (GBP)",
  upi: "UPI",
  other: "Other",
};

const OVERDUE_INVOICES = [
  { client: "Raj Enterprises", invoice: "NG00201", amount: 17500, days_overdue: 8 },
  { client: "Nandhini Hotel", invoice: "G00111", amount: 76700, days_due: 5 },
];

// ─── Hooks ─────────────────────────────────────────────────────────────────────

function usePaymentsWithDetails() {
  return useQuery({
    queryKey: ["invoice-payments-with-details"],
    queryFn: async (): Promise<PaymentWithDetails[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("invoice_payments")
        .select(
          "*, invoices(id, invoice_number, total_amount, clients(id, company_name, display_name))"
        )
        .order("payment_date", { ascending: false });

      if (error) throw new Error(error.message);
      return (data as unknown as PaymentWithDetails[]) ?? [];
    },
  });
}

// ─── Cash flow derived from real data ─────────────────────────────────────────

function useCashFlowSummary(
  payments: PaymentWithDetails[],
  paymentsLoading: boolean,
  expenses: ReturnType<typeof useTransactions>["data"],
  expensesLoading: boolean
) {
  const totalReceived = payments.reduce((s, p) => s + (p.amount_received ?? 0), 0);
  const totalTds = payments.reduce((s, p) => s + (p.tds_amount ?? 0), 0);
  const totalExpenses =
    (expenses ?? []).reduce((s, e) => s + (e.debit ?? 0), 0);

  return { totalReceived, totalTds, totalExpenses, paymentsLoading, expensesLoading };
}

type Tab = "payments" | "expenses";

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [tab, setTab] = useState<Tab>("payments");
  const [search, setSearch] = useState("");

  const { data: payments = [], isLoading: paymentsLoading } = usePaymentsWithDetails();
  const { data: expenses = [], isLoading: expensesLoading } = useTransactions({
    type: "expense",
  });

  const { totalReceived, totalTds, totalExpenses } = useCashFlowSummary(
    payments,
    paymentsLoading,
    expenses,
    expensesLoading
  );

  const totalOutstanding = 94200; // Static until overdue invoices query is added

  // Build category aggregation from real expenses
  const categoryTotals = (expenses ?? []).reduce<Record<string, number>>(
    (acc, e) => {
      const name = e.expense_categories?.name ?? "Uncategorized";
      acc[name] = (acc[name] ?? 0) + (e.debit ?? 0);
      return acc;
    },
    {}
  );

  const filteredPayments = payments.filter(
    (p) =>
      (p.invoices?.clients?.company_name ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (p.invoices?.clients?.display_name ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (p.invoices?.invoice_number ?? "")
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const filteredExpenses = (expenses ?? []).filter(
    (e) =>
      e.particulars.toLowerCase().includes(search.toLowerCase()) ||
      (e.expense_categories?.name ?? "")
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tabs */}
      <div className="flex items-center gap-2">
        {[
          { key: "payments" as Tab, label: "Payments" },
          { key: "expenses" as Tab, label: "Expenses" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearch(""); }}
            className={cn(
              "px-3.5 py-1.5 rounded-button text-xs font-semibold transition-all border",
              tab === t.key
                ? "bg-accent-muted text-accent border-accent-light"
                : "bg-surface-DEFAULT text-text-muted border-black/[0.05] hover:border-black/[0.08]"
            )}
          >
            {t.label}
          </button>
        ))}
        {tab === "expenses" && (
          <Link
            href="/expenses/upload"
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium bg-surface-DEFAULT border border-black/[0.05] text-text-muted hover:border-black/[0.08] transition-all"
          >
            <Upload className="w-3 h-3" />
            Upload Statement
          </Link>
        )}
        {tab === "payments" && (
          <Link
            href="/analytics/invoices"
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium bg-surface-DEFAULT border border-black/[0.05] text-text-muted hover:border-black/[0.08] transition-all"
          >
            <LinkIcon className="w-3 h-3" />
            Invoice Analytics
          </Link>
        )}
      </div>

      {/* Cash Flow Overview */}
      <DarkSection>
        <DarkLabel>Cash Flow Overview</DarkLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: CheckCircle2,
              label: "Total received",
              value: paymentsLoading
                ? "..."
                : `Rs.${(totalReceived / 100000).toFixed(1)}L`,
              sub: `${payments.length} payments`,
              color: "#22c55e",
            },
            {
              icon: TrendingDown,
              label: "Total expenses",
              value: expensesLoading
                ? "..."
                : `Rs.${(totalExpenses / 1000).toFixed(1)}K`,
              sub: `${expenses.length} transactions`,
              color: "#ef4444",
            },
            {
              icon: AlertCircle,
              label: "Outstanding",
              value: "Rs.94.2K",
              sub: "2 invoices - follow-up needed",
              color: "#f59e0b",
            },
            {
              icon: TrendingDown,
              label: "Net TDS loss",
              value: paymentsLoading
                ? "..."
                : `Rs.${totalTds.toLocaleString("en-IN")}`,
              sub: "Deducted at source",
              color: "#9ca3af",
            },
          ].map((stat) => (
            <DarkCard key={stat.label} className="p-5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
                style={{ background: `${stat.color}18` }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <p
                className="text-xl font-light font-sans mb-0.5"
                style={{ color: "rgba(255,255,255,0.92)" }}
              >
                {stat.value}
              </p>
              <p
                className="text-[11px] font-semibold mb-1"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {stat.label}
              </p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                {stat.sub}
              </p>
            </DarkCard>
          ))}
        </div>
      </DarkSection>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            tab === "payments" ? "Search payments..." : "Search expenses..."
          }
          className="glass-input pl-9"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main list */}
        <div className="lg:col-span-2">
          {tab === "payments" ? (
            <GlassCard padding="none">
              {paymentsLoading ? (
                <div className="space-y-0">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 px-5 py-4 border-b border-black/[0.05]"
                    >
                      <div className="w-9 h-9 rounded-button bg-black/[0.05] animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-40 bg-black/[0.06] rounded animate-pulse" />
                        <div className="h-3 w-28 bg-black/[0.04] rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="py-12 text-center text-sm text-text-muted">
                  {payments.length === 0
                    ? "No payments recorded yet"
                    : "No payments match your search"}
                </div>
              ) : (
                filteredPayments.map((payment, idx) => {
                  const clientName =
                    payment.invoices?.clients?.display_name ??
                    payment.invoices?.clients?.company_name ??
                    "Unknown Client";
                  const invoiceNumber =
                    payment.invoices?.invoice_number ?? "-";
                  const method = payment.payment_method
                    ? (METHOD_LABELS[payment.payment_method] ?? payment.payment_method)
                    : "Unknown";

                  return (
                    <div
                      key={payment.id}
                      className={cn(
                        "flex items-start gap-4 px-5 py-4",
                        idx < filteredPayments.length - 1 &&
                          "border-b border-black/[0.05]"
                      )}
                    >
                      <div
                        className="w-9 h-9 rounded-button flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          background: "rgba(34,197,94,0.1)",
                          border: "1px solid rgba(34,197,94,0.2)",
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {clientName}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {invoiceNumber} - {method}
                            </p>
                            {payment.reference_number && (
                              <p className="text-xs text-text-muted font-sans mt-0.5">
                                {payment.reference_number}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <CurrencyDisplay
                              amount={payment.amount_received}
                              currency={
                                (payment.currency ?? "INR") as "INR" | "USD" | "AED" | "GBP" | "EUR"
                              }
                              size="sm"
                              className="text-green-400"
                            />
                            <p className="text-xs text-text-muted mt-0.5">
                              {formatDate(payment.payment_date)}
                            </p>
                          </div>
                        </div>
                        {(payment.tds_amount > 0 || payment.skydo_fx_margin > 0) && (
                          <div className="flex items-center gap-3 mt-2">
                            {payment.tds_amount > 0 && (
                              <span className="text-xs text-yellow-400/80 bg-yellow-500/10 px-2 py-0.5 rounded">
                                TDS: -Rs.{payment.tds_amount.toLocaleString("en-IN")}
                              </span>
                            )}
                            {payment.skydo_fx_margin > 0 && (
                              <span className="text-xs text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded">
                                Skydo fee: -Rs.{payment.skydo_fx_margin.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </GlassCard>
          ) : (
            <GlassCard padding="none">
              {expensesLoading ? (
                <div className="space-y-0">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 px-5 py-4 border-b border-black/[0.05]"
                    >
                      <div className="w-9 h-9 rounded-button bg-black/[0.05] animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-40 bg-black/[0.06] rounded animate-pulse" />
                        <div className="h-3 w-28 bg-black/[0.04] rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="py-12 text-center text-sm text-text-muted">
                  {expenses.length === 0
                    ? "No expense transactions yet. Upload a bank statement to get started."
                    : "No expenses match your search"}
                </div>
              ) : (
                filteredExpenses.map((exp, idx) => {
                  const catName = exp.expense_categories?.name ?? "Uncategorized";
                  const catColor =
                    exp.expense_categories?.color ??
                    CATEGORY_COLORS[catName] ??
                    "#9ca3af";

                  return (
                    <div
                      key={exp.id}
                      className={cn(
                        "flex items-start gap-4 px-5 py-4",
                        idx < filteredExpenses.length - 1 &&
                          "border-b border-black/[0.05]"
                      )}
                    >
                      <div
                        className="w-9 h-9 rounded-button flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${catColor}15` }}
                      >
                        <TrendingDown className="w-4 h-4" style={{ color: catColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {exp.particulars}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {catName}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold font-sans text-red-400">
                              -Rs.{(exp.debit ?? 0).toLocaleString("en-IN")}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {formatDate(exp.transaction_date)}
                            </p>
                          </div>
                        </div>
                        {exp.is_auto_categorized && (
                          <span className="text-[10px] text-blue-400/70 bg-blue-500/10 px-2 py-0.5 rounded mt-1.5 inline-block">
                            Auto-categorized
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </GlassCard>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Needs follow-up (payments tab) */}
          {tab === "payments" && (
            <GlassCard padding="md">
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                Needs Follow-Up
              </h3>
              <div className="space-y-3">
                {OVERDUE_INVOICES.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-card"
                    style={{
                      background: "rgba(239,68,68,0.05)",
                      border: "1px solid rgba(239,68,68,0.1)",
                    }}
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {item.client}
                      </p>
                      <p className="text-xs text-text-muted">{item.invoice}</p>
                      <p className="text-xs font-sans font-semibold text-red-400 mt-1">
                        Rs.{item.amount.toLocaleString("en-IN")}
                      </p>
                      {"days_overdue" in item && (
                        <p className="text-xs text-red-400/70">
                          {item.days_overdue} days overdue
                        </p>
                      )}
                      {"days_due" in item && (
                        <p className="text-xs text-yellow-400/70">
                          Due in {(item as { days_due: number }).days_due} days
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Monthly cash flow - static overview */}
          <GlassCard padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Overview
            </h3>
            <div className="space-y-2">
              {[
                {
                  label: "Total received",
                  value: paymentsLoading
                    ? "..."
                    : `Rs.${(totalReceived / 1000).toFixed(0)}K`,
                  color: "#22c55e",
                },
                {
                  label: "Total expenses",
                  value: expensesLoading
                    ? "..."
                    : `Rs.${(totalExpenses / 1000).toFixed(0)}K`,
                  color: "#ef4444",
                },
                {
                  label: "Net",
                  value:
                    paymentsLoading || expensesLoading
                      ? "..."
                      : `Rs.${((totalReceived - totalExpenses) / 1000).toFixed(0)}K`,
                  color: "#3b82f6",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between py-1.5 border-b border-black/[0.04] last:border-0"
                >
                  <span className="text-xs text-text-secondary">{s.label}</span>
                  <span
                    className="text-xs font-bold font-sans"
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Expense category breakdown (expenses tab) */}
          {tab === "expenses" && (
            <GlassCard padding="md">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                By Category
              </h3>
              {expensesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-5 bg-black/[0.04] rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(categoryTotals)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, amt]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-xs text-text-secondary flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              background: CATEGORY_COLORS[cat] ?? "#9ca3af",
                            }}
                          />
                          {cat}
                        </span>
                        <span className="text-xs font-sans font-semibold text-text-primary">
                          Rs.{amt.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
