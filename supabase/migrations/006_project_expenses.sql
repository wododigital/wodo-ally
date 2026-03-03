-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 006: Project expense breakdown view
-- Tables referenced: transactions, projects, clients, expense_categories
-- Run in Supabase SQL Editor after 005_services.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Note: transactions.project_id column must exist for this view to work.
-- If the column does not exist yet, add it:
--   ALTER TABLE transactions
--     ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
--   CREATE INDEX IF NOT EXISTS idx_transactions_project
--     ON transactions(project_id);

CREATE OR REPLACE VIEW project_expense_breakdown AS
SELECT
  p.id AS project_id,
  p.name AS project_name,
  p.client_id,
  c.company_name AS client_name,
  TO_CHAR(DATE_TRUNC('month', t.transaction_date), 'Mon YYYY') AS month_label,
  DATE_TRUNC('month', t.transaction_date) AS month_start,
  COALESCE(ec.name, 'Uncategorized') AS category,
  SUM(t.debit) AS total_expense,
  COUNT(*) AS transaction_count
FROM transactions t
JOIN projects p ON p.id = t.project_id
JOIN clients c ON c.id = p.client_id
LEFT JOIN expense_categories ec ON ec.id = t.category_id
WHERE t.debit IS NOT NULL AND t.project_id IS NOT NULL
GROUP BY p.id, p.name, p.client_id, c.company_name,
         DATE_TRUNC('month', t.transaction_date), COALESCE(ec.name, 'Uncategorized')
ORDER BY month_start DESC, total_expense DESC;
