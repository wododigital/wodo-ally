-- ============================================================
-- WODO Ally - Seed Data
-- Run AFTER 001_schema.sql
-- ============================================================

-- EXPENSE CATEGORIES
INSERT INTO expense_categories (name, description, is_default, color, sort_order) VALUES
  ('Software & Tools', 'SaaS subscriptions, software licenses', true, '#3b82f6', 1),
  ('Hosting & Infrastructure', 'Server, domain, CDN costs', true, '#8b5cf6', 2),
  ('Freelancer Payments', 'Payments to contractors and freelancers', true, '#ec4899', 3),
  ('Marketing & Ads', 'Google Ads, Meta Ads, promotions', true, '#f97316', 4),
  ('Office & Admin', 'Office supplies, stationery, printing', true, '#22c55e', 5),
  ('Travel & Conveyance', 'Fuel, Uber, travel expenses', true, '#eab308', 6),
  ('Banking & Finance', 'Bank charges, payment gateway fees, TDS', true, '#ef4444', 7),
  ('Professional Services', 'CA fees, legal, consulting', true, '#14b8a6', 8),
  ('Team & HR', 'Salary, incentives, team expenses', true, '#6366f1', 9),
  ('Miscellaneous', 'Uncategorized expenses', true, '#6b7280', 10)
ON CONFLICT (name) DO NOTHING;

-- EXPENSE RULES
INSERT INTO expense_rules (category_id, pattern, match_type, priority)
SELECT id, 'SWIGGY', 'contains', 10 FROM expense_categories WHERE name = 'Office & Admin';
INSERT INTO expense_rules (category_id, pattern, match_type, priority)
SELECT id, 'ZOMATO', 'contains', 10 FROM expense_categories WHERE name = 'Office & Admin';
INSERT INTO expense_rules (category_id, pattern, match_type, priority)
SELECT id, 'GOOGLE', 'contains', 20 FROM expense_categories WHERE name = 'Software & Tools';
INSERT INTO expense_rules (category_id, pattern, match_type, priority)
SELECT id, 'RAZORPAY', 'contains', 20 FROM expense_categories WHERE name = 'Banking & Finance';
INSERT INTO expense_rules (category_id, pattern, match_type, priority)
SELECT id, 'OLA', 'contains', 10 FROM expense_categories WHERE name = 'Travel & Conveyance';
INSERT INTO expense_rules (category_id, pattern, match_type, priority)
SELECT id, 'UBER', 'contains', 10 FROM expense_categories WHERE name = 'Travel & Conveyance';
INSERT INTO expense_rules (category_id, pattern, match_type, priority)
SELECT id, 'AMAZON', 'contains', 10 FROM expense_categories WHERE name = 'Office & Admin';
INSERT INTO expense_rules (category_id, pattern, match_type, priority)
SELECT id, 'DIGITALOCEAN', 'contains', 20 FROM expense_categories WHERE name = 'Hosting & Infrastructure';
INSERT INTO expense_rules (category_id, pattern, match_type, priority)
SELECT id, 'AWS', 'contains', 20 FROM expense_categories WHERE name = 'Hosting & Infrastructure';
INSERT INTO expense_rules (category_id, pattern, match_type, priority)
SELECT id, 'GODADDY', 'contains', 20 FROM expense_categories WHERE name = 'Hosting & Infrastructure';
INSERT INTO expense_rules (category_id, pattern, match_type, priority)
SELECT id, 'SLACK', 'contains', 20 FROM expense_categories WHERE name = 'Software & Tools';
INSERT INTO expense_rules (category_id, pattern, match_type, priority)
SELECT id, 'NOTION', 'contains', 20 FROM expense_categories WHERE name = 'Software & Tools';
INSERT INTO expense_rules (category_id, pattern, match_type, priority)
SELECT id, 'TDS', 'contains', 30 FROM expense_categories WHERE name = 'Banking & Finance';
INSERT INTO expense_rules (category_id, pattern, match_type, priority)
SELECT id, 'INCOME TAX', 'contains', 30 FROM expense_categories WHERE name = 'Banking & Finance';
INSERT INTO expense_rules (category_id, pattern, match_type, priority)
SELECT id, 'GST', 'contains', 25 FROM expense_categories WHERE name = 'Banking & Finance';

-- CLIENTS
INSERT INTO clients (id, company_name, display_name, client_type, region, currency, address, city, state, country, gstin, signing_authority, designation, billing_emails, phone, health_score, status) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Nandhini Deluxe Hotel', 'Nandhini Hotel', 'indian_gst', 'india', 'INR', 'No. 45, Brigade Road, Shivajinagar', 'Bangalore', 'Karnataka', 'India', '29AAACN1234F1ZP', 'Ramesh Kumar', 'Managing Director', ARRAY['accounts@nandhinideluxe.com'], '+91 80 4567 8901', 82, 'active'),
  ('22222222-0000-0000-0000-000000000002', 'Maximus OIGA', 'Maximus', 'indian_gst', 'india', 'INR', 'Unit 4B, Brigade Tech Park, Whitefield', 'Bangalore', 'Karnataka', 'India', '29AABCM5678G1ZK', 'Priya Sharma', 'CEO', ARRAY['finance@maximusoiga.com'], '+91 80 2345 6789', 75, 'active'),
  ('33333333-0000-0000-0000-000000000003', 'Godavari Heritage Hotels', 'Godavari Heritage', 'indian_gst', 'india', 'INR', 'Survey No. 123, Yelahanka New Town', 'Bangalore', 'Karnataka', 'India', '29AACCG9012H1ZX', 'Venkat Rao', 'Director', ARRAY['billing@godavariheritage.com'], '+91 80 3456 7890', 68, 'active'),
  ('44444444-0000-0000-0000-000000000004', 'Dentique Dental Care', 'Dentique', 'international', 'usa', 'USD', '2847 Oak Street, Suite 201', 'Houston', 'Texas', 'USA', NULL, 'Dr. Sarah Mitchell', 'Owner', ARRAY['sarah@dentiquedental.com'], '+1 713 555 0142', 91, 'active'),
  ('55555555-0000-0000-0000-000000000005', 'Sea Wonders Tourism', 'Sea Wonders', 'international', 'uae', 'AED', 'Office 1204, Al Moosa Tower 2, Sheikh Zayed Road', 'Dubai', NULL, 'UAE', NULL, 'Ahmed Al Rashidi', 'CEO', ARRAY['ahmed@seawonders.ae'], '+971 4 321 9876', 88, 'active'),
  ('66666666-0000-0000-0000-000000000006', 'Raj Enterprises', 'Raj Enterprises', 'indian_non_gst', 'india', 'INR', '12, MG Road, Jayanagar 4th Block', 'Bangalore', 'Karnataka', 'India', NULL, 'Rajesh Patel', 'Proprietor', ARRAY['rajesh@rajenterprises.in'], '+91 98765 43210', 55, 'active')
ON CONFLICT (id) DO NOTHING;

-- CLIENT CONTACTS
INSERT INTO client_contacts (client_id, name, email, phone, designation, is_primary, is_billing_contact) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Ramesh Kumar', 'ramesh@nandhinideluxe.com', '+91 98451 23456', 'Managing Director', true, true),
  ('11111111-0000-0000-0000-000000000001', 'Sunita Iyer', 'accounts@nandhinideluxe.com', '+91 98451 23457', 'Accounts Manager', false, true),
  ('22222222-0000-0000-0000-000000000002', 'Priya Sharma', 'priya@maximusoiga.com', '+91 99001 23456', 'CEO', true, true),
  ('33333333-0000-0000-0000-000000000003', 'Venkat Rao', 'venkat@godavariheritage.com', '+91 97891 23456', 'Director', true, true),
  ('44444444-0000-0000-0000-000000000004', 'Dr. Sarah Mitchell', 'sarah@dentiquedental.com', '+1 713 555 0142', 'Owner', true, true),
  ('55555555-0000-0000-0000-000000000005', 'Ahmed Al Rashidi', 'ahmed@seawonders.ae', '+971 50 321 9876', 'CEO', true, true),
  ('66666666-0000-0000-0000-000000000006', 'Rajesh Patel', 'rajesh@rajenterprises.in', '+91 98765 43210', 'Proprietor', true, true);

-- PROJECTS
INSERT INTO projects (id, client_id, name, description, project_type, engagement_type, total_value, retainer_amount, retainer_currency, billing_cycle, contract_start_date, contract_end_date, min_contract_months, status, timeline_days) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'SEO & Google My Business', 'Monthly SEO management and GMB optimization for Nandhini Hotel', 'seo', 'retainer', NULL, 65000.00, 'INR', 'monthly', '2025-04-01', '2026-03-31', 12, 'active_execution', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 'SEO Retainer - Maximus', 'Monthly SEO for Maximus OIGA insurance platform', 'seo', 'retainer', NULL, 50000.00, 'INR', 'monthly', '2025-06-01', '2026-05-31', 12, 'active_execution', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000004', 'Website Development - Dentique', 'Complete website redesign and development for dental clinic', 'web_development', 'one_time', 1350.00, NULL, NULL, NULL, '2025-11-01', NULL, NULL, 'completed', 60),
  ('aaaaaaaa-0000-0000-0000-000000000004', '55555555-0000-0000-0000-000000000005', 'SEO & Digital Marketing - Sea Wonders', 'Monthly SEO and content marketing for tourism company', 'seo', 'retainer', NULL, 4000.00, 'AED', 'monthly', '2025-08-01', '2026-07-31', 12, 'active_execution', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000003', 'Brand Identity - Godavari', 'Logo design and complete brand identity package', 'branding', 'one_time', 85000.00, NULL, NULL, NULL, '2026-01-15', NULL, NULL, 'design_phase', 45),
  ('aaaaaaaa-0000-0000-0000-000000000006', '66666666-0000-0000-0000-000000000006', 'Website - Raj Enterprises', 'Business website development', 'web_development', 'one_time', 35000.00, NULL, NULL, NULL, '2026-02-01', NULL, NULL, 'development_phase', 30)
ON CONFLICT (id) DO NOTHING;

-- INVOICES
INSERT INTO invoices (id, invoice_number, invoice_type, client_id, project_ids, currency, subtotal, tax_rate, tax_amount, total_amount, total_amount_inr, invoice_date, due_date, status, total_received, balance_due, billing_period_start, billing_period_end) VALUES
  -- Nandhini Hotel - GST invoices (monthly SEO)
  ('bbbbbbbb-0000-0000-0000-000000000001', 'G00110', 'gst', '11111111-0000-0000-0000-000000000001', ARRAY['aaaaaaaa-0000-0000-0000-000000000001']::UUID[], 'INR', 65000.00, 18, 11700.00, 76700.00, 76700.00, '2026-02-01', '2026-02-08', 'paid', 76700.00, 0.00, '2026-02-01', '2026-02-28'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'G00111', 'gst', '11111111-0000-0000-0000-000000000001', ARRAY['aaaaaaaa-0000-0000-0000-000000000001']::UUID[], 'INR', 65000.00, 18, 11700.00, 76700.00, 76700.00, '2026-03-01', '2026-03-08', 'sent', 0.00, 76700.00, '2026-03-01', '2026-03-31'),
  -- Maximus - GST invoice
  ('bbbbbbbb-0000-0000-0000-000000000003', 'G00112', 'gst', '22222222-0000-0000-0000-000000000002', ARRAY['aaaaaaaa-0000-0000-0000-000000000002']::UUID[], 'INR', 50000.00, 18, 9000.00, 59000.00, 59000.00, '2026-02-01', '2026-02-08', 'paid', 53500.00, 0.00, '2026-02-01', '2026-02-28'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'G00113', 'gst', '22222222-0000-0000-0000-000000000002', ARRAY['aaaaaaaa-0000-0000-0000-000000000002']::UUID[], 'INR', 50000.00, 18, 9000.00, 59000.00, 59000.00, '2026-03-01', '2026-03-08', 'draft', 0.00, 59000.00, '2026-03-01', '2026-03-31'),
  -- Dentique - International (USD)
  ('bbbbbbbb-0000-0000-0000-000000000005', 'G00108', 'international', '44444444-0000-0000-0000-000000000004', ARRAY['aaaaaaaa-0000-0000-0000-000000000003']::UUID[], 'USD', 1350.00, 0, 0.00, 1350.00, 115830.00, '2025-12-01', '2025-12-15', 'paid', 1350.00, 0.00, NULL, NULL),
  -- Sea Wonders - International (AED)
  ('bbbbbbbb-0000-0000-0000-000000000006', 'G00109', 'international', '55555555-0000-0000-0000-000000000005', ARRAY['aaaaaaaa-0000-0000-0000-000000000004']::UUID[], 'AED', 4000.00, 0, 0.00, 4000.00, 89600.00, '2026-02-01', '2026-02-15', 'paid', 4000.00, 0.00, '2026-02-01', '2026-02-28'),
  -- Raj Enterprises - Non-GST
  ('bbbbbbbb-0000-0000-0000-000000000007', 'NG00201', 'non_gst', '66666666-0000-0000-0000-000000000006', ARRAY['aaaaaaaa-0000-0000-0000-000000000006']::UUID[], 'INR', 17500.00, 0, 0.00, 17500.00, 17500.00, '2026-02-15', '2026-02-22', 'overdue', 0.00, 17500.00, NULL, NULL),
  -- Godavari - Pro forma
  ('bbbbbbbb-0000-0000-0000-000000000008', NULL, 'proforma', '33333333-0000-0000-0000-000000000003', ARRAY['aaaaaaaa-0000-0000-0000-000000000005']::UUID[], 'INR', 85000.00, 18, 15300.00, 100300.00, 100300.00, '2026-01-15', '2026-01-22', 'sent', 0.00, 100300.00, NULL, NULL),
  -- Partially paid example
  ('bbbbbbbb-0000-0000-0000-000000000009', 'G00107', 'gst', '11111111-0000-0000-0000-000000000001', ARRAY['aaaaaaaa-0000-0000-0000-000000000001']::UUID[], 'INR', 65000.00, 18, 11700.00, 76700.00, 76700.00, '2026-01-01', '2026-01-08', 'paid', 76700.00, 0.00, '2026-01-01', '2026-01-31')
ON CONFLICT (id) DO NOTHING;

-- Set proforma_ref for the pro forma invoice
UPDATE invoices SET proforma_ref = 'PF-20260115-001' WHERE id = 'bbbbbbbb-0000-0000-0000-000000000008';

-- INVOICE LINE ITEMS
INSERT INTO invoice_line_items (invoice_id, description, amount, quantity, sort_order) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'SEO Management - Feb 2026 (Keyword research, on-page optimization, link building)', 55000.00, 1, 1),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Google My Business Management - Feb 2026', 10000.00, 1, 2),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'SEO Management - Mar 2026 (Keyword research, on-page optimization, link building)', 55000.00, 1, 1),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Google My Business Management - Mar 2026', 10000.00, 1, 2),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'SEO Management - Feb 2026', 50000.00, 1, 1),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'SEO Management - Mar 2026', 50000.00, 1, 1),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'Website Design & Development - Dentique Dental Care', 1350.00, 1, 1),
  ('bbbbbbbb-0000-0000-0000-000000000006', 'SEO Management - Feb 2026', 3000.00, 1, 1),
  ('bbbbbbbb-0000-0000-0000-000000000006', 'Content Writing (4 articles)', 1000.00, 1, 2),
  ('bbbbbbbb-0000-0000-0000-000000000007', 'Website Development - Phase 1 (50% advance)', 17500.00, 1, 1),
  ('bbbbbbbb-0000-0000-0000-000000000008', 'Brand Identity Package - Logo, Brand Guidelines, Business Cards, Social Media Kit', 85000.00, 1, 1),
  ('bbbbbbbb-0000-0000-0000-000000000009', 'SEO Management - Jan 2026', 55000.00, 1, 1),
  ('bbbbbbbb-0000-0000-0000-000000000009', 'Google My Business Management - Jan 2026', 10000.00, 1, 2);

-- INVOICE PAYMENTS
INSERT INTO invoice_payments (invoice_id, payment_date, amount_received, amount_received_inr, currency, tds_amount, tds_section, payment_method, reference_number, notes) VALUES
  -- Nandhini - Feb invoice paid full
  ('bbbbbbbb-0000-0000-0000-000000000001', '2026-02-10', 76700.00, 76700.00, 'INR', 0, NULL, 'bank_transfer', 'NEFT2026021001234', 'Full payment received'),
  -- Maximus - Feb invoice paid with TDS deduction (194J)
  ('bbbbbbbb-0000-0000-0000-000000000003', '2026-02-09', 59000.00, 59000.00, 'INR', 5500.00, '194J', 'bank_transfer', 'NEFT2026020901234', 'TDS @10% deducted by client on base amount'),
  -- Dentique - USD payment via Skydo
  ('bbbbbbbb-0000-0000-0000-000000000005', '2025-12-18', 1350.00, 115830.00, 'USD', 0, NULL, 'skydo_usd', 'SKYDO-DEC-001', 'USD payment, INR credited after Skydo conversion'),
  -- Sea Wonders - AED payment via Skydo
  ('bbbbbbbb-0000-0000-0000-000000000006', '2026-02-18', 4000.00, 89600.00, 'AED', 0, NULL, 'skydo_aed', 'SKYDO-FEB-001', 'AED payment via Skydo'),
  -- Nandhini - Jan invoice paid
  ('bbbbbbbb-0000-0000-0000-000000000009', '2026-01-10', 76700.00, 76700.00, 'INR', 0, NULL, 'bank_transfer', 'NEFT2026011001234', 'Full payment');

-- FINANCIAL TARGETS
INSERT INTO financial_targets (title, target_type, period_type, financial_year, target_amount, current_amount, currency, notes) VALUES
  ('Annual Revenue Target FY 2025-26', 'revenue', 'annual', '2025-26', 6000000.00, 3845000.00, 'INR', 'Target set in April 2025 board meeting'),
  ('Monthly MRR Target - Q4', 'mrr', 'quarterly', '2025-26', 500000.00, 385000.00, 'INR', 'Q4 retainer revenue target'),
  ('New Clients This Quarter', 'new_clients', 'quarterly', '2025-26', 5.00, 2.00, 'INR', 'Target 5 new clients in Q4 FY26');
