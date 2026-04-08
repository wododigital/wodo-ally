-- ============================================================
-- WODO Ally - Invoice Email Activity Log
-- Migration 012 - Run in Supabase SQL Editor after 011_services_hsn.sql
-- ============================================================

-- 1. CREATE TABLE (idempotent)
CREATE TABLE IF NOT EXISTS invoice_email_activity (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id       UUID        NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  action_type      TEXT        NOT NULL CHECK (action_type IN ('sent', 'bounced', 'opened')),
  email_recipient  TEXT        NOT NULL,
  email_template   TEXT        NOT NULL CHECK (email_template IN ('invoice', 'reminder', 'followup')),
  sent_at          TIMESTAMPTZ DEFAULT now(),
  resent_count     INT         DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  created_by       UUID        REFERENCES auth.users(id)
);

-- 2. INDEXES (idempotent)
CREATE INDEX IF NOT EXISTS idx_invoice_email_activity_invoice_id
  ON invoice_email_activity(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_email_activity_sent_at
  ON invoice_email_activity(sent_at);

-- 3. RLS
ALTER TABLE invoice_email_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read email activity" ON invoice_email_activity;
DROP POLICY IF EXISTS "Admin/Manager/Accountant write email activity" ON invoice_email_activity;

CREATE POLICY "Authenticated read email activity"
  ON invoice_email_activity FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin/Manager/Accountant write email activity"
  ON invoice_email_activity FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager', 'accountant')
    )
  );
