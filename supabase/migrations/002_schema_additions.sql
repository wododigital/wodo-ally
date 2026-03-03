-- ============================================================
-- WODO Ally - Schema Additions (Phase 2 UX Improvements)
-- Run this in Supabase SQL Editor AFTER 001_schema.sql
-- ============================================================

-- 1. CLIENTS: payment behaviour stats
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS avg_days_to_pay NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS on_time_payment_pct INTEGER CHECK (on_time_payment_pct >= 0 AND on_time_payment_pct <= 100);

-- 2. PROJECTS: manual progress tracking
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS progress_pct INTEGER DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100);

-- 3. INVESTOR REPORTS: report type (monthly / quarterly / annual)
ALTER TABLE investor_reports
  ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'monthly'
    CHECK (report_type IN ('monthly', 'quarterly', 'annual'));

-- 4. TRANSACTIONS: optional project attribution
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions(project_id);

-- 5. CLIENTS: retainer billing day
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS billing_day SMALLINT CHECK (billing_day >= 1 AND billing_day <= 28);

COMMENT ON COLUMN clients.billing_day IS 'Day of month (1-28) to auto-generate retainer invoices';

-- 5. Seed payment behaviour for existing mock clients
-- (safe to re-run due to ON CONFLICT DO NOTHING pattern)
-- These match the mock data IDs in the UI layer
UPDATE clients SET
  avg_days_to_pay = 7.2,
  on_time_payment_pct = 100,
  billing_day = 1
WHERE id = '11111111-0000-0000-0000-000000000001'; -- Nandhini Hotel (retainer)

UPDATE clients SET
  avg_days_to_pay = 18.5,
  on_time_payment_pct = 72,
  billing_day = 1
WHERE id = '22222222-0000-0000-0000-000000000002'; -- Maximus OIGA (retainer)

UPDATE clients SET
  avg_days_to_pay = 14.0,
  on_time_payment_pct = 85
WHERE id = '33333333-0000-0000-0000-000000000003'; -- Godavari Heritage

UPDATE clients SET
  avg_days_to_pay = 9.0,
  on_time_payment_pct = 95
WHERE id = '44444444-0000-0000-0000-000000000004'; -- Dentique

UPDATE clients SET
  avg_days_to_pay = 11.3,
  on_time_payment_pct = 90,
  billing_day = 1
WHERE id = '55555555-0000-0000-0000-000000000005'; -- Sea Wonders (retainer)

UPDATE clients SET
  avg_days_to_pay = 31.0,
  on_time_payment_pct = 50
WHERE id = '66666666-0000-0000-0000-000000000006'; -- Raj Enterprises
