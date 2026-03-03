import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { ParsedTransaction } from "./bank-statement";

type ExpenseRule = Database["public"]["Tables"]["expense_rules"]["Row"];

export interface CategorizationResult {
  category_id: string | null;
  matched_rule_id: string | null;
  is_auto_categorized: boolean;
  transaction_type:
    | "expense"
    | "income"
    | "transfer"
    | "tax"
    | "loan"
    | "uncategorized";
}

// Cache loaded rules for the session so we don't re-fetch on every call
let cachedRules: ExpenseRule[] | null = null;

// ─── Rule loading ─────────────────────────────────────────────────────────────

export async function loadRules(): Promise<ExpenseRule[]> {
  if (cachedRules !== null) return cachedRules;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("expense_rules")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: true });

  if (error) throw new Error(error.message);
  cachedRules = data ?? [];
  return cachedRules;
}

/** Clear the in-memory rule cache (useful after rule changes). */
export function clearRuleCache(): void {
  cachedRules = null;
}

// ─── Auto-detect transaction type from particulars ────────────────────────────

const TAX_PATTERNS = /\b(gst|tds|tax|it\s*refund|income\s*tax|service\s*tax|advance\s*tax)\b/i;
const TRANSFER_PATTERNS = /\b(self\s*transfer|own\s*account|fd\s*(?:booking|maturity)|sweep)\b/i;
const LOAN_PATTERNS = /\b(emi|loan|equated\s*monthly|home\s*loan|car\s*loan|personal\s*loan)\b/i;

function detectTransactionType(
  particulars: string,
  debit: number | null,
  credit: number | null
): CategorizationResult["transaction_type"] {
  const p = particulars;

  if (TRANSFER_PATTERNS.test(p)) return "transfer";
  if (LOAN_PATTERNS.test(p)) return "loan";
  if (TAX_PATTERNS.test(p)) return "tax";

  if (credit != null && credit > 0) {
    // Credits are almost always income
    return "income";
  }

  if (debit != null && debit > 0) {
    return "expense";
  }

  return "uncategorized";
}

// ─── Single transaction matching ──────────────────────────────────────────────

export function categorizeTransaction(
  particulars: string,
  debit: number | null,
  credit: number | null,
  rules: ExpenseRule[]
): CategorizationResult {
  const lower = particulars.toLowerCase();

  for (const rule of rules) {
    const pattern = rule.pattern;
    let matched = false;

    switch (rule.match_type) {
      case "contains":
        matched = lower.includes(pattern.toLowerCase());
        break;
      case "starts_with":
        matched = lower.startsWith(pattern.toLowerCase());
        break;
      case "exact":
        matched = lower === pattern.toLowerCase();
        break;
      case "regex":
        try {
          matched = new RegExp(pattern, "i").test(particulars);
        } catch {
          // Invalid regex - skip
          matched = false;
        }
        break;
    }

    if (matched) {
      return {
        category_id: rule.category_id,
        matched_rule_id: rule.id,
        is_auto_categorized: true,
        transaction_type: detectTransactionType(particulars, debit, credit),
      };
    }
  }

  // No rule matched
  return {
    category_id: null,
    matched_rule_id: null,
    is_auto_categorized: false,
    transaction_type: detectTransactionType(particulars, debit, credit),
  };
}

// ─── Batch categorization ─────────────────────────────────────────────────────

export async function categorizeTransactions(
  transactions: ParsedTransaction[]
): Promise<CategorizationResult[]> {
  const rules = await loadRules();

  return transactions.map((t) =>
    categorizeTransaction(t.particulars, t.debit, t.credit, rules)
  );
}
