"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { ParsedStatement } from "@/lib/parsers/bank-statement";
import type { CategorizationResult } from "@/lib/parsers/auto-categorize";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];
type ExpenseCategory = Database["public"]["Tables"]["expense_categories"]["Row"];
type BankStatement = Database["public"]["Tables"]["bank_statements"]["Row"];

export interface TransactionWithCategory extends Transaction {
  expense_categories: Pick<ExpenseCategory, "id" | "name" | "color"> | null;
}

export interface TransactionFilters {
  statementId?: string;
  categoryId?: string;
  type?: string;
  search?: string;
}

export interface UpdateTransactionPayload {
  id: string;
  data: Pick<TransactionUpdate, "category_id" | "transaction_type" | "notes" | "is_manually_reviewed">;
}

export interface UploadStatementPayload {
  filename: string;
  parsed: ParsedStatement;
  categorizations: CategorizationResult[];
}

export interface ExpenseSummaryItem {
  category_id: string | null;
  category_name: string;
  category_color: string | null;
  total_debit: number;
}

export interface ExpenseSummaryPeriod {
  from: string;
  to: string;
}

// ─── useTransactions ─────────────────────────────────────────────────────────

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ["transactions", filters ?? {}],
    queryFn: async (): Promise<TransactionWithCategory[]> => {
      const supabase = createClient();

      let query = supabase
        .from("transactions")
        .select(
          "*, expense_categories(id, name, color)"
        )
        .order("transaction_date", { ascending: false });

      if (filters?.statementId) {
        query = query.eq("statement_id", filters.statementId);
      }
      if (filters?.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }
      if (filters?.type) {
        const txnType = filters.type as
          | "expense"
          | "income"
          | "transfer"
          | "tax"
          | "loan"
          | "uncategorized";
        query = query.eq("transaction_type", txnType);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      let rows = (data as unknown as TransactionWithCategory[]) ?? [];

      if (filters?.search) {
        const term = filters.search.toLowerCase();
        rows = rows.filter(
          (t) =>
            t.particulars.toLowerCase().includes(term) ||
            (t.expense_categories?.name ?? "").toLowerCase().includes(term)
        );
      }

      return rows;
    },
  });
}

// ─── useTransaction ───────────────────────────────────────────────────────────

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ["transactions", id],
    queryFn: async (): Promise<TransactionWithCategory> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("transactions")
        .select("*, expense_categories(id, name, color)")
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as TransactionWithCategory;
    },
    enabled: !!id,
  });
}

// ─── useUpdateTransaction ─────────────────────────────────────────────────────

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateTransactionPayload): Promise<Transaction> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("transactions")
        .update(payload.data)
        .eq("id", payload.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["expense-summary"] }),
      ]);
      toast.success("Transaction updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update transaction: ${error.message}`);
    },
  });
}

// ─── useExpenseCategories ─────────────────────────────────────────────────────

export function useExpenseCategories() {
  return useQuery({
    queryKey: ["expense-categories"],
    queryFn: async (): Promise<ExpenseCategory[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// ─── useBankStatements ────────────────────────────────────────────────────────

export function useBankStatements() {
  return useQuery({
    queryKey: ["bank-statements"],
    queryFn: async (): Promise<BankStatement[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bank_statements")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// ─── useUploadBankStatement ───────────────────────────────────────────────────

export function useUploadBankStatement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UploadStatementPayload): Promise<BankStatement> => {
      const supabase = createClient();
      const { parsed, filename, categorizations } = payload;

      // Insert the bank_statement row
      const { data: statementRow, error: stmtError } = await supabase
        .from("bank_statements")
        .insert({
          filename,
          bank_name: parsed.bank_name,
          account_number: parsed.account_number,
          statement_period_start: parsed.statement_period_start,
          statement_period_end: parsed.statement_period_end,
          opening_balance: parsed.opening_balance,
          closing_balance: parsed.closing_balance,
          total_debit: parsed.total_debit,
          total_credit: parsed.total_credit,
          transaction_count: parsed.transactions.length,
          status: "completed",
        })
        .select()
        .single();

      if (stmtError) throw new Error(stmtError.message);

      // Insert all transaction rows in one batch
      const txnRows = parsed.transactions.map((t, idx) => {
        const cat = categorizations[idx];
        return {
          statement_id: statementRow.id,
          transaction_date: t.transaction_date,
          value_date: t.value_date,
          particulars: t.particulars,
          cheque_number: t.cheque_number,
          debit: t.debit,
          credit: t.credit,
          balance: t.balance,
          category_id: cat?.category_id ?? null,
          is_auto_categorized: cat?.is_auto_categorized ?? false,
          is_manually_reviewed: false,
          matched_rule_id: cat?.matched_rule_id ?? null,
          transaction_type: cat?.transaction_type ?? "uncategorized",
          notes: null,
        };
      });

      if (txnRows.length > 0) {
        const { error: txnError } = await supabase
          .from("transactions")
          .insert(txnRows);

        if (txnError) throw new Error(txnError.message);
      }

      return statementRow;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["bank-statements"] }),
        queryClient.invalidateQueries({ queryKey: ["expense-summary"] }),
      ]);
      toast.success(`Statement uploaded - ${data.transaction_count} transactions imported`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload statement: ${error.message}`);
    },
  });
}

// ─── useExpenseSummary ────────────────────────────────────────────────────────

export function useExpenseSummary(period?: ExpenseSummaryPeriod) {
  return useQuery({
    queryKey: ["expense-summary", period ?? {}],
    queryFn: async (): Promise<ExpenseSummaryItem[]> => {
      const supabase = createClient();

      let query = supabase
        .from("transactions")
        .select("category_id, debit, expense_categories(id, name, color)")
        .not("debit", "is", null)
        .gt("debit", 0)
        .not("transaction_type", "in", '("transfer","loan","tax")');

      if (period?.from) {
        query = query.gte("transaction_date", period.from);
      }
      if (period?.to) {
        query = query.lte("transaction_date", period.to);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const rows = (data as unknown as Array<{
        category_id: string | null;
        debit: number | null;
        expense_categories: { id: string; name: string; color: string | null } | null;
      }>) ?? [];

      // Aggregate by category
      const map = new Map<string, ExpenseSummaryItem>();

      for (const row of rows) {
        const key = row.category_id ?? "__uncategorized__";
        const existing = map.get(key);
        const amount = row.debit ?? 0;

        if (existing) {
          existing.total_debit += amount;
        } else {
          map.set(key, {
            category_id: row.category_id,
            category_name: row.expense_categories?.name ?? "Uncategorized",
            category_color: row.expense_categories?.color ?? null,
            total_debit: amount,
          });
        }
      }

      return Array.from(map.values()).sort((a, b) => b.total_debit - a.total_debit);
    },
  });
}
