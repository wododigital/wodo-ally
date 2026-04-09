-- Migration 018: Audit fixes
-- Date: 2026-04-09
-- Fixes: D-1 (revenue view currency), D-2 (TDS schema), D-4 (expense view),
--        D-17/D-18 (health scores), S-5 (bank DELETE policy), S-11 (audit log constraint)


-- ============================================================================
-- Fix 1 [D-4]: expenses_by_category_view - Exclude transfer/loan/tax
-- The original view only excluded 'income'. Transfers, loans, and tax payments
-- are not true operating expenses and should be filtered out.
-- ============================================================================

CREATE OR REPLACE VIEW expenses_by_category_view AS
SELECT
  TO_CHAR(DATE_TRUNC('month', t.transaction_date), 'Mon YYYY') AS month_label,
  DATE_TRUNC('month', t.transaction_date)                      AS month_start,
  COALESCE(ec.name, 'Uncategorized')                           AS category,
  SUM(t.debit)                                                 AS total_amount,
  COUNT(*)                                                     AS transaction_count
FROM transactions t
LEFT JOIN expense_categories ec ON ec.id = t.category_id
WHERE t.debit IS NOT NULL
  AND t.transaction_type NOT IN ('income', 'transfer', 'loan', 'tax')
GROUP BY DATE_TRUNC('month', t.transaction_date), COALESCE(ec.name, 'Uncategorized')
ORDER BY month_start DESC, total_amount DESC;


-- ============================================================================
-- Fix 2 [D-1]: revenue_by_client_view - Fix mixed currency totals
-- total_invoiced was using raw total_amount which mixes USD/AED/INR values.
-- Now uses total_amount_inr (the INR equivalent) with fallback to total_amount
-- for domestic invoices that may not have total_amount_inr set.
-- ============================================================================

CREATE OR REPLACE VIEW revenue_by_client_view AS
SELECT
  c.id AS client_id,
  c.company_name AS client_name,
  count(DISTINCT i.id) AS invoice_count,
  SUM(COALESCE(i.total_amount_inr, i.total_amount)) AS total_invoiced,
  COALESCE(sum(COALESCE(ip.amount_received_inr, ip.amount_received)), 0) AS total_collected,
  round(avg(
    CASE
      WHEN i.status = 'paid' AND i.paid_at IS NOT NULL
      THEN EXTRACT(epoch FROM (i.paid_at - i.invoice_date::timestamptz)) / 86400
      ELSE NULL
    END
  ), 1) AS avg_days_to_payment
FROM clients c
LEFT JOIN invoices i ON i.client_id = c.id AND i.status != 'draft'
LEFT JOIN invoice_payments ip ON ip.invoice_id = i.id
GROUP BY c.id, c.company_name
ORDER BY total_invoiced DESC NULLS LAST;


-- ============================================================================
-- Fix 3 [D-2]: TDS certificates schema fix
-- The live DB has migration 001's schema (quarter as INTEGER, no
-- certificate_number). The UI expects certificate_number (TEXT) and quarter
-- as TEXT (e.g. 'Q1'). This safely adds/alters columns only if needed.
-- ============================================================================

-- Add certificate_number column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tds_certificates' AND column_name = 'certificate_number') THEN
    ALTER TABLE tds_certificates ADD COLUMN certificate_number TEXT;
  END IF;
END $$;

-- Change quarter from INTEGER to TEXT if needed
-- Converts existing integer values (1,2,3,4) to 'Q1','Q2','Q3','Q4'
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tds_certificates' AND column_name = 'quarter' AND data_type = 'integer') THEN
    ALTER TABLE tds_certificates ALTER COLUMN quarter TYPE TEXT USING 'Q' || quarter::TEXT;
    ALTER TABLE tds_certificates DROP CONSTRAINT IF EXISTS tds_certificates_quarter_check;
  END IF;
END $$;


-- ============================================================================
-- Fix 4 [S-11]: Audit log - Constrain user_id to auth.uid()
-- The original INSERT policy used WITH CHECK (true), allowing any
-- authenticated user to insert rows with arbitrary user_id values.
-- This constrains inserts so user_id must match the caller's auth.uid().
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_log;
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());


-- ============================================================================
-- Fix 5 [S-5]: bank_accounts - Add DELETE policy for admins
-- The original migration defined SELECT, UPDATE, and INSERT policies but
-- omitted DELETE, making it impossible to remove bank accounts via the UI.
-- ============================================================================

DROP POLICY IF EXISTS "Admin can delete bank accounts" ON bank_accounts;
CREATE POLICY "Admin can delete bank accounts"
  ON bank_accounts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );


-- ============================================================================
-- Fix 6 [D-17, D-18]: Health score - Bound between 0-100, default 50 for
-- new clients with no invoices
-- Previously, clients with no invoices got health_score = NULL (sorted last).
-- Now they default to 50. The score is also bounded with GREATEST(0, ...)
-- to prevent negative values from long payment delays.
-- ============================================================================

CREATE OR REPLACE VIEW client_health_scores AS
WITH payment_stats AS (
  SELECT
    i.client_id,
    count(DISTINCT i.id) FILTER (WHERE i.status = 'paid') AS paid_count,
    count(DISTINCT i.id) FILTER (WHERE i.status = 'paid' AND i.paid_at IS NOT NULL AND i.paid_at::date <= i.due_date) AS on_time_count,
    count(DISTINCT i.id) FILTER (WHERE i.status = 'overdue') AS overdue_count,
    round(avg(
      CASE
        WHEN i.status = 'paid' AND i.paid_at IS NOT NULL
        THEN EXTRACT(epoch FROM (i.paid_at - i.invoice_date::timestamptz)) / 86400
        ELSE NULL
      END
    ), 1) AS avg_payment_days,
    sum(COALESCE(ip.amount_received_inr, ip.amount_received)) AS total_collected
  FROM invoices i
  LEFT JOIN invoice_payments ip ON ip.invoice_id = i.id
  GROUP BY i.client_id
)
SELECT
  c.id AS client_id,
  c.company_name AS client_name,
  COALESCE(ps.paid_count, 0) AS paid_count,
  COALESCE(ps.on_time_count, 0) AS on_time_count,
  COALESCE(ps.overdue_count, 0) AS overdue_count,
  ps.avg_payment_days,
  COALESCE(ps.total_collected, 0) AS total_collected,
  CASE WHEN COALESCE(ps.paid_count, 0) > 0
    THEN round((ps.on_time_count::numeric / ps.paid_count::numeric) * 100, 0)
    ELSE 0
  END AS on_time_pct,
  -- Health score: 60% on-time rate + 40% payment speed (lower days = better)
  -- Bounded between 0 and 100; defaults to 50 for clients with no invoices
  CASE WHEN ps.client_id IS NULL THEN 50
  ELSE GREATEST(0, LEAST(100, round(
    CASE WHEN ps.paid_count > 0
      THEN (ps.on_time_count::numeric / ps.paid_count::numeric) * 60
      ELSE 0
    END
    + GREATEST(0, 40.0 - (COALESCE(ps.avg_payment_days, 30) / 30.0) * 40)
  , 0)))
  END AS health_score
FROM clients c
LEFT JOIN payment_stats ps ON ps.client_id = c.id
ORDER BY health_score DESC NULLS LAST;
