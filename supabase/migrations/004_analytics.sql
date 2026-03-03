-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 004: Analytics views
-- Tables referenced: invoices, invoice_payments, clients, transactions,
--                    expense_categories, projects
-- Run in Supabase SQL Editor (Settings > SQL Editor)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. monthly_pl_view ───────────────────────────────────────────────────────
-- Revenue from invoice_payments; expenses from transactions.debit per month

CREATE OR REPLACE VIEW monthly_pl_view AS
WITH revenue AS (
  SELECT
    DATE_TRUNC('month', ip.payment_date)                         AS month_start,
    SUM(COALESCE(ip.amount_received_inr, ip.amount_received))    AS total_revenue
  FROM invoice_payments ip
  GROUP BY DATE_TRUNC('month', ip.payment_date)
),
expenses AS (
  SELECT
    DATE_TRUNC('month', t.transaction_date)  AS month_start,
    SUM(t.debit)                             AS total_expenses
  FROM transactions t
  WHERE t.debit IS NOT NULL
    AND t.transaction_type != 'income'
  GROUP BY DATE_TRUNC('month', t.transaction_date)
)
SELECT
  COALESCE(r.month_start, e.month_start)                          AS month_start,
  TO_CHAR(COALESCE(r.month_start, e.month_start), 'Mon YYYY')    AS month_label,
  COALESCE(r.total_revenue, 0)                                    AS total_revenue,
  COALESCE(e.total_expenses, 0)                                   AS total_expenses,
  COALESCE(r.total_revenue, 0) - COALESCE(e.total_expenses, 0)   AS net_profit
FROM revenue r
FULL OUTER JOIN expenses e USING (month_start)
ORDER BY month_start;

-- ─── 2. revenue_by_client_view ───────────────────────────────────────────────
-- Revenue collected (via invoice_payments) per client

CREATE OR REPLACE VIEW revenue_by_client_view AS
SELECT
  c.id                                                              AS client_id,
  c.company_name                                                    AS client_name,
  COUNT(DISTINCT i.id)                                             AS invoice_count,
  SUM(i.total_amount)                                              AS total_invoiced,
  COALESCE(SUM(ip.amount_received_inr), 0)                        AS total_collected,
  ROUND(
    AVG(
      CASE WHEN i.status = 'paid' AND i.paid_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (i.paid_at - i.invoice_date::TIMESTAMPTZ)) / 86400
      END
    )::numeric, 1
  )                                                                 AS avg_days_to_payment
FROM clients c
LEFT JOIN invoices i     ON i.client_id = c.id AND i.status != 'draft'
LEFT JOIN invoice_payments ip ON ip.invoice_id = i.id
GROUP BY c.id, c.company_name
ORDER BY total_invoiced DESC NULLS LAST;

-- ─── 3. expenses_by_category_view ────────────────────────────────────────────
-- Monthly expense totals grouped by category name

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
  AND t.transaction_type != 'income'
GROUP BY DATE_TRUNC('month', t.transaction_date), COALESCE(ec.name, 'Uncategorized')
ORDER BY month_start DESC, total_amount DESC;

-- ─── 4. invoice_status_summary ───────────────────────────────────────────────

CREATE OR REPLACE VIEW invoice_status_summary AS
SELECT
  status,
  COUNT(*)          AS invoice_count,
  SUM(total_amount) AS total_value
FROM invoices
GROUP BY status;

-- ─── 5. client_health_scores ─────────────────────────────────────────────────

CREATE OR REPLACE VIEW client_health_scores AS
WITH payment_stats AS (
  SELECT
    i.client_id,
    COUNT(*) FILTER (WHERE i.status = 'paid')                                                    AS paid_count,
    COUNT(*) FILTER (WHERE i.status = 'paid' AND i.paid_at IS NOT NULL AND i.paid_at::date <= i.due_date) AS on_time_count,
    COUNT(*) FILTER (WHERE i.status = 'overdue')                                                  AS overdue_count,
    ROUND(
      AVG(
        CASE WHEN i.status = 'paid' AND i.paid_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (i.paid_at - i.invoice_date::TIMESTAMPTZ)) / 86400
        END
      )::numeric, 1
    )                                                                                              AS avg_payment_days,
    SUM(COALESCE(ip.amount_received_inr, ip.amount_received))                                    AS total_collected
  FROM invoices i
  LEFT JOIN invoice_payments ip ON ip.invoice_id = i.id
  GROUP BY i.client_id
)
SELECT
  c.id              AS client_id,
  c.company_name    AS client_name,
  ps.paid_count,
  ps.on_time_count,
  ps.overdue_count,
  ps.avg_payment_days,
  ps.total_collected,
  CASE WHEN ps.paid_count > 0
    THEN ROUND((ps.on_time_count::numeric / ps.paid_count) * 100, 0)
    ELSE 0
  END AS on_time_pct,
  -- Health score: 60% on-time rate + 40% payment speed (lower days = better)
  LEAST(100, ROUND(
    (CASE WHEN ps.paid_count > 0
      THEN (ps.on_time_count::numeric / ps.paid_count) * 60
      ELSE 0
    END)
    + GREATEST(0, 40.0 - COALESCE(ps.avg_payment_days, 30) / 30.0 * 40)
  , 0)) AS health_score
FROM clients c
LEFT JOIN payment_stats ps ON ps.client_id = c.id
ORDER BY health_score DESC NULLS LAST;

-- ─── 6. project_revenue_by_type ──────────────────────────────────────────────

CREATE OR REPLACE VIEW project_revenue_by_type AS
SELECT
  p.project_type,
  COUNT(DISTINCT p.id)                                              AS project_count,
  SUM(COALESCE(ip.amount_received_inr, ip.amount_received))        AS total_collected
FROM projects p
JOIN invoices i ON i.client_id = p.client_id AND p.id = ANY(i.project_ids)
JOIN invoice_payments ip ON ip.invoice_id = i.id
GROUP BY p.project_type
ORDER BY total_collected DESC NULLS LAST;

-- ─── 7. cash_flow_monthly ────────────────────────────────────────────────────

CREATE OR REPLACE VIEW cash_flow_monthly AS
WITH inflows AS (
  SELECT
    DATE_TRUNC('month', ip.payment_date)                         AS month_start,
    SUM(COALESCE(ip.amount_received_inr, ip.amount_received))    AS inflow
  FROM invoice_payments ip
  GROUP BY DATE_TRUNC('month', ip.payment_date)
),
outflows AS (
  SELECT
    DATE_TRUNC('month', t.transaction_date)  AS month_start,
    SUM(t.debit)                             AS outflow
  FROM transactions t
  WHERE t.debit IS NOT NULL
    AND t.transaction_type != 'income'
  GROUP BY DATE_TRUNC('month', t.transaction_date)
)
SELECT
  COALESCE(i.month_start, o.month_start)                       AS month_start,
  TO_CHAR(COALESCE(i.month_start, o.month_start), 'Mon YYYY') AS month_label,
  COALESCE(i.inflow,  0)                                        AS inflow,
  COALESCE(o.outflow, 0)                                        AS outflow,
  COALESCE(i.inflow, 0) - COALESCE(o.outflow, 0)              AS net
FROM inflows i
FULL OUTER JOIN outflows o USING (month_start)
ORDER BY month_start;

-- ─────────────────────────────────────────────────────────────────────────────
-- All views are safe to re-run (CREATE OR REPLACE).
-- Column mapping used:
--   invoices.invoice_date  (date issued)
--   invoices.due_date      (payment due)
--   invoices.paid_at       (timestamptz - when fully paid)
--   clients.company_name   (not "name")
--   transactions.debit     (expense amount, NULL for credits)
--   transactions.transaction_date
--   invoice_payments.payment_date, amount_received, amount_received_inr
-- ─────────────────────────────────────────────────────────────────────────────
