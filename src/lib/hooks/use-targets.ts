"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type TargetRow = Database["public"]["Tables"]["financial_targets"]["Row"];
type TargetInsert = Database["public"]["Tables"]["financial_targets"]["Insert"];
type TargetUpdate = Database["public"]["Tables"]["financial_targets"]["Update"];

// ─── Indian FY helpers ────────────────────────────────────────────────────────

/**
 * Returns the ISO date strings for the start and end of the given Indian FY.
 * FY '2025-26' => Apr 1 2025 - Mar 31 2026
 */
function getFYBounds(financialYear: string): { start: string; end: string } {
  const [startYearStr] = financialYear.split("-");
  const startYear = parseInt(startYearStr, 10);
  return {
    start: `${startYear}-04-01`,
    end: `${startYear + 1}-03-31`,
  };
}

/**
 * Returns ISO date bounds for a specific month within an Indian FY.
 * Month is 1-12 where 1=Apr, ..., 12=Mar in FY terms
 * but the DB stores calendar months (1=Jan..12=Dec), so we use calendar month directly.
 */
function getMonthBounds(year: number, calendarMonth: number): { start: string; end: string } {
  const start = new Date(year, calendarMonth - 1, 1);
  const end = new Date(year, calendarMonth, 0); // last day of month
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(start), end: fmt(end) };
}

/**
 * Returns ISO date bounds for a quarter within an Indian FY.
 * Q1 = Apr-Jun, Q2 = Jul-Sep, Q3 = Oct-Dec, Q4 = Jan-Mar
 */
function getQuarterBounds(financialYear: string, quarter: number): { start: string; end: string } {
  const [startYearStr] = financialYear.split("-");
  const fy = parseInt(startYearStr, 10);

  const quarterDates: Record<number, { start: string; end: string }> = {
    1: { start: `${fy}-04-01`, end: `${fy}-06-30` },
    2: { start: `${fy}-07-01`, end: `${fy}-09-30` },
    3: { start: `${fy}-10-01`, end: `${fy}-12-31` },
    4: { start: `${fy + 1}-01-01`, end: `${fy + 1}-03-31` },
  };

  return quarterDates[quarter] ?? quarterDates[1];
}

// ─── useTargets ───────────────────────────────────────────────────────────────

export function useTargets(financialYear = "2025-26") {
  return useQuery({
    queryKey: ["financial_targets", financialYear],
    queryFn: async (): Promise<TargetRow[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("financial_targets")
        .select("*")
        .eq("financial_year", financialYear)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}

// ─── useCreateTarget ──────────────────────────────────────────────────────────

export function useCreateTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (insert: TargetInsert): Promise<TargetRow> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("financial_targets")
        .insert(insert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["financial_targets", variables.financial_year],
      });
      toast.success("Target created");
    },
    onError: (err: Error) => {
      toast.error(`Failed to create target: ${err.message}`);
    },
  });
}

// ─── useUpdateTarget ──────────────────────────────────────────────────────────

export interface UpdateTargetPayload {
  id: string;
  financial_year: string;
  updates: Pick<TargetUpdate, "title" | "target_amount" | "notes" | "current_amount">;
}

export function useUpdateTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateTargetPayload): Promise<TargetRow> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("financial_targets")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["financial_targets", variables.financial_year],
      });
      toast.success("Target updated");
    },
    onError: (err: Error) => {
      toast.error(`Failed to update target: ${err.message}`);
    },
  });
}

// ─── useDeleteTarget ──────────────────────────────────────────────────────────

export function useDeleteTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
    }: {
      id: string;
      financial_year: string;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("financial_targets")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["financial_targets", variables.financial_year],
      });
      toast.success("Target deleted");
    },
    onError: (err: Error) => {
      toast.error(`Failed to delete target: ${err.message}`);
    },
  });
}

// ─── useRefreshTargetProgress ─────────────────────────────────────────────────

export function useRefreshTargetProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (financialYear: string): Promise<void> => {
      const supabase = createClient();

      // 1. Fetch all non-custom targets for this FY
      const { data: targets, error: targetsErr } = await supabase
        .from("financial_targets")
        .select("*")
        .eq("financial_year", financialYear)
        .neq("target_type", "custom");

      if (targetsErr) throw targetsErr;
      if (!targets || targets.length === 0) return;

      const fyBounds = getFYBounds(financialYear);

      // 2. Batch-fetch all the data we need

      // Revenue: sum invoice_payments.amount_received_inr for the FY
      const { data: allPayments, error: paymentsErr } = await supabase
        .from("invoice_payments")
        .select("id, amount_received_inr, payment_date")
        .gte("payment_date", fyBounds.start)
        .lte("payment_date", fyBounds.end);

      if (paymentsErr) throw paymentsErr;

      // MRR: active retainer projects
      const { data: retainerProjects, error: retainerErr } = await supabase
        .from("projects")
        .select("id, retainer_amount")
        .eq("engagement_type", "retainer")
        .in("status", ["active_execution", "maintenance"]);

      if (retainerErr) throw retainerErr;

      // New clients: count by FY
      const { data: newClients, error: clientsErr } = await supabase
        .from("clients")
        .select("id, created_at")
        .eq("status", "active")
        .gte("created_at", fyBounds.start)
        .lte("created_at", fyBounds.end + "T23:59:59Z");

      if (clientsErr) throw clientsErr;

      // Expenses: sum transactions.debit for the FY (exclude income type)
      const { data: allTransactions, error: txErr } = await supabase
        .from("transactions")
        .select("id, debit, transaction_date, transaction_type")
        .gte("transaction_date", fyBounds.start)
        .lte("transaction_date", fyBounds.end)
        .neq("transaction_type", "income");

      if (txErr) throw txErr;

      // 3. Compute current_amount per target and collect UPDATEs
      const updates: Array<{ id: string; current_amount: number }> = [];

      for (const target of targets) {
        let current_amount = 0;

        if (target.target_type === "revenue") {
          let paymentsForPeriod = allPayments ?? [];

          if (target.period_type === "monthly" && target.month) {
            // Determine the calendar year for this month in the FY
            const [startYearStr] = financialYear.split("-");
            const startYear = parseInt(startYearStr, 10);
            // Months Apr(4)-Dec(12) belong to startYear; Jan(1)-Mar(3) to startYear+1
            const calYear = target.month >= 4 ? startYear : startYear + 1;
            const bounds = getMonthBounds(calYear, target.month);
            paymentsForPeriod = paymentsForPeriod.filter(
              (p) => p.payment_date >= bounds.start && p.payment_date <= bounds.end
            );
          } else if (target.period_type === "quarterly" && target.quarter) {
            const bounds = getQuarterBounds(financialYear, target.quarter);
            paymentsForPeriod = paymentsForPeriod.filter(
              (p) => p.payment_date >= bounds.start && p.payment_date <= bounds.end
            );
          }

          current_amount = paymentsForPeriod.reduce(
            (sum, p) => sum + (p.amount_received_inr ?? 0),
            0
          );
        } else if (target.target_type === "mrr") {
          // MRR is a point-in-time metric: sum of active retainer amounts
          current_amount = (retainerProjects ?? []).reduce(
            (sum, p) => sum + (p.retainer_amount ?? 0),
            0
          );
        } else if (target.target_type === "new_clients") {
          let clientsForPeriod = newClients ?? [];

          if (target.period_type === "monthly" && target.month) {
            const [startYearStr] = financialYear.split("-");
            const startYear = parseInt(startYearStr, 10);
            const calYear = target.month >= 4 ? startYear : startYear + 1;
            const bounds = getMonthBounds(calYear, target.month);
            clientsForPeriod = clientsForPeriod.filter(
              (c) => c.created_at >= bounds.start && c.created_at <= bounds.end + "T23:59:59Z"
            );
          } else if (target.period_type === "quarterly" && target.quarter) {
            const bounds = getQuarterBounds(financialYear, target.quarter);
            clientsForPeriod = clientsForPeriod.filter(
              (c) => c.created_at >= bounds.start && c.created_at <= bounds.end + "T23:59:59Z"
            );
          }

          current_amount = clientsForPeriod.length;
        } else if (target.target_type === "expense_reduction") {
          let txForPeriod = allTransactions ?? [];

          if (target.period_type === "monthly" && target.month) {
            const [startYearStr] = financialYear.split("-");
            const startYear = parseInt(startYearStr, 10);
            const calYear = target.month >= 4 ? startYear : startYear + 1;
            const bounds = getMonthBounds(calYear, target.month);
            txForPeriod = txForPeriod.filter(
              (t) => t.transaction_date >= bounds.start && t.transaction_date <= bounds.end
            );
          } else if (target.period_type === "quarterly" && target.quarter) {
            const bounds = getQuarterBounds(financialYear, target.quarter);
            txForPeriod = txForPeriod.filter(
              (t) => t.transaction_date >= bounds.start && t.transaction_date <= bounds.end
            );
          }

          current_amount = txForPeriod.reduce(
            (sum, t) => sum + (t.debit ?? 0),
            0
          );
        }

        updates.push({ id: target.id, current_amount });
      }

      // 4. Execute all UPDATEs
      const now = new Date().toISOString();
      await Promise.all(
        updates.map(({ id, current_amount }) =>
          supabase
            .from("financial_targets")
            .update({ current_amount, updated_at: now })
            .eq("id", id)
        )
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["financial_targets"] });
      toast.success("Target progress refreshed");
    },
    onError: (err: Error) => {
      toast.error(`Failed to refresh progress: ${err.message}`);
    },
  });
}
