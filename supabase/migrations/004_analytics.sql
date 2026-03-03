-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 004: Analytics views and supporting tables
-- Run in Supabase SQL Editor (Settings > SQL Editor)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. monthly_pl_view ───────────────────────────────────────────────────────
-- Aggregates invoiced revenue and logged expenses per month (FY Apr-Mar)

CREATE OR REPLACE VIEW monthly_pl_view AS
SELECT
  TO_CHAR(DATE_TRUNC('month', issue_date), 'Mon YYYY') AS month_label,
  DATE_TRUNC('month', issue_date)                       AS month_start,
  SUM(total_amount)                                     AS total_invoiced,
  0::numeric                                            AS total_expenses   -- joined below
FROM invoices
WHERE status != 'draft'
GROUP BY DATE_TRUNC('month', issue_date)
ORDER BY month_start;

-- ─── 2. revenue_by_client_view ───────────────────────────────────────────────
-- Total revenue collected (paid invoices) per client

CREATE OR REPLACE VIEW revenue_by_client_view AS
SELECT
  c.id          AS client_id,
  c.name        AS client_name,
  COUNT(i.id)   AS invoice_count,
  SUM(i.total_amount)                                     AS total_invoiced,
  SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END) AS total_collected,
  ROUND(
    AVG(
      CASE WHEN i.status = 'paid' AND i.paid_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (i.paid_at - i.issue_date)) / 86400
      END
    )::numeric, 1
  )                                                       AS avg_days_to_payment
FROM clients c
LEFT JOIN invoices i ON i.client_id = c.id
GROUP BY c.id, c.name
ORDER BY total_invoiced DESC;

-- ─── 3. expenses_by_category_view ────────────────────────────────────────────
-- Monthly expense totals grouped by category

CREATE OR REPLACE VIEW expenses_by_category_view AS
SELECT
  TO_CHAR(DATE_TRUNC('month', date), 'Mon YYYY') AS month_label,
  DATE_TRUNC('month', date)                       AS month_start,
  category,
  SUM(debit_amount)                               AS total_amount,
  COUNT(*)                                        AS transaction_count
FROM expenses
WHERE debit_amount IS NOT NULL
GROUP BY DATE_TRUNC('month', date), category
ORDER BY month_start DESC, total_amount DESC;

-- ─── 4. invoice_status_summary ───────────────────────────────────────────────
-- Count + value of invoices in each status

CREATE OR REPLACE VIEW invoice_status_summary AS
SELECT
  status,
  COUNT(*)          AS invoice_count,
  SUM(total_amount) AS total_value
FROM invoices
GROUP BY status;

-- ─── 5. client_health_scores ─────────────────────────────────────────────────
-- Simple scoring: on-time rate + revenue weight

CREATE OR REPLACE VIEW client_health_scores AS
WITH payment_stats AS (
  SELECT
    i.client_id,
    COUNT(*) FILTER (WHERE i.status = 'paid')                                          AS paid_count,
    COUNT(*) FILTER (WHERE i.status = 'paid' AND i.paid_at <= i.due_date)              AS on_time_count,
    COUNT(*) FILTER (WHERE i.status = 'overdue')                                        AS overdue_count,
    ROUND(AVG(CASE WHEN i.status = 'paid' AND i.paid_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (i.paid_at - i.issue_date)) / 86400 END)::numeric, 1)   AS avg_payment_days,
    SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END)                    AS total_collected
  FROM invoices i
  GROUP BY i.client_id
)
SELECT
  c.id   AS client_id,
  c.name AS client_name,
  ps.paid_count,
  ps.on_time_count,
  ps.overdue_count,
  ps.avg_payment_days,
  ps.total_collected,
  CASE WHEN ps.paid_count > 0
    THEN ROUND((ps.on_time_count::numeric / ps.paid_count) * 100, 0)
    ELSE 0
  END AS on_time_pct,
  -- Health score: 60% on-time rate + 40% avg speed (capped)
  LEAST(100, ROUND(
    (CASE WHEN ps.paid_count > 0
      THEN (ps.on_time_count::numeric / ps.paid_count) * 60
      ELSE 0
    END)
    +
    (GREATEST(0, 40 - COALESCE(ps.avg_payment_days, 30)) / 30.0 * 40)
  , 0)) AS health_score
FROM clients c
LEFT JOIN payment_stats ps ON ps.client_id = c.id
ORDER BY health_score DESC NULLS LAST;

-- ─── 6. project_revenue_by_type ──────────────────────────────────────────────
-- Revenue grouped by project type/service

CREATE OR REPLACE VIEW project_revenue_by_type AS
SELECT
  p.project_type,
  COUNT(DISTINCT p.id)  AS project_count,
  SUM(i.total_amount)   AS total_revenue
FROM projects p
JOIN invoices i ON i.project_id = p.id
WHERE i.status != 'draft'
GROUP BY p.project_type
ORDER BY total_revenue DESC;

-- ─── 7. cash_flow_monthly ────────────────────────────────────────────────────
-- Inflows (payments received) vs outflows (expenses) per month

CREATE OR REPLACE VIEW cash_flow_monthly AS
SELECT
  month_start,
  month_label,
  COALESCE(inflow,  0) AS inflow,
  COALESCE(outflow, 0) AS outflow,
  COALESCE(inflow, 0) - COALESCE(outflow, 0) AS net
FROM (
  SELECT
    DATE_TRUNC('month', paid_at) AS month_start,
    TO_CHAR(DATE_TRUNC('month', paid_at), 'Mon YYYY') AS month_label,
    SUM(total_amount) AS inflow
  FROM invoices
  WHERE status = 'paid' AND paid_at IS NOT NULL
  GROUP BY DATE_TRUNC('month', paid_at)
) inflows
FULL OUTER JOIN (
  SELECT
    DATE_TRUNC('month', date) AS month_start,
    SUM(debit_amount) AS outflow
  FROM expenses
  WHERE debit_amount IS NOT NULL
  GROUP BY DATE_TRUNC('month', date)
) outflows USING (month_start)
ORDER BY month_start;

-- ─────────────────────────────────────────────────────────────────────────────
-- Notes:
-- - All views are read-only and safe to re-run (CREATE OR REPLACE)
-- - Assumes tables: invoices, clients, expenses, projects (from migration 001/002)
-- - invoices.paid_at column needed - add if missing:
--   ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
-- - projects.project_type column needed:
--   ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type TEXT;
-- ─────────────────────────────────────────────────────────────────────────────
