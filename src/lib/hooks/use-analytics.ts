"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getFinancialYear, getFinancialYearRange } from "@/lib/utils/format";

// Views are not registered in the Database type - use this helper to query them.
// The cast is safe because Supabase views are read-only and we only call .select().
type AnyClient = any;

// ─── View row types ───────────────────────────────────────────────────────────

export interface MonthlyPLRow {
  month_start: string;
  month_label: string;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
}

export interface RevenueByClientRow {
  client_id: string;
  client_name: string;
  invoice_count: number;
  total_invoiced: number;
  total_collected: number;
  avg_days_to_payment: number | null;
}

export interface ExpensesByCategoryRow {
  month_label: string;
  month_start: string;
  category: string;
  total_amount: number;
  transaction_count: number;
}

export interface InvoiceStatusSummaryRow {
  status: string;
  invoice_count: number;
  total_value: number;
}

export interface ClientHealthScoreRow {
  client_id: string;
  client_name: string;
  paid_count: number;
  on_time_count: number;
  overdue_count: number;
  avg_payment_days: number | null;
  total_collected: number | null;
  on_time_pct: number;
  health_score: number;
}

export interface ProjectRevenueByTypeRow {
  project_type: string;
  project_count: number;
  total_collected: number | null;
}

export interface CashFlowMonthlyRow {
  month_start: string;
  month_label: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface RevenueByServiceRow {
  service_id: string;
  service_name: string;
  color: string;
  is_active: boolean;
  project_count: number;
  line_item_count: number;
  total_line_item_revenue: number;
  monthly_retainer_value: number;
}

export interface DashboardKPIs {
  revenue_this_month: number;
  revenue_last_month: number;
  outstanding: number;
  active_clients: number;
  overdue_invoices: number;
  mrr: number;
}

export interface PaymentListItem {
  id: string;
  invoice_id: string;
  invoice_number: string | null;
  client_id: string;
  client_name: string;
  payment_date: string;
  amount_received: number;
  amount_received_inr: number | null;
  currency: string;
  tds_amount: number;
  skydo_fx_margin: number;
  skydo_processing_fee: number;
  bank_charges: number;
  other_deductions: number;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
}

// ─── FY helpers ───────────────────────────────────────────────────────────────

/** Derives ISO date range for the current Indian FY using canonical helpers from format.ts */
function getCurrentFYRange(): { from: string; to: string } {
  const fy = getFinancialYear();
  const { start, end } = getFinancialYearRange(fy);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { from: fmt(start), to: fmt(end) };
}

function getNMonthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

// ─── useMonthlyPL ─────────────────────────────────────────────────────────────

export function useMonthlyPL(financialYear?: string) {
  return useQuery({
    queryKey: ["monthly-pl", financialYear],
    queryFn: async (): Promise<MonthlyPLRow[]> => {
      const supabase = createClient() as AnyClient;
      let query = supabase
        .from("monthly_pl_view")
        .select("*")
        .order("month_start", { ascending: true });

      if (financialYear) {
        // e.g. "2025-26" => from=2025-04-01, to=2026-03-31
        const parts = financialYear.split("-");
        if (parts.length === 2) {
          const startYear = parseInt(parts[0], 10);
          query = query
            .gte("month_start", `${startYear}-04-01`)
            .lte("month_start", `${startYear + 1}-03-31`);
        }
      } else {
        // default: full current FY
        const { from, to } = getCurrentFYRange();
        query = query.gte("month_start", from).lte("month_start", to);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
        month_start: row.month_start as string,
        month_label: row.month_label as string,
        total_revenue: Number(row.total_revenue ?? 0),
        total_expenses: Number(row.total_expenses ?? 0),
        net_profit: Number(row.net_profit ?? 0),
      }));
    },
  });
}

// ─── useRevenueByClient ───────────────────────────────────────────────────────

export function useRevenueByClient() {
  return useQuery({
    queryKey: ["revenue-by-client"],
    queryFn: async (): Promise<RevenueByClientRow[]> => {
      const supabase = createClient() as AnyClient;
      const { data, error } = await supabase
        .from("revenue_by_client_view")
        .select("*")
        .order("total_collected", { ascending: false });

      if (error) throw new Error(error.message);

      return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
        client_id: row.client_id as string,
        client_name: row.client_name as string,
        invoice_count: Number(row.invoice_count ?? 0),
        total_invoiced: Number(row.total_invoiced ?? 0),
        total_collected: Number(row.total_collected ?? 0),
        avg_days_to_payment:
          row.avg_days_to_payment != null
            ? Number(row.avg_days_to_payment)
            : null,
      }));
    },
  });
}

// ─── useExpensesByCategory ────────────────────────────────────────────────────

export function useExpensesByCategory(months = 6) {
  return useQuery({
    queryKey: ["expenses-by-category", months],
    queryFn: async (): Promise<ExpensesByCategoryRow[]> => {
      const supabase = createClient() as AnyClient;
      const from = getNMonthsAgo(months);
      const { data, error } = await supabase
        .from("expenses_by_category_view")
        .select("*")
        .gte("month_start", from)
        .order("month_start", { ascending: true });

      if (error) throw new Error(error.message);

      return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
        month_label: row.month_label as string,
        month_start: row.month_start as string,
        category: row.category as string,
        total_amount: Number(row.total_amount ?? 0),
        transaction_count: Number(row.transaction_count ?? 0),
      }));
    },
  });
}

// ─── useInvoiceStatusSummary ──────────────────────────────────────────────────

export function useInvoiceStatusSummary() {
  return useQuery({
    queryKey: ["invoice-status-summary"],
    queryFn: async (): Promise<InvoiceStatusSummaryRow[]> => {
      const supabase = createClient() as AnyClient;
      const { data, error } = await supabase
        .from("invoice_status_summary")
        .select("*");

      if (error) throw new Error(error.message);

      return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
        status: row.status as string,
        invoice_count: Number(row.invoice_count ?? 0),
        total_value: Number(row.total_value ?? 0),
      }));
    },
  });
}

// ─── useClientHealthScores ────────────────────────────────────────────────────

export function useClientHealthScores() {
  return useQuery({
    queryKey: ["client-health-scores"],
    queryFn: async (): Promise<ClientHealthScoreRow[]> => {
      const supabase = createClient() as AnyClient;
      const { data, error } = await supabase
        .from("client_health_scores")
        .select("*")
        .order("health_score", { ascending: false });

      if (error) throw new Error(error.message);

      return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
        client_id: row.client_id as string,
        client_name: row.client_name as string,
        paid_count: Number(row.paid_count ?? 0),
        on_time_count: Number(row.on_time_count ?? 0),
        overdue_count: Number(row.overdue_count ?? 0),
        avg_payment_days:
          row.avg_payment_days != null ? Number(row.avg_payment_days) : null,
        total_collected:
          row.total_collected != null ? Number(row.total_collected) : null,
        on_time_pct: Number(row.on_time_pct ?? 0),
        health_score: Number(row.health_score ?? 0),
      }));
    },
  });
}

// ─── useProjectRevenueByType ──────────────────────────────────────────────────

export function useProjectRevenueByType() {
  return useQuery({
    queryKey: ["project-revenue-by-type"],
    queryFn: async (): Promise<ProjectRevenueByTypeRow[]> => {
      const supabase = createClient() as AnyClient;
      const { data, error } = await supabase
        .from("project_revenue_by_type")
        .select("*")
        .order("total_collected", { ascending: false });

      if (error) throw new Error(error.message);

      return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
        project_type: row.project_type as string,
        project_count: Number(row.project_count ?? 0),
        total_collected:
          row.total_collected != null ? Number(row.total_collected) : null,
      }));
    },
  });
}

// ─── useCashFlowMonthly ───────────────────────────────────────────────────────

export function useCashFlowMonthly(months = 6) {
  return useQuery({
    queryKey: ["cash-flow-monthly", months],
    queryFn: async (): Promise<CashFlowMonthlyRow[]> => {
      const supabase = createClient() as AnyClient;
      const from = getNMonthsAgo(months);
      const { data, error } = await supabase
        .from("cash_flow_monthly")
        .select("*")
        .gte("month_start", from)
        .order("month_start", { ascending: true });

      if (error) throw new Error(error.message);

      return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
        month_start: row.month_start as string,
        month_label: row.month_label as string,
        inflow: Number(row.inflow ?? 0),
        outflow: Number(row.outflow ?? 0),
        net: Number(row.net ?? 0),
      }));
    },
  });
}

// ─── useRevenueByService ──────────────────────────────────────────────────────

export function useRevenueByService() {
  return useQuery({
    queryKey: ["revenue-by-service"],
    queryFn: async (): Promise<RevenueByServiceRow[]> => {
      const supabase = createClient() as AnyClient;
      const { data, error } = await supabase
        .from("revenue_by_service_view")
        .select("*")
        .order("total_line_item_revenue", { ascending: false });

      if (error) throw new Error(error.message);

      return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
        service_id: row.service_id as string,
        service_name: row.service_name as string,
        color: row.color as string,
        is_active: Boolean(row.is_active),
        project_count: Number(row.project_count ?? 0),
        line_item_count: Number(row.line_item_count ?? 0),
        total_line_item_revenue: Number(row.total_line_item_revenue ?? 0),
        monthly_retainer_value: Number(row.monthly_retainer_value ?? 0),
      }));
    },
  });
}

// ─── useDashboardKPIs ─────────────────────────────────────────────────────────

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async (): Promise<DashboardKPIs> => {
      const supabase = createClient();

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);

      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthStart = new Date(
        lastMonthDate.getFullYear(),
        lastMonthDate.getMonth(),
        1
      )
        .toISOString()
        .slice(0, 10);
      const lastMonthEnd = new Date(
        lastMonthDate.getFullYear(),
        lastMonthDate.getMonth() + 1,
        0
      )
        .toISOString()
        .slice(0, 10);

      // Revenue this month
      const { data: thisMonthPayments } = await supabase
        .from("invoice_payments")
        .select("amount_received_inr, amount_received, currency")
        .gte("payment_date", thisMonthStart)
        .lte("payment_date", thisMonthEnd);

      const revenue_this_month = (thisMonthPayments ?? []).reduce(
        (sum, p) =>
          sum + Number(p.amount_received_inr ?? (p.currency === "INR" || !p.currency ? p.amount_received ?? 0 : 0)),
        0
      );

      // Revenue last month
      const { data: lastMonthPayments } = await supabase
        .from("invoice_payments")
        .select("amount_received_inr, amount_received, currency")
        .gte("payment_date", lastMonthStart)
        .lte("payment_date", lastMonthEnd);

      const revenue_last_month = (lastMonthPayments ?? []).reduce(
        (sum, p) =>
          sum + Number(p.amount_received_inr ?? (p.currency === "INR" || !p.currency ? p.amount_received ?? 0 : 0)),
        0
      );

      // Outstanding
      const { data: outstandingInvoices } = await supabase
        .from("invoices")
        .select("balance_due")
        .in("status", ["sent", "overdue", "partially_paid"]);

      const outstanding = (outstandingInvoices ?? []).reduce(
        (sum, i) => sum + Number(i.balance_due ?? 0),
        0
      );

      // Active clients
      const { count: active_clients } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");

      // Overdue invoices
      const { count: overdue_invoices } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("status", "overdue");

      // MRR from active retainer projects
      const { data: retainerProjects } = await supabase
        .from("projects")
        .select("retainer_amount")
        .eq("engagement_type", "retainer")
        .in("status", ["active_execution", "maintenance"])
        .not("retainer_amount", "is", null);

      const mrr = (retainerProjects ?? []).reduce(
        (sum, p) => sum + Number(p.retainer_amount ?? 0),
        0
      );

      return {
        revenue_this_month,
        revenue_last_month,
        outstanding,
        active_clients: active_clients ?? 0,
        overdue_invoices: overdue_invoices ?? 0,
        mrr,
      };
    },
  });
}

// ─── usePaymentsList ──────────────────────────────────────────────────────────

export function usePaymentsList() {
  return useQuery({
    queryKey: ["payments-list"],
    queryFn: async (): Promise<PaymentListItem[]> => {
      const supabase = createClient();

      const { data: payments, error } = await supabase
        .from("invoice_payments")
        .select("*")
        .order("payment_date", { ascending: false });

      if (error) throw new Error(error.message);
      if (!payments || payments.length === 0) return [];

      // Fetch related invoices
      const invoiceIds = Array.from(new Set(payments.map((p) => p.invoice_id)));
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, invoice_number, client_id")
        .in("id", invoiceIds);

      const invoiceMap = new Map(
        (invoices ?? []).map((i) => [i.id, i])
      );

      // Fetch clients
      const clientIds = Array.from(
        new Set((invoices ?? []).map((i) => i.client_id))
      );
      const { data: clients } = await supabase
        .from("clients")
        .select("id, company_name")
        .in("id", clientIds);

      const clientMap = new Map(
        (clients ?? []).map((c) => [c.id, c])
      );

      return payments.map((p) => {
        const invoice = invoiceMap.get(p.invoice_id);
        const client = invoice ? clientMap.get(invoice.client_id) : undefined;
        return {
          id: p.id,
          invoice_id: p.invoice_id,
          invoice_number: invoice?.invoice_number ?? null,
          client_id: invoice?.client_id ?? "",
          client_name: client?.company_name ?? "Unknown",
          payment_date: p.payment_date,
          amount_received: Number(p.amount_received ?? 0),
          amount_received_inr:
            p.amount_received_inr != null
              ? Number(p.amount_received_inr)
              : null,
          currency: p.currency ?? "INR",
          tds_amount: Number(p.tds_amount ?? 0),
          skydo_fx_margin: Number(p.skydo_fx_margin ?? 0),
          skydo_processing_fee: Number(p.skydo_processing_fee ?? 0),
          bank_charges: Number(p.bank_charges ?? 0),
          other_deductions: Number(p.other_deductions ?? 0),
          payment_method: p.payment_method ?? null,
          reference_number: p.reference_number ?? null,
          notes: p.notes ?? null,
        } as PaymentListItem;
      });
    },
  });
}
