"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type ReportRow = Database["public"]["Tables"]["investor_reports"]["Row"];
type ReportInsert = Database["public"]["Tables"]["investor_reports"]["Insert"];
type ReportUpdate = Database["public"]["Tables"]["investor_reports"]["Update"];

// ─── Report data structure ────────────────────────────────────────────────────

export interface ReportData {
  month: string;
  year: number;
  financialYear: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  mrr: number;
  newClients: number;
  activeClients: number;
  activeProjects: number;
  outstandingInvoices: number;
  topClients: Array<{ name: string; revenue: number }>;
}

export type InvestorReportWithData = Omit<ReportRow, "report_data"> & {
  report_data: ReportData;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getIndianFY(month: number, year: number): string {
  // Apr-Dec: FY is year-(year+1), Jan-Mar: FY is (year-1)-year
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }
  return `${year - 1}-${String(year).slice(-2)}`;
}

// ─── useReports ───────────────────────────────────────────────────────────────

export function useReports() {
  return useQuery({
    queryKey: ["investor_reports"],
    queryFn: async (): Promise<ReportRow[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("investor_reports")
        .select("*")
        .order("report_year", { ascending: false })
        .order("report_month", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}

// ─── useReport ────────────────────────────────────────────────────────────────

export function useReport(id: string) {
  return useQuery({
    queryKey: ["investor_reports", id],
    queryFn: async (): Promise<ReportRow | null> => {
      if (!id) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("investor_reports")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// ─── useGenerateReport ────────────────────────────────────────────────────────

export interface GenerateReportPayload {
  report_month: number;
  report_year: number;
  report_type: "monthly" | "quarterly" | "annual";
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: GenerateReportPayload): Promise<ReportRow> => {
      const supabase = createClient();
      const { report_month, report_year, report_type } = payload;

      // Compute date range based on report type
      let startStr: string;
      let endStr: string;
      if (report_type === "quarterly") {
        // report_month is the first month of the quarter (4, 7, 10, or 1)
        const quarterStart = new Date(report_year, report_month - 1, 1);
        const quarterEnd = new Date(report_year, report_month + 1, 0); // last day of 3rd month
        startStr = quarterStart.toISOString().split("T")[0];
        endStr = quarterEnd.toISOString().split("T")[0];
      } else if (report_type === "annual") {
        // report_month=4 means April; range is Apr of report_year to Mar of report_year+1
        const fyStart = new Date(report_year, 3, 1); // April 1
        const fyEnd = new Date(report_year + 1, 2, 31); // March 31 next year
        startStr = fyStart.toISOString().split("T")[0];
        endStr = fyEnd.toISOString().split("T")[0];
      } else {
        // monthly
        const monthStart = new Date(report_year, report_month - 1, 1);
        const monthEnd = new Date(report_year, report_month, 0);
        startStr = monthStart.toISOString().split("T")[0];
        endStr = monthEnd.toISOString().split("T")[0];
      }

      // 1. Revenue this month
      const { data: payments } = await supabase
        .from("invoice_payments")
        .select("amount_received_inr")
        .gte("payment_date", startStr)
        .lte("payment_date", endStr);

      const revenue = (payments ?? []).reduce(
        (sum, p) => sum + (p.amount_received_inr ?? 0),
        0
      );

      // 2. Expenses this month (exclude income-type transactions)
      const { data: transactions } = await supabase
        .from("transactions")
        .select("debit")
        .gte("transaction_date", startStr)
        .lte("transaction_date", endStr)
        .neq("transaction_type", "income");

      const expenses = (transactions ?? []).reduce(
        (sum, t) => sum + (t.debit ?? 0),
        0
      );

      // 3. New clients this month
      const { data: newClientRows } = await supabase
        .from("clients")
        .select("id")
        .gte("created_at", startStr)
        .lte("created_at", endStr + "T23:59:59Z");

      const newClients = (newClientRows ?? []).length;

      // 4. Active clients (current total)
      const { count: activeClients } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");

      // 5. Active projects
      const { count: activeProjects } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .in("status", ["active_execution", "maintenance"]);

      // 6. Outstanding invoices (balance_due sum)
      const { data: outstandingRows } = await supabase
        .from("invoices")
        .select("balance_due")
        .in("status", ["sent", "overdue", "partially_paid"]);

      const outstandingInvoices = (outstandingRows ?? []).reduce(
        (sum, inv) => sum + (inv.balance_due ?? 0),
        0
      );

      // 7. MRR: sum of active retainer amounts
      const { data: retainerProjects } = await supabase
        .from("projects")
        .select("retainer_amount")
        .eq("engagement_type", "retainer")
        .in("status", ["active_execution", "maintenance"]);

      const mrr = (retainerProjects ?? []).reduce(
        (sum, p) => sum + (p.retainer_amount ?? 0),
        0
      );

      // 8. Top 3 clients by revenue this month
      // Get payment data joined with invoice -> client
      const { data: clientPayments } = await supabase
        .from("invoice_payments")
        .select("amount_received_inr, invoices!inner(client_id, clients!inner(company_name))")
        .gte("payment_date", startStr)
        .lte("payment_date", endStr);

      // Aggregate by client
      const clientRevenueMap = new Map<string, { name: string; revenue: number }>();
      for (const p of clientPayments ?? []) {
        const inv = (p as any).invoices;
        const client = inv?.clients;
        if (!client) continue;
        const clientId = inv.client_id as string;
        const name = client.company_name as string;
        const existing = clientRevenueMap.get(clientId);
        if (existing) {
          existing.revenue += p.amount_received_inr ?? 0;
        } else {
          clientRevenueMap.set(clientId, { name, revenue: p.amount_received_inr ?? 0 });
        }
      }

      const topClients = Array.from(clientRevenueMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);

      const financialYear = getIndianFY(report_month, report_year);
      const monthName = MONTH_NAMES[report_month - 1];

      // Build human-readable period label
      function getQuarterLabel(month: number, year: number): string {
        const quarters: Record<number, string> = { 4: "Q1", 7: "Q2", 10: "Q3", 1: "Q4" };
        const q = quarters[month] ?? "Q?";
        const fy = getIndianFY(month, year);
        return `${q} FY${fy}`;
      }
      const periodLabel =
        report_type === "quarterly"
          ? getQuarterLabel(report_month, report_year)
          : report_type === "annual"
          ? `FY ${financialYear}`
          : `${monthName} ${report_year}`;

      const reportData: ReportData = {
        month: periodLabel,
        year: report_year,
        financialYear,
        revenue,
        expenses,
        netProfit: revenue - expenses,
        mrr,
        newClients,
        activeClients: activeClients ?? 0,
        activeProjects: activeProjects ?? 0,
        outstandingInvoices,
        topClients,
      };

      // Create the report row
      const title = `${periodLabel} - Investor Report`;
      const insert: ReportInsert = {
        title,
        report_month,
        report_year,
        financial_year: financialYear,
        report_type,
        report_data: reportData as unknown as Database["public"]["Tables"]["investor_reports"]["Insert"]["report_data"],
        status: "generated",
      };

      const { data: created, error: insertErr } = await supabase
        .from("investor_reports")
        .insert(insert)
        .select()
        .single();

      if (insertErr) throw insertErr;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investor_reports"] });
      toast.success("Report generated successfully");
    },
    onError: (err: Error) => {
      toast.error(`Failed to generate report: ${err.message}`);
    },
  });
}

// ─── useUpdateReport ──────────────────────────────────────────────────────────

export interface UpdateReportPayload {
  id: string;
  updates: Pick<ReportUpdate, "status" | "sent_to" | "sent_at" | "pdf_url">;
}

export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateReportPayload): Promise<ReportRow> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("investor_reports")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investor_reports"] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to update report: ${err.message}`);
    },
  });
}

// ─── useDeleteReport ──────────────────────────────────────────────────────────

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("investor_reports")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investor_reports"] });
      toast.success("Report deleted");
    },
    onError: (err: Error) => {
      toast.error(`Failed to delete report: ${err.message}`);
    },
  });
}

// ─── useSendReport ────────────────────────────────────────────────────────────

export interface SendReportPayload {
  id: string;
  to: string[];
  cc?: string[];
  subject?: string;
  reportData: ReportData;
}

export function useSendReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, to, cc, subject, reportData }: SendReportPayload): Promise<void> => {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "investor_report",
          to,
          cc: cc ?? [],
          subject,
          month: reportData.month,
          year: reportData.year,
          revenue: `Rs.${reportData.revenue.toLocaleString("en-IN")}`,
          netProfit: `Rs.${reportData.netProfit.toLocaleString("en-IN")}`,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Email send failed");
      }

      // Update report status to sent
      const supabase = createClient();
      const { error } = await supabase
        .from("investor_reports")
        .update({
          status: "sent",
          sent_to: to,
          sent_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investor_reports"] });
      toast.success("Report sent successfully");
    },
    onError: (err: Error) => {
      toast.error(`Failed to send report: ${err.message}`);
    },
  });
}
