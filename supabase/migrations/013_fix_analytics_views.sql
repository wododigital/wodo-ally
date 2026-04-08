-- Fix monthly_pl_view: exclude transfers, loans, and tax from expenses
CREATE OR REPLACE VIEW monthly_pl_view AS
WITH revenue AS (
  SELECT
    date_trunc('month', ip.payment_date::timestamptz) AS month_start,
    sum(COALESCE(ip.amount_received_inr, ip.amount_received)) AS total_revenue
  FROM invoice_payments ip
  GROUP BY date_trunc('month', ip.payment_date::timestamptz)
),
expenses AS (
  SELECT
    date_trunc('month', t.transaction_date::timestamptz) AS month_start,
    sum(t.debit) AS total_expenses
  FROM transactions t
  WHERE t.debit IS NOT NULL
    AND t.transaction_type NOT IN ('income', 'transfer', 'loan', 'tax')
  GROUP BY date_trunc('month', t.transaction_date::timestamptz)
)
SELECT
  COALESCE(r.month_start, e.month_start) AS month_start,
  to_char(COALESCE(r.month_start, e.month_start), 'Mon YYYY') AS month_label,
  COALESCE(r.total_revenue, 0) AS total_revenue,
  COALESCE(e.total_expenses, 0) AS total_expenses,
  COALESCE(r.total_revenue, 0) - COALESCE(e.total_expenses, 0) AS net_profit
FROM revenue r
FULL JOIN expenses e USING (month_start)
ORDER BY COALESCE(r.month_start, e.month_start);

-- Fix client_health_scores: use DISTINCT to avoid double-counting invoices with multiple payments
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
  ps.paid_count,
  ps.on_time_count,
  ps.overdue_count,
  ps.avg_payment_days,
  ps.total_collected,
  CASE WHEN ps.paid_count > 0
    THEN round((ps.on_time_count::numeric / ps.paid_count::numeric) * 100, 0)
    ELSE 0
  END AS on_time_pct,
  LEAST(100, round(
    CASE WHEN ps.paid_count > 0
      THEN (ps.on_time_count::numeric / ps.paid_count::numeric) * 60
      ELSE 0
    END
    + GREATEST(0, 40.0 - (COALESCE(ps.avg_payment_days, 30) / 30.0) * 40)
  , 0)) AS health_score
FROM clients c
LEFT JOIN payment_stats ps ON ps.client_id = c.id
ORDER BY health_score DESC NULLS LAST;

-- Fix revenue_by_client_view: add fallback to amount_received when amount_received_inr is null
CREATE OR REPLACE VIEW revenue_by_client_view AS
SELECT
  c.id AS client_id,
  c.company_name AS client_name,
  count(DISTINCT i.id) AS invoice_count,
  sum(i.total_amount) AS total_invoiced,
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
