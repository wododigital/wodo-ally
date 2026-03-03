-- ============================================================
-- WODO Ally - Migration 003: Pipeline & Cash Flow Features
-- Run AFTER 001_schema.sql and 002_schema_additions.sql
-- ============================================================

-- ─── 1. CLIENTS: payment terms (NET days) ────────────────────────────────────
-- Used to predict expected_payment_date = invoice_date + payment_terms_days
-- based on each client's actual payment behaviour

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS payment_terms_days SMALLINT DEFAULT 7
    CHECK (payment_terms_days BETWEEN 1 AND 90);

COMMENT ON COLUMN clients.payment_terms_days IS
  'NET payment terms: expected days to receive payment after invoice is sent. Used for cash flow forecasting.';

-- Seed realistic values based on known client behaviour
UPDATE clients SET payment_terms_days = 7  WHERE id = '11111111-0000-0000-0000-000000000001'; -- Nandhini (avg 7.2d)
UPDATE clients SET payment_terms_days = 15 WHERE id = '22222222-0000-0000-0000-000000000002'; -- Maximus (avg 18.5d, some TDS delay)
UPDATE clients SET payment_terms_days = 10 WHERE id = '33333333-0000-0000-0000-000000000003'; -- Godavari (avg 14d)
UPDATE clients SET payment_terms_days = 7  WHERE id = '44444444-0000-0000-0000-000000000004'; -- Dentique (avg 9d)
UPDATE clients SET payment_terms_days = 10 WHERE id = '55555555-0000-0000-0000-000000000005'; -- Sea Wonders (avg 11.3d)
UPDATE clients SET payment_terms_days = 30 WHERE id = '66666666-0000-0000-0000-000000000006'; -- Raj (avg 31d, slow payer)


-- ─── 2. SCHEDULED_INVOICES table ─────────────────────────────────────────────
-- Tracks upcoming retainer invoices to be generated each billing cycle.
-- Auto-populated when billing_day arrives for active retainer clients.
-- One-time milestone payments can also be tracked here manually.

CREATE TABLE IF NOT EXISTS scheduled_invoices (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID          NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id            UUID          REFERENCES projects(id) ON DELETE SET NULL,

  -- Scheduling
  billing_month         TEXT          NOT NULL,  -- 'YYYY-MM', e.g. '2026-04'
  scheduled_date        DATE          NOT NULL,  -- when the invoice should be created
  expected_payment_date DATE,                    -- predicted receipt date (scheduled_date + payment_terms_days)

  -- Invoice details
  amount                NUMERIC(12,2) NOT NULL,
  currency              TEXT          NOT NULL DEFAULT 'INR',
  description           TEXT,                   -- e.g. 'SEO Retainer - April 2026'

  -- Lifecycle
  status                TEXT          NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generated', 'skipped', 'cancelled')),
  invoice_id            UUID          REFERENCES invoices(id) ON DELETE SET NULL, -- set when generated
  invoice_type          TEXT          NOT NULL DEFAULT 'retainer'
    CHECK (invoice_type IN ('retainer', 'milestone', 'one_time')),

  notes                 TEXT,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_invoices_client       ON scheduled_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_invoices_date         ON scheduled_invoices(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_invoices_status       ON scheduled_invoices(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_invoices_billing_month ON scheduled_invoices(billing_month);
CREATE INDEX IF NOT EXISTS idx_scheduled_invoices_project      ON scheduled_invoices(project_id);

COMMENT ON TABLE scheduled_invoices IS
  'Upcoming invoices to be generated. Retainer entries auto-created monthly; milestone entries added manually.';


-- ─── 3. Row Level Security ────────────────────────────────────────────────────

ALTER TABLE scheduled_invoices ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all scheduled invoices
CREATE POLICY "authenticated_read_scheduled_invoices"
  ON scheduled_invoices FOR SELECT
  TO authenticated
  USING (true);

-- Only admins and managers can insert/update/delete
CREATE POLICY "managers_write_scheduled_invoices"
  ON scheduled_invoices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );


-- ─── 4. Updated_at trigger ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_scheduled_invoices_updated_at ON scheduled_invoices;
CREATE TRIGGER set_scheduled_invoices_updated_at
  BEFORE UPDATE ON scheduled_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─── 5. Seed scheduled_invoices (Apr-Jun 2026) ───────────────────────────────
-- NOTE: These INSERT statements use the mock UUIDs from the UI layer.
-- Run ONLY after client and project records with these IDs have been created
-- in Phase 3 onboarding. Safe to skip for now if IDs don't exist yet.

-- Nandhini Hotel - SEO Retainer (billing_day=1, payment_terms=7)
INSERT INTO scheduled_invoices
  (client_id, project_id, billing_month, scheduled_date, expected_payment_date, amount, currency, description, invoice_type)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '2026-04', '2026-04-01', '2026-04-08', 76700, 'INR', 'SEO & GMB Retainer - April 2026',   'retainer'),
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '2026-05', '2026-05-01', '2026-05-08', 76700, 'INR', 'SEO & GMB Retainer - May 2026',     'retainer'),
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '2026-06', '2026-06-01', '2026-06-08', 76700, 'INR', 'SEO & GMB Retainer - June 2026',    'retainer')
ON CONFLICT DO NOTHING;

-- Maximus OIGA - SEO Retainer (billing_day=1, payment_terms=15)
INSERT INTO scheduled_invoices
  (client_id, project_id, billing_month, scheduled_date, expected_payment_date, amount, currency, description, invoice_type)
VALUES
  ('22222222-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', '2026-04', '2026-04-01', '2026-04-16', 59000, 'INR', 'SEO Retainer - April 2026',         'retainer'),
  ('22222222-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', '2026-05', '2026-05-01', '2026-05-16', 59000, 'INR', 'SEO Retainer - May 2026',           'retainer'),
  ('22222222-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', '2026-06', '2026-06-01', '2026-06-16', 59000, 'INR', 'SEO Retainer - June 2026',          'retainer')
ON CONFLICT DO NOTHING;

-- Sea Wonders Tourism - SEO Retainer (billing_day=1, payment_terms=10)
INSERT INTO scheduled_invoices
  (client_id, project_id, billing_month, scheduled_date, expected_payment_date, amount, currency, description, invoice_type)
VALUES
  ('55555555-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000004', '2026-04', '2026-04-01', '2026-04-11', 89600, 'INR', 'SEO & Digital Marketing - April 2026', 'retainer'),
  ('55555555-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000004', '2026-05', '2026-05-01', '2026-05-11', 89600, 'INR', 'SEO & Digital Marketing - May 2026',   'retainer'),
  ('55555555-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000004', '2026-06', '2026-06-01', '2026-06-11', 89600, 'INR', 'SEO & Digital Marketing - June 2026',  'retainer')
ON CONFLICT DO NOTHING;

-- Godavari Heritage - Brand Identity (one-time milestone, on delivery)
INSERT INTO scheduled_invoices
  (client_id, project_id, billing_month, scheduled_date, expected_payment_date, amount, currency, description, invoice_type)
VALUES
  ('33333333-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000005', '2026-04', '2026-04-15', '2026-04-29', 85000, 'INR', 'Brand Identity - Final Delivery', 'milestone')
ON CONFLICT DO NOTHING;
