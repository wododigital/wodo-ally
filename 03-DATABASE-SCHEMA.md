# 03 - Database Schema (Supabase PostgreSQL)

## Setup Instructions

1. ASK the user for Supabase project credentials
2. Create all tables via Supabase SQL Editor or migrations
3. Enable Row Level Security on ALL tables
4. Insert seed data for development

## Schema Overview

```
profiles (extends auth.users)
clients                              [+billing_day, +avg_days_to_pay, +on_time_payment_pct, +payment_terms_days]
  -> client_contacts
projects                             [+progress_pct]
  -> project_phases
invoices
  -> invoice_line_items
  -> invoice_payments (tracks each payment/deduction against an invoice)
scheduled_invoices                   [NEW - pipeline/cash flow forecasting]
contracts
expense_categories
expense_rules (pattern matching for auto-categorization)
bank_statements (upload tracking)
transactions (parsed from bank statements) [+project_id]
financial_targets
investor_reports                     [+report_type]
tds_certificates
invoice_sequences
settings (app-wide key-value settings)
audit_log
```

**Migration files:**
- `supabase/migrations/001_schema.sql` - base schema
- `supabase/migrations/002_schema_additions.sql` - Phase 2 additions (run via Supabase MCP 2026-03-03)
- `supabase/migrations/003_pipeline.sql` - Pipeline feature: payment_terms_days + scheduled_invoices (ready to run)

## SQL Migrations

### 1. Profiles Table

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'accountant', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### 2. Clients Table

```sql
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  display_name TEXT, -- short name for UI
  client_type TEXT NOT NULL CHECK (client_type IN ('indian_gst', 'indian_non_gst', 'international')),
  region TEXT NOT NULL CHECK (region IN ('india', 'usa', 'uae', 'uk', 'other')),
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency IN ('INR', 'USD', 'AED', 'GBP', 'EUR')),
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'India',
  pincode TEXT,
  gstin TEXT, -- GST number for Indian GST clients
  tax_number TEXT, -- EIN, TRN, VAT etc for international
  tax_number_label TEXT, -- "EIN", "TRN", "VAT" etc
  signing_authority TEXT,
  designation TEXT,
  billing_emails TEXT[], -- array of email addresses for invoicing
  phone TEXT,
  website TEXT,
  notes TEXT,
  health_score INTEGER DEFAULT 50 CHECK (health_score >= 0 AND health_score <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'churned', 'closed')),
  -- Payment behaviour stats (added via 002_schema_additions.sql)
  avg_days_to_pay NUMERIC(5,1),
  on_time_payment_pct INTEGER CHECK (on_time_payment_pct >= 0 AND on_time_payment_pct <= 100),
  -- Retainer billing (added via 002_schema_additions.sql)
  billing_day SMALLINT CHECK (billing_day >= 1 AND billing_day <= 28), -- day of month for retainer invoice generation
  -- Pipeline / cash flow (added via 003_pipeline.sql)
  payment_terms_days SMALLINT DEFAULT 7 CHECK (payment_terms_days BETWEEN 1 AND 90), -- NET days expected to receive payment
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view clients" ON clients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Manager can manage clients" ON clients FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_type ON clients(client_type);
```

### 3. Client Contacts (multiple contacts per client)

```sql
CREATE TABLE client_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  designation TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_billing_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view contacts" ON client_contacts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Manager can manage contacts" ON client_contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
```

### 4. Projects Table

```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL CHECK (project_type IN (
    'branding', 'ui_ux_design', 'web_development', 'seo', 'google_ads',
    'social_media', 'gmb', 'content_marketing', 'full_service', 'other'
  )),
  engagement_type TEXT NOT NULL CHECK (engagement_type IN ('one_time', 'retainer')),
  -- For one-time projects
  total_value NUMERIC(12,2),
  payment_split JSONB, -- e.g. {"advance": 50, "milestone1": 30, "final": 20}
  -- For retainers
  retainer_amount NUMERIC(12,2),
  retainer_currency TEXT DEFAULT 'INR',
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
  contract_start_date DATE,
  contract_end_date DATE,
  min_contract_months INTEGER,
  -- Common fields
  status TEXT NOT NULL DEFAULT 'onboarding' CHECK (status IN (
    'onboarding', 'design_phase', 'development_phase', 'deployment_qa',
    'setup_strategy', 'active_execution', 'maintenance', 'completed',
    'on_hold', 'cancelled'
  )),
  projected_completion_date DATE,
  actual_completion_date DATE,
  timeline_days INTEGER, -- estimated working days
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read" ON projects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Manager write" ON projects FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_type ON projects(engagement_type);
```

### 5. Invoices Table

```sql
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Reference and numbering
  invoice_number TEXT UNIQUE, -- G00001 or NG00001 (NULL for proforma)
  proforma_ref TEXT, -- PF-20260301-001 (for pro forma only)
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('gst', 'international', 'non_gst', 'proforma')),
  -- Relationships
  client_id UUID REFERENCES clients(id) NOT NULL,
  project_ids UUID[] DEFAULT '{}', -- can link to multiple projects
  -- Amounts
  currency TEXT NOT NULL DEFAULT 'INR',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0, -- 18 for GST, 0 for international
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- INR equivalents (for internal tracking)
  total_amount_inr NUMERIC(12,2), -- converted amount in INR
  -- Dates
  invoice_date DATE NOT NULL,
  due_date DATE,
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled'
  )),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  -- Payment summary
  total_received NUMERIC(12,2) DEFAULT 0,
  total_tds_deducted NUMERIC(12,2) DEFAULT 0,
  total_other_deductions NUMERIC(12,2) DEFAULT 0,
  balance_due NUMERIC(12,2) DEFAULT 0,
  -- Billing period (for retainers)
  billing_period_start DATE,
  billing_period_end DATE,
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  -- PDF storage
  pdf_url TEXT,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read" ON invoices FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Manager/Accountant write" ON invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))
);

CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_type ON invoices(invoice_type);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
```

### 6. Invoice Line Items

```sql
CREATE TABLE invoice_line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read" ON invoice_line_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Manager/Accountant write" ON invoice_line_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))
);
```

### 7. Invoice Payments (tracks each payment event)

```sql
CREATE TABLE invoice_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  payment_date DATE NOT NULL,
  amount_received NUMERIC(12,2) NOT NULL,
  amount_received_inr NUMERIC(12,2), -- always INR
  currency TEXT NOT NULL DEFAULT 'INR',
  -- Deductions
  tds_amount NUMERIC(12,2) DEFAULT 0,
  tds_section TEXT, -- '194J', '194C', etc.
  skydo_fx_margin NUMERIC(12,2) DEFAULT 0,
  skydo_processing_fee NUMERIC(12,2) DEFAULT 0,
  bank_charges NUMERIC(12,2) DEFAULT 0,
  other_deductions NUMERIC(12,2) DEFAULT 0,
  deduction_notes TEXT,
  -- Payment method
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'skydo_usd', 'skydo_aed', 'skydo_gbp', 'upi', 'other')),
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read" ON invoice_payments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Manager/Accountant write" ON invoice_payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))
);
```

### 8. Contracts

```sql
CREATE TABLE contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  contract_type TEXT NOT NULL CHECK (contract_type IN ('design_development', 'seo_retainer', 'custom')),
  title TEXT NOT NULL,
  -- Template data (JSONB for flexibility)
  contract_data JSONB NOT NULL DEFAULT '{}',
  -- e.g. { deliverables: [...], payment_terms: "50-30-20", timeline_days: 60, total_value: 260000 }
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'active', 'completed', 'terminated')),
  contract_date DATE,
  signed_date DATE,
  pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read" ON contracts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Manager write" ON contracts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
```

### 9. Expense Management Tables

```sql
-- Expense categories
CREATE TABLE expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  color TEXT, -- hex color for charts
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pattern matching rules for auto-categorization
CREATE TABLE expense_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES expense_categories(id) ON DELETE CASCADE NOT NULL,
  pattern TEXT NOT NULL, -- regex or keyword pattern to match against "Particulars"
  match_type TEXT NOT NULL DEFAULT 'contains' CHECK (match_type IN ('contains', 'starts_with', 'regex', 'exact')),
  priority INTEGER DEFAULT 0, -- higher = checked first
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bank statement uploads
CREATE TABLE bank_statements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  bank_name TEXT NOT NULL DEFAULT 'IDFC FIRST',
  account_number TEXT,
  statement_period_start DATE,
  statement_period_end DATE,
  opening_balance NUMERIC(12,2),
  closing_balance NUMERIC(12,2),
  total_debit NUMERIC(12,2),
  total_credit NUMERIC(12,2),
  transaction_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'error')),
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES profiles(id)
);

-- Individual transactions from bank statements
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  statement_id UUID REFERENCES bank_statements(id) ON DELETE CASCADE NOT NULL,
  transaction_date DATE NOT NULL,
  value_date DATE,
  particulars TEXT NOT NULL,
  cheque_number TEXT,
  debit NUMERIC(12,2),
  credit NUMERIC(12,2),
  balance NUMERIC(12,2),
  -- Categorization
  category_id UUID REFERENCES expense_categories(id),
  is_auto_categorized BOOLEAN DEFAULT false,
  is_manually_reviewed BOOLEAN DEFAULT false,
  matched_rule_id UUID REFERENCES expense_rules(id),
  -- Linking
  linked_invoice_id UUID REFERENCES invoices(id), -- link credits to invoice payments
  transaction_type TEXT CHECK (transaction_type IN ('expense', 'income', 'transfer', 'tax', 'loan', 'uncategorized')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read, admin/manager/accountant can write
CREATE POLICY "auth_read" ON expense_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_write" ON expense_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))
);
-- Repeat similar policies for expense_rules, bank_statements, transactions
```

### 10. Financial Targets

```sql
CREATE TABLE financial_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('revenue', 'mrr', 'new_clients', 'expense_reduction', 'custom')),
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  -- Applicable period
  financial_year TEXT NOT NULL, -- "2025-26"
  month INTEGER, -- 1-12 (for monthly)
  quarter INTEGER, -- 1-4 (for quarterly)
  -- Target values
  target_amount NUMERIC(12,2) NOT NULL,
  current_amount NUMERIC(12,2) DEFAULT 0,
  -- Filters
  service_type TEXT, -- null means all, or specific project_type
  currency TEXT DEFAULT 'INR',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE financial_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read" ON financial_targets FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_write" ON financial_targets FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
```

### 11. Investor Reports

```sql
CREATE TABLE investor_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  report_month INTEGER NOT NULL, -- 1-12
  report_year INTEGER NOT NULL,
  financial_year TEXT NOT NULL,
  -- Snapshot data at time of generation
  report_data JSONB NOT NULL DEFAULT '{}',
  -- Contains: mrr, new_signups, churn_count, revenue_by_service, total_revenue,
  -- total_expenses, net_profit, client_count, growth_rate, cash_runway, etc.
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent')),
  pdf_url TEXT,
  sent_to TEXT[], -- email addresses
  sent_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE investor_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read" ON investor_reports FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_write" ON investor_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin'))
);
```

### 12. TDS Certificates Tracking

```sql
CREATE TABLE tds_certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) NOT NULL,
  financial_year TEXT NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  certificate_received BOOLEAN DEFAULT false,
  received_date DATE,
  amount NUMERIC(12,2),
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 13. Audit Log

```sql
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 14. Scheduled Invoices (Pipeline) - added via 003_pipeline.sql

Tracks upcoming invoices to be generated each billing cycle. Auto-populated when billing_day arrives for active retainer clients. One-time milestone payments can also be tracked here manually.

```sql
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

-- RLS: authenticated users can read; admin/manager can write
ALTER TABLE scheduled_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_scheduled_invoices" ON scheduled_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "managers_write_scheduled_invoices" ON scheduled_invoices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')));
```

**Key usage in Phase 3:**
- Query `WHERE status = 'pending' AND billing_month = 'YYYY-MM'` to populate the Pipeline page
- When an invoice is created from a scheduled item, set `status = 'generated'` and `invoice_id = <new invoice id>`
- Auto-create new entries each month when `billing_day` is reached for retainer clients

### 15. Invoice Number Sequences

```sql
-- Separate sequences for G and NG numbers
CREATE TABLE invoice_sequences (
  id TEXT PRIMARY KEY, -- 'gst' or 'non_gst'
  current_number INTEGER NOT NULL DEFAULT 0,
  prefix TEXT NOT NULL, -- 'G' or 'NG'
  padding INTEGER NOT NULL DEFAULT 5 -- pad to 5 digits
);

INSERT INTO invoice_sequences (id, current_number, prefix, padding)
VALUES ('gst', 113, 'G', 5), ('non_gst', 202, 'NG', 5);
-- Starting from current numbers based on existing invoices

-- Function to get next invoice number
CREATE OR REPLACE FUNCTION get_next_invoice_number(seq_type TEXT)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  prefix_val TEXT;
  pad INTEGER;
BEGIN
  UPDATE invoice_sequences
  SET current_number = current_number + 1
  WHERE id = seq_type
  RETURNING current_number, prefix, padding INTO next_num, prefix_val, pad;

  RETURN prefix_val || LPAD(next_num::TEXT, pad, '0');
END;
$$ LANGUAGE plpgsql;
```

## Seed Data

Insert seed data after creating tables. Generate Claude Code to create comprehensive seed data including:

- 2-3 Indian GST clients (e.g., Nandhini Deluxe Hotel, Maximus OIGA, Godavari Heritage)
- 2 International clients (Dentique Dental Care - USA, Sea Wonders - UAE)
- 1 Non-GST client
- 5-8 projects across these clients (mix of one-time and retainer)
- 10-15 invoices in various statuses (draft, sent, paid, partially_paid, overdue)
- Payment records with TDS and Skydo deductions
- Default expense categories with rules
- Sample transactions from the bank statement format
- 2-3 financial targets

Use realistic data based on the actual invoice examples provided (Nandhini Rs. 65,000 + GST for SEO, Dentique $1,350 for web dev, Sea Wonders AED 4,000 for SEO, Maximus Rs. 50,000 + GST for SEO).
