-- ============================================================
-- WODO Ally - Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'accountant', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  display_name TEXT,
  client_type TEXT NOT NULL CHECK (client_type IN ('indian_gst', 'indian_non_gst', 'international')),
  region TEXT NOT NULL CHECK (region IN ('india', 'usa', 'uae', 'uk', 'other')),
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency IN ('INR', 'USD', 'AED', 'GBP', 'EUR')),
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'India',
  pincode TEXT,
  gstin TEXT,
  tax_number TEXT,
  tax_number_label TEXT,
  signing_authority TEXT,
  designation TEXT,
  billing_emails TEXT[],
  phone TEXT,
  website TEXT,
  notes TEXT,
  health_score INTEGER DEFAULT 50 CHECK (health_score >= 0 AND health_score <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'churned')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;
DROP POLICY IF EXISTS "Admin/Manager can manage clients" ON clients;
CREATE POLICY "Authenticated users can view clients" ON clients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Manager can manage clients" ON clients FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(client_type);

-- 3. CLIENT CONTACTS
CREATE TABLE IF NOT EXISTS client_contacts (
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
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON client_contacts;
DROP POLICY IF EXISTS "Admin/Manager can manage contacts" ON client_contacts;
CREATE POLICY "Authenticated users can view contacts" ON client_contacts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Manager can manage contacts" ON client_contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- 4. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL CHECK (project_type IN (
    'branding', 'ui_ux_design', 'web_development', 'seo', 'google_ads',
    'social_media', 'gmb', 'content_marketing', 'full_service', 'other'
  )),
  engagement_type TEXT NOT NULL CHECK (engagement_type IN ('one_time', 'retainer')),
  total_value NUMERIC(12,2),
  payment_split JSONB,
  retainer_amount NUMERIC(12,2),
  retainer_currency TEXT DEFAULT 'INR',
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
  contract_start_date DATE,
  contract_end_date DATE,
  min_contract_months INTEGER,
  status TEXT NOT NULL DEFAULT 'onboarding' CHECK (status IN (
    'onboarding', 'design_phase', 'development_phase', 'deployment_qa',
    'setup_strategy', 'active_execution', 'maintenance', 'completed',
    'on_hold', 'cancelled'
  )),
  projected_completion_date DATE,
  actual_completion_date DATE,
  timeline_days INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read projects" ON projects;
DROP POLICY IF EXISTS "Admin/Manager write projects" ON projects;
CREATE POLICY "Authenticated read projects" ON projects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Manager write projects" ON projects FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- 5. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE,
  proforma_ref TEXT,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('gst', 'international', 'non_gst', 'proforma')),
  client_id UUID REFERENCES clients(id) NOT NULL,
  project_ids UUID[] DEFAULT '{}',
  currency TEXT NOT NULL DEFAULT 'INR',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount_inr NUMERIC(12,2),
  invoice_date DATE NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled'
  )),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  total_received NUMERIC(12,2) DEFAULT 0,
  total_tds_deducted NUMERIC(12,2) DEFAULT 0,
  total_other_deductions NUMERIC(12,2) DEFAULT 0,
  balance_due NUMERIC(12,2) DEFAULT 0,
  billing_period_start DATE,
  billing_period_end DATE,
  notes TEXT,
  internal_notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read invoices" ON invoices;
DROP POLICY IF EXISTS "Admin/Manager/Accountant write invoices" ON invoices;
CREATE POLICY "Authenticated read invoices" ON invoices FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Manager/Accountant write invoices" ON invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))
);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);

-- 6. INVOICE LINE ITEMS
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read line items" ON invoice_line_items;
DROP POLICY IF EXISTS "Admin/Manager/Accountant write line items" ON invoice_line_items;
CREATE POLICY "Authenticated read line items" ON invoice_line_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Manager/Accountant write line items" ON invoice_line_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))
);

-- 7. INVOICE PAYMENTS
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  payment_date DATE NOT NULL,
  amount_received NUMERIC(12,2) NOT NULL,
  amount_received_inr NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'INR',
  tds_amount NUMERIC(12,2) DEFAULT 0,
  tds_section TEXT,
  skydo_fx_margin NUMERIC(12,2) DEFAULT 0,
  skydo_processing_fee NUMERIC(12,2) DEFAULT 0,
  bank_charges NUMERIC(12,2) DEFAULT 0,
  other_deductions NUMERIC(12,2) DEFAULT 0,
  deduction_notes TEXT,
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'skydo_usd', 'skydo_aed', 'skydo_gbp', 'upi', 'other')),
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read payments" ON invoice_payments;
DROP POLICY IF EXISTS "Admin/Manager/Accountant write payments" ON invoice_payments;
CREATE POLICY "Authenticated read payments" ON invoice_payments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Manager/Accountant write payments" ON invoice_payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))
);

-- 8. CONTRACTS
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  contract_type TEXT NOT NULL CHECK (contract_type IN ('design_development', 'seo_retainer', 'custom')),
  title TEXT NOT NULL,
  contract_data JSONB NOT NULL DEFAULT '{}',
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
DROP POLICY IF EXISTS "Authenticated read contracts" ON contracts;
DROP POLICY IF EXISTS "Admin/Manager write contracts" ON contracts;
CREATE POLICY "Authenticated read contracts" ON contracts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Manager write contracts" ON contracts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- 9. EXPENSE CATEGORIES
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read expense_categories" ON expense_categories;
DROP POLICY IF EXISTS "admin write expense_categories" ON expense_categories;
CREATE POLICY "auth read expense_categories" ON expense_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin write expense_categories" ON expense_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))
);

-- 10. EXPENSE RULES
CREATE TABLE IF NOT EXISTS expense_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES expense_categories(id) ON DELETE CASCADE NOT NULL,
  pattern TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'contains' CHECK (match_type IN ('contains', 'starts_with', 'regex', 'exact')),
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expense_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read expense_rules" ON expense_rules;
DROP POLICY IF EXISTS "admin write expense_rules" ON expense_rules;
CREATE POLICY "auth read expense_rules" ON expense_rules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin write expense_rules" ON expense_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))
);

-- 11. BANK STATEMENTS
CREATE TABLE IF NOT EXISTS bank_statements (
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

ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read bank_statements" ON bank_statements;
DROP POLICY IF EXISTS "admin write bank_statements" ON bank_statements;
CREATE POLICY "auth read bank_statements" ON bank_statements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin write bank_statements" ON bank_statements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))
);

-- 12. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  statement_id UUID REFERENCES bank_statements(id) ON DELETE CASCADE NOT NULL,
  transaction_date DATE NOT NULL,
  value_date DATE,
  particulars TEXT NOT NULL,
  cheque_number TEXT,
  debit NUMERIC(12,2),
  credit NUMERIC(12,2),
  balance NUMERIC(12,2),
  category_id UUID REFERENCES expense_categories(id),
  is_auto_categorized BOOLEAN DEFAULT false,
  is_manually_reviewed BOOLEAN DEFAULT false,
  matched_rule_id UUID REFERENCES expense_rules(id),
  linked_invoice_id UUID REFERENCES invoices(id),
  transaction_type TEXT CHECK (transaction_type IN ('expense', 'income', 'transfer', 'tax', 'loan', 'uncategorized')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read transactions" ON transactions;
DROP POLICY IF EXISTS "admin write transactions" ON transactions;
CREATE POLICY "auth read transactions" ON transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin write transactions" ON transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))
);

-- 13. FINANCIAL TARGETS
CREATE TABLE IF NOT EXISTS financial_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('revenue', 'mrr', 'new_clients', 'expense_reduction', 'custom')),
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  financial_year TEXT NOT NULL,
  month INTEGER,
  quarter INTEGER,
  target_amount NUMERIC(12,2) NOT NULL,
  current_amount NUMERIC(12,2) DEFAULT 0,
  service_type TEXT,
  currency TEXT DEFAULT 'INR',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE financial_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read financial_targets" ON financial_targets;
DROP POLICY IF EXISTS "admin write financial_targets" ON financial_targets;
CREATE POLICY "auth read financial_targets" ON financial_targets FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin write financial_targets" ON financial_targets FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- 14. INVESTOR REPORTS
CREATE TABLE IF NOT EXISTS investor_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  report_month INTEGER NOT NULL,
  report_year INTEGER NOT NULL,
  financial_year TEXT NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent')),
  pdf_url TEXT,
  sent_to TEXT[],
  sent_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE investor_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read investor_reports" ON investor_reports;
DROP POLICY IF EXISTS "admin write investor_reports" ON investor_reports;
CREATE POLICY "auth read investor_reports" ON investor_reports FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin write investor_reports" ON investor_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 15. TDS CERTIFICATES
CREATE TABLE IF NOT EXISTS tds_certificates (
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

ALTER TABLE tds_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read tds_certificates" ON tds_certificates;
DROP POLICY IF EXISTS "admin write tds_certificates" ON tds_certificates;
CREATE POLICY "auth read tds_certificates" ON tds_certificates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin write tds_certificates" ON tds_certificates FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))
);

-- 16. INVOICE SEQUENCES
CREATE TABLE IF NOT EXISTS invoice_sequences (
  id TEXT PRIMARY KEY,
  current_number INTEGER NOT NULL DEFAULT 0,
  prefix TEXT NOT NULL,
  padding INTEGER NOT NULL DEFAULT 5
);

INSERT INTO invoice_sequences (id, current_number, prefix, padding)
VALUES ('gst', 113, 'G', 5), ('non_gst', 202, 'NG', 5)
ON CONFLICT (id) DO NOTHING;

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

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_targets_updated_at BEFORE UPDATE ON financial_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- AUTO-PROFILE TRIGGER (on new auth user signup)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'viewer',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- invoice_sequences RLS (was missing)
-- ============================================================
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read invoice_sequences" ON public.invoice_sequences FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "accountant write invoice_sequences" ON public.invoice_sequences FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin','manager','accountant']))
);

-- ============================================================
-- STORAGE BUCKETS (created via Supabase dashboard/API)
-- invoices (10MB limit, private)
-- contracts (10MB limit, private)
-- bank-statements (50MB limit, private)
-- avatars (2MB limit, public)
-- ============================================================

-- Storage RLS policies
CREATE POLICY "auth read invoices storage" ON storage.objects FOR SELECT USING (bucket_id = 'invoices' AND auth.uid() IS NOT NULL);
CREATE POLICY "accountant write invoices storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'invoices' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin','manager','accountant'])));
CREATE POLICY "accountant delete invoices storage" ON storage.objects FOR DELETE USING (bucket_id = 'invoices' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin','manager','accountant'])));

CREATE POLICY "auth read contracts storage" ON storage.objects FOR SELECT USING (bucket_id = 'contracts' AND auth.uid() IS NOT NULL);
CREATE POLICY "manager write contracts storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'contracts' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin','manager'])));
CREATE POLICY "manager delete contracts storage" ON storage.objects FOR DELETE USING (bucket_id = 'contracts' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin','manager'])));

CREATE POLICY "auth read bank-statements storage" ON storage.objects FOR SELECT USING (bucket_id = 'bank-statements' AND auth.uid() IS NOT NULL);
CREATE POLICY "accountant write bank-statements storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bank-statements' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin','manager','accountant'])));
CREATE POLICY "accountant delete bank-statements storage" ON storage.objects FOR DELETE USING (bucket_id = 'bank-statements' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin','manager','accountant'])));

CREATE POLICY "public read avatars storage" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "auth write avatars storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "own delete avatars storage" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
