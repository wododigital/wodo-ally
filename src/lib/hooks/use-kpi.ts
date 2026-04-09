"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceKPI {
  /** Number of non-draft/non-cancelled invoices with an invoice_date in the current calendar month */
  invoicesSent: number;
  /** Sum of invoice_payments.amount_received where paid_at falls in the current calendar month */
  paymentReceived: number;
  /** Current outstanding balance across all sent/overdue invoices (not month-scoped) */
  paymentPending: number;
  /** Outstanding balance on invoices with status = "overdue" only */
  overdueAmount: number;
}

// ─── Month boundary helper ────────────────────────────────────────────────────

function currentMonthBounds(): { monthStart: string; monthEnd: string } {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
  return { monthStart, monthEnd };
}

// ─── useInvoiceKPI ────────────────────────────────────────────────────────────

/**
 * Returns four invoice KPI metrics calculated against the current calendar month
 * (except paymentPending/overdueAmount which reflect current outstanding totals).
 *
 * Data is stale after 60 seconds - appropriate for a dashboard header metric
 * that doesn't need sub-second freshness.
 *
 * All queries run via the Supabase client directly, consistent with the pattern
 * used in useDashboardKPIs (use-analytics.ts). If a dedicated backend endpoint
 * /api/invoices/kpi becomes available, swap the queryFn body to a single fetch()
 * call and keep the return shape identical.
 */
export function useInvoiceKPI() {
  return useQuery<InvoiceKPI, Error>({
    queryKey: ["invoice-kpi"],
    queryFn: async (): Promise<InvoiceKPI> => {
      const supabase = createClient();
      const { monthStart, monthEnd } = currentMonthBounds();

      // ── 1. Invoices sent this month ─────────────────────────────────────────
      // Count finalized invoices (any status except draft/cancelled) whose
      // invoice_date falls within this calendar month.
      const { count: invoicesSent, error: sentError } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .gte("invoice_date", monthStart)
        .lte("invoice_date", monthEnd)
        .not("status", "in", '("draft","cancelled")');

      if (sentError) throw new Error(sentError.message);

      // ── 2. Payments received this month ────────────────────────────────────
      // Sum amount_received from invoice_payments where payment_date is this
      // month. Use payment_date (the actual receipt date) not paid_at on the
      // invoice, as multiple partial payments may span the month boundary.
      const { data: monthPayments, error: paymentsError } = await supabase
        .from("invoice_payments")
        .select("amount_received_inr, amount_received, currency")
        .gte("payment_date", monthStart)
        .lte("payment_date", monthEnd);

      if (paymentsError) throw new Error(paymentsError.message);

      // Prefer INR-normalised amount when available (foreign currency invoices
      // store the converted value in amount_received_inr).
      const paymentReceived = (monthPayments ?? []).reduce(
        (sum, p) =>
          sum + Number(p.amount_received_inr ?? (p.currency === "INR" || !p.currency ? p.amount_received ?? 0 : 0)),
        0
      );

      // ── 3. Payment pending (all outstanding invoices) ───────────────────────
      // Not month-scoped - reflects current total outstanding at any point in
      // time, which is the operationally useful figure for a collections view.
      // Note: balance_due is in invoice currency. For non-INR invoices, these are approximate display values.
      const { data: pendingInvoices, error: pendingError } = await supabase
        .from("invoices")
        .select("balance_due")
        .in("status", ["sent", "overdue", "partially_paid"])
        .gt("balance_due", 0);

      if (pendingError) throw new Error(pendingError.message);

      const paymentPending = (pendingInvoices ?? []).reduce(
        (sum, inv) => sum + Number(inv.balance_due ?? 0),
        0
      );

      // ── 4. Overdue amount ───────────────────────────────────────────────────
      // Note: balance_due is in invoice currency. For non-INR invoices, these are approximate display values.
      const { data: overdueInvoices, error: overdueError } = await supabase
        .from("invoices")
        .select("balance_due")
        .eq("status", "overdue")
        .gt("balance_due", 0);

      if (overdueError) throw new Error(overdueError.message);

      const overdueAmount = (overdueInvoices ?? []).reduce(
        (sum, inv) => sum + Number(inv.balance_due ?? 0),
        0
      );

      return {
        invoicesSent: invoicesSent ?? 0,
        paymentReceived,
        paymentPending,
        overdueAmount,
      };
    },
    staleTime: 60_000, // 1 minute
  });
}
