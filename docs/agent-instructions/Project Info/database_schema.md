# WODO Ally - Complete Database Schema & Setup

**Last Updated:** 2026-03-04
**Environment:** Supabase (PostgreSQL 15)
**Project Ref:** oaujoosmbgcgacosqlhe
**Supabase URL:** https://oaujoosmbgcgacosqlhe.supabase.co
**Region:** ap-south-1 (Mumbai)
**Schema:** public

---

## Quick Reference

| Metric | Count |
|---|---|
| Real Tables | 19 |
| SQL Views | 9 |
| Migrations Applied | 12 |
| Storage Buckets | 4 (+ documents) |
| Total RLS Policies | 40+ (tables + storage) |

---

## Table of Contents

- [Tables](#tables)
- [Views](#views)
- [Functions](#functions)
- [Triggers](#triggers)
- [Indexes](#indexes)
- [RLS Policies](#rls-policies)
- [Storage Buckets](#storage-buckets)
- [Relationships](#relationships)
- [Migration History](#migration-history)
- [Query Examples](#query-examples)
- [Important Notes](#important-notes)

---

## Tables

### profiles

**Description:** Extends Supabase `auth.users`. One profile per authenticated user. Auto-created by `on_auth_user_created` trigger on signup.
**Row Count:** 1

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | - | PRIMARY KEY, FK -> auth.users(id) ON DELETE CASCADE |
| 2 | `full_name` | text | NO | - | - |
| 3 | `email` | text | NO | - | - |
| 4 | `role` | text | NO | `'viewer'` | CHECK IN ('admin', 'manager', 'accountant', 'viewer') |
| 5 | `avatar_url` | text | YES | null | - |
| 6 | `created_at` | timestamptz | YES | `now()` | - |
| 7 | `updated_at` | timestamptz | YES | `now()` | Auto-updated by trigger |

**RLS:** Enabled - see [RLS Policies](#rls-policies)

**Trigger:** `update_profiles_updated_at` - BEFORE UPDATE sets `updated_at = now()`

---

### clients

**Description:** Core CRM table. Each row is a client company. Supports Indian GST, Indian non-GST, and international client types.
**Row Count:** 8

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `company_name` | text | NO | - | Legal company name |
| 3 | `display_name` | text | YES | null | Short display name |
| 4 | `client_type` | text | NO | - | CHECK IN ('indian_gst', 'indian_non_gst', 'international') |
| 5 | `region` | text | NO | - | CHECK IN ('india', 'usa', 'uae', 'uk', 'other') |
| 6 | `currency` | text | NO | `'INR'` | CHECK IN ('INR', 'USD', 'AED', 'GBP', 'EUR') |
| 7 | `address` | text | YES | null | - |
| 8 | `city` | text | YES | null | - |
| 9 | `state` | text | YES | null | - |
| 10 | `country` | text | NO | `'India'` | - |
| 11 | `pincode` | text | YES | null | - |
| 12 | `gstin` | text | YES | null | Indian GST number (required for indian_gst type) |
| 13 | `tax_number` | text | YES | null | International tax number |
| 14 | `tax_number_label` | text | YES | null | Label for tax_number (e.g. 'EIN', 'VAT') |
| 15 | `signing_authority` | text | YES | null | Authorized signatory name |
| 16 | `designation` | text | YES | null | Signing authority designation |
| 17 | `billing_emails` | text[] | YES | null | Array of billing email addresses |
| 18 | `phone` | text | YES | null | - |
| 19 | `website` | text | YES | null | - |
| 20 | `notes` | text | YES | null | Internal notes |
| 21 | `health_score` | integer | YES | `50` | CHECK (0-100). Computed field, manual override |
| 22 | `status` | text | NO | `'active'` | CHECK IN ('active', 'inactive', 'churned', 'closed') |
| 23 | `avg_days_to_pay` | numeric(5,1) | YES | null | Average days to receive payment. Added migration 002 |
| 24 | `on_time_payment_pct` | integer | YES | null | CHECK (0-100). Added migration 002 |
| 25 | `billing_day` | smallint | YES | null | CHECK (1-28). Day of month for retainer invoice generation. Added migration 002 |
| 26 | `payment_terms_days` | smallint | YES | `7` | CHECK (1-90). NET payment terms for cash flow forecasting. Added migration 003 |
| 27 | `created_at` | timestamptz | YES | `now()` | - |
| 28 | `updated_at` | timestamptz | YES | `now()` | Auto-updated by trigger |
| 29 | `created_by` | uuid | YES | null | FK -> profiles(id) |

**Indexes:**
- `idx_clients_status` ON (`status`)
- `idx_clients_type` ON (`client_type`)

**Trigger:** `update_clients_updated_at` - BEFORE UPDATE sets `updated_at = now()`

---

### client_contacts

**Description:** Contact persons for each client. A client can have multiple contacts; one can be the primary and/or billing contact.
**Row Count:** 9

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `client_id` | uuid | NO | - | FK -> clients(id) ON DELETE CASCADE |
| 3 | `name` | text | NO | - | Full name |
| 4 | `email` | text | NO | - | - |
| 5 | `phone` | text | YES | null | - |
| 6 | `designation` | text | YES | null | Job title |
| 7 | `is_primary` | boolean | YES | `false` | Primary contact flag |
| 8 | `is_billing_contact` | boolean | YES | `false` | Receives invoices |
| 9 | `created_at` | timestamptz | YES | `now()` | - |

---

### projects

**Description:** Projects linked to clients. Supports one-time and retainer engagement types.
**Row Count:** 8

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `client_id` | uuid | NO | - | FK -> clients(id) ON DELETE CASCADE |
| 3 | `name` | text | NO | - | - |
| 4 | `description` | text | YES | null | - |
| 5 | `project_type` | text | NO | - | CHECK IN ('branding', 'ui_ux_design', 'web_development', 'seo', 'google_ads', 'social_media', 'gmb', 'content_marketing', 'full_service', 'other') |
| 6 | `engagement_type` | text | NO | - | CHECK IN ('one_time', 'retainer') |
| 7 | `total_value` | numeric(12,2) | YES | null | Total project value (one-time projects) |
| 8 | `payment_split` | jsonb | YES | null | Milestone payment split configuration |
| 9 | `retainer_amount` | numeric(12,2) | YES | null | Monthly retainer fee |
| 10 | `retainer_currency` | text | YES | `'INR'` | Currency for retainer |
| 11 | `billing_cycle` | text | YES | null | CHECK IN ('monthly', 'quarterly', 'annual') |
| 12 | `contract_start_date` | date | YES | null | - |
| 13 | `contract_end_date` | date | YES | null | - |
| 14 | `min_contract_months` | integer | YES | null | Minimum commitment in months |
| 15 | `status` | text | NO | `'onboarding'` | CHECK IN ('onboarding', 'design_phase', 'development_phase', 'deployment_qa', 'setup_strategy', 'active_execution', 'maintenance', 'completed', 'on_hold', 'cancelled') |
| 16 | `projected_completion_date` | date | YES | null | - |
| 17 | `actual_completion_date` | date | YES | null | - |
| 18 | `timeline_days` | integer | YES | null | Estimated duration in days |
| 19 | `progress_pct` | integer | YES | `0` | CHECK (0-100). Manual progress tracker. Added migration 002 |
| 20 | `service_id` | uuid | YES | null | FK -> services(id) ON DELETE SET NULL. Added migration 005 |
| 21 | `notes` | text | YES | null | - |
| 22 | `created_at` | timestamptz | YES | `now()` | - |
| 23 | `updated_at` | timestamptz | YES | `now()` | Auto-updated by trigger |
| 24 | `created_by` | uuid | YES | null | FK -> profiles(id) |

**Indexes:**
- `idx_projects_client` ON (`client_id`)
- `idx_projects_status` ON (`status`)
- `idx_projects_service` ON (`service_id`)

**Trigger:** `update_projects_updated_at` - BEFORE UPDATE sets `updated_at = now()`

---

### invoices

**Description:** Core billing table. Supports GST, non-GST, international, and proforma invoice types. Links to multiple projects via array field.
**Row Count:** 9

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `invoice_number` | text | YES | null | UNIQUE. Auto-generated via `get_next_invoice_number()` |
| 3 | `proforma_ref` | text | YES | null | Proforma reference number |
| 4 | `invoice_type` | text | NO | - | CHECK IN ('gst', 'international', 'non_gst', 'proforma') |
| 5 | `client_id` | uuid | NO | - | FK -> clients(id) |
| 6 | `project_ids` | uuid[] | YES | `'{}'` | Array of project UUIDs (NOT a FK - denormalized) |
| 7 | `currency` | text | NO | `'INR'` | - |
| 8 | `subtotal` | numeric(12,2) | NO | `0` | Before tax |
| 9 | `tax_rate` | numeric(5,2) | YES | `0` | GST rate (18 for standard) |
| 10 | `tax_amount` | numeric(12,2) | YES | `0` | Computed tax |
| 11 | `total_amount` | numeric(12,2) | NO | `0` | subtotal + tax_amount |
| 12 | `total_amount_inr` | numeric(12,2) | YES | null | INR equivalent for forex invoices |
| 13 | `invoice_date` | date | NO | - | Date of issue |
| 14 | `due_date` | date | YES | null | Payment due date |
| 15 | `status` | text | NO | `'draft'` | CHECK IN ('draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled', 'archived') |
| 16 | `sent_at` | timestamptz | YES | null | Timestamp when sent to client |
| 17 | `viewed_at` | timestamptz | YES | null | Timestamp when first viewed |
| 18 | `paid_at` | timestamptz | YES | null | Timestamp when fully paid |
| 19 | `cancelled_at` | timestamptz | YES | null | - |
| 20 | `total_received` | numeric(12,2) | YES | `0` | Sum of all invoice_payments |
| 21 | `total_tds_deducted` | numeric(12,2) | YES | `0` | TDS deducted by client |
| 22 | `total_other_deductions` | numeric(12,2) | YES | `0` | Other deductions |
| 23 | `balance_due` | numeric(12,2) | YES | `0` | total_amount - total_received |
| 24 | `billing_period_start` | date | YES | null | For retainer invoices |
| 25 | `billing_period_end` | date | YES | null | For retainer invoices |
| 26 | `notes` | text | YES | null | Notes visible on invoice |
| 27 | `internal_notes` | text | YES | null | Internal only notes |
| 28 | `pdf_url` | text | YES | null | Storage URL of generated PDF |
| 29 | `created_at` | timestamptz | YES | `now()` | - |
| 30 | `updated_at` | timestamptz | YES | `now()` | Auto-updated by trigger |
| 31 | `created_by` | uuid | YES | null | FK -> profiles(id) |

**Indexes:**
- `idx_invoices_client` ON (`client_id`)
- `idx_invoices_status` ON (`status`)
- `idx_invoices_type` ON (`invoice_type`)
- `idx_invoices_date` ON (`invoice_date`)

**Trigger:** `update_invoices_updated_at` - BEFORE UPDATE sets `updated_at = now()`

**Invoice Status Flow:**
```
draft --> sent --> viewed --> paid
                          --> partially_paid --> paid
      --> cancelled
      --> archived  (expired proformas)
overdue (set when due_date passes on sent invoices)
```

---

### invoice_line_items

**Description:** Individual line items on an invoice. Optionally linked to a service catalogue entry.
**Row Count:** 13

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `invoice_id` | uuid | NO | - | FK -> invoices(id) ON DELETE CASCADE |
| 3 | `description` | text | NO | - | Line item description |
| 4 | `amount` | numeric(12,2) | NO | - | Unit price |
| 5 | `quantity` | integer | YES | `1` | - |
| 6 | `sort_order` | integer | YES | `0` | Display order |
| 7 | `service_id` | uuid | YES | null | FK -> services(id) ON DELETE SET NULL. Added migration 005 |
| 8 | `created_at` | timestamptz | YES | `now()` | - |

**Indexes:**
- `idx_invoice_line_items_service` ON (`service_id`)

---

### invoice_payments

**Description:** Payment records against an invoice. An invoice can have multiple partial payments. Tracks TDS deductions and multi-currency payments (Skydo for USD/AED/GBP).
**Row Count:** 8

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `invoice_id` | uuid | NO | - | FK -> invoices(id) ON DELETE CASCADE |
| 3 | `payment_date` | date | NO | - | - |
| 4 | `amount_received` | numeric(12,2) | NO | - | In invoice currency |
| 5 | `amount_received_inr` | numeric(12,2) | YES | null | INR equivalent (for forex invoices) |
| 6 | `currency` | text | NO | `'INR'` | - |
| 7 | `tds_amount` | numeric(12,2) | YES | `0` | TDS deducted by client |
| 8 | `tds_section` | text | YES | null | TDS section code e.g. '194J', '194C' |
| 9 | `skydo_fx_margin` | numeric(12,2) | YES | `0` | Skydo FX margin fee |
| 10 | `skydo_processing_fee` | numeric(12,2) | YES | `0` | Skydo processing fee |
| 11 | `bank_charges` | numeric(12,2) | YES | `0` | Bank transfer charges |
| 12 | `other_deductions` | numeric(12,2) | YES | `0` | Miscellaneous deductions |
| 13 | `deduction_notes` | text | YES | null | Notes on deductions |
| 14 | `payment_method` | text | YES | null | CHECK IN ('bank_transfer', 'skydo_usd', 'skydo_aed', 'skydo_gbp', 'upi', 'other') |
| 15 | `reference_number` | text | YES | null | NEFT/IMPS/wire transfer reference |
| 16 | `notes` | text | YES | null | - |
| 17 | `created_at` | timestamptz | YES | `now()` | - |
| 18 | `created_by` | uuid | YES | null | FK -> profiles(id) |

---

### invoice_sequences

**Description:** Auto-incrementing sequences for invoice number generation. Separate sequence per invoice type prefix.
**Row Count:** 2

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | text | NO | - | PRIMARY KEY. Values: 'gst', 'non_gst' |
| 2 | `current_number` | integer | NO | `0` | Last issued number |
| 3 | `prefix` | text | NO | - | Invoice number prefix ('G' for GST, 'NG' for non-GST) |
| 4 | `padding` | integer | NO | `5` | Zero-padding digit width |

**Seeded Data:**
- `('gst', 113, 'G', 5)` - next GST invoice: G00114
- `('non_gst', 202, 'NG', 5)` - next non-GST invoice: NG00203

---

### invoice_email_activity

**Description:** Audit log for invoice-related emails. Tracks sent, bounced, and opened events per recipient.
**Row Count:** 0

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `invoice_id` | uuid | NO | - | FK -> invoices(id) ON DELETE CASCADE |
| 3 | `action_type` | text | NO | - | CHECK IN ('sent', 'bounced', 'opened') |
| 4 | `email_recipient` | text | NO | - | Recipient email address |
| 5 | `email_template` | text | NO | - | CHECK IN ('invoice', 'reminder', 'followup') |
| 6 | `sent_at` | timestamptz | YES | `now()` | When the email was sent |
| 7 | `resent_count` | integer | YES | `0` | Number of times resent |
| 8 | `created_at` | timestamptz | YES | `now()` | - |
| 9 | `created_by` | uuid | YES | null | FK -> auth.users(id) |

**Indexes:**
- `idx_invoice_email_activity_invoice_id` ON (`invoice_id`)
- `idx_invoice_email_activity_sent_at` ON (`sent_at`)

---

### scheduled_invoices

**Description:** Queue of upcoming invoices to be generated for retainer clients. Populated based on client.billing_day. Also used for one-time milestone invoices.
**Row Count:** 10

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `client_id` | uuid | NO | - | FK -> clients(id) ON DELETE CASCADE |
| 3 | `project_id` | uuid | YES | null | FK -> projects(id) ON DELETE SET NULL |
| 4 | `billing_month` | text | NO | - | Format: 'YYYY-MM' e.g. '2026-04' |
| 5 | `scheduled_date` | date | NO | - | Date when invoice should be created |
| 6 | `expected_payment_date` | date | YES | null | Predicted receipt = scheduled_date + client.payment_terms_days |
| 7 | `amount` | numeric(12,2) | NO | - | Invoice amount |
| 8 | `currency` | text | NO | `'INR'` | - |
| 9 | `description` | text | YES | null | e.g. 'SEO Retainer - April 2026' |
| 10 | `status` | text | NO | `'pending'` | CHECK IN ('pending', 'generated', 'skipped', 'cancelled') |
| 11 | `invoice_id` | uuid | YES | null | FK -> invoices(id) ON DELETE SET NULL. Set when generated |
| 12 | `invoice_type` | text | NO | `'retainer'` | CHECK IN ('retainer', 'milestone', 'one_time') |
| 13 | `notes` | text | YES | null | - |
| 14 | `created_at` | timestamptz | NO | `now()` | - |
| 15 | `updated_at` | timestamptz | NO | `now()` | Auto-updated by trigger |

**Indexes:**
- `idx_scheduled_invoices_client` ON (`client_id`)
- `idx_scheduled_invoices_date` ON (`scheduled_date`)
- `idx_scheduled_invoices_status` ON (`status`)
- `idx_scheduled_invoices_billing_month` ON (`billing_month`)
- `idx_scheduled_invoices_project` ON (`project_id`)

**Trigger:** `set_scheduled_invoices_updated_at` - BEFORE UPDATE sets `updated_at = now()`

---

### contracts

**Description:** Client contracts. Stores contract content as JSONB (flexible schema), links to a generated PDF.
**Row Count:** 0

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `client_id` | uuid | NO | - | FK -> clients(id) |
| 3 | `project_id` | uuid | YES | null | FK -> projects(id) |
| 4 | `contract_type` | text | NO | - | CHECK IN ('design_development', 'seo_retainer', 'custom') |
| 5 | `title` | text | NO | - | Contract title |
| 6 | `contract_data` | jsonb | NO | `'{}'` | Contract field values (flexible JSON payload) |
| 7 | `status` | text | NO | `'draft'` | CHECK IN ('draft', 'sent', 'signed', 'active', 'completed', 'terminated') |
| 8 | `contract_date` | date | YES | null | Contract creation date |
| 9 | `signed_date` | date | YES | null | Date signed by client |
| 10 | `pdf_url` | text | YES | null | Storage URL of generated PDF |
| 11 | `notes` | text | YES | null | - |
| 12 | `created_at` | timestamptz | YES | `now()` | - |
| 13 | `updated_at` | timestamptz | YES | `now()` | Auto-updated by trigger |
| 14 | `created_by` | uuid | YES | null | FK -> profiles(id) |

**Trigger:** `update_contracts_updated_at` - BEFORE UPDATE sets `updated_at = now()`

---

### services

**Description:** Service catalogue. Each service represents a billable offering (SEO, Web Dev, Branding, etc.). Used to link projects and invoice line items.
**Row Count:** 10

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `name` | text | NO | - | Service name |
| 3 | `description` | text | YES | null | - |
| 4 | `color` | text | NO | `'#fd7e14'` | Hex color for UI display |
| 5 | `is_active` | boolean | NO | `true` | - |
| 6 | `sort_order` | integer | NO | `0` | Display order |
| 7 | `hsn_code` | text | YES | null | GST HSN/SAC code. Added migration 011 |
| 8 | `created_at` | timestamptz | YES | `now()` | - |
| 9 | `updated_at` | timestamptz | YES | `now()` | Auto-updated by trigger |

**Seeded Services (10):**

| Name | Color | HSN Code |
|---|---|---|
| SEO | #fd7e14 | 998313 |
| Google My Business | #f59e0b | 998313 |
| Web Development | #3b82f6 | 998314 |
| Branding | #8b5cf6 | 998314 |
| Google Ads | #22c55e | 998313 |
| Social Media | #ec4899 | 998313 |
| UI/UX Design | #06b6d4 | 998314 |
| Content Marketing | #84cc16 | 998313 |
| Digital PR | #f97316 | 998313 |
| Full Service | #6366f1 | 998313 |

**Trigger:** `set_services_updated_at` - BEFORE UPDATE sets `updated_at = now()`

---

### expense_categories

**Description:** Categories for classifying bank transactions and expenses. Used by auto-categorization rules.
**Row Count:** 10

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `name` | text | NO | - | UNIQUE |
| 3 | `description` | text | YES | null | - |
| 4 | `is_default` | boolean | YES | `false` | Seeded system defaults |
| 5 | `color` | text | YES | null | Hex color for UI |
| 6 | `sort_order` | integer | YES | `0` | Display order |
| 7 | `created_at` | timestamptz | YES | `now()` | - |

**Seeded Categories:** Software & Tools, Hosting & Infrastructure, Freelancer Payments, Marketing & Ads, Office & Admin, Travel & Conveyance, Banking & Finance, Professional Services, Team & HR, Miscellaneous

---

### expense_rules

**Description:** Pattern-matching rules for auto-categorizing bank transactions. Higher priority rules are evaluated first.
**Row Count:** 15

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `category_id` | uuid | NO | - | FK -> expense_categories(id) ON DELETE CASCADE |
| 3 | `pattern` | text | NO | - | String to match against transactions.particulars |
| 4 | `match_type` | text | NO | `'contains'` | CHECK IN ('contains', 'starts_with', 'regex', 'exact') |
| 5 | `priority` | integer | YES | `0` | Higher = evaluated first |
| 6 | `is_active` | boolean | YES | `true` | - |
| 7 | `created_at` | timestamptz | YES | `now()` | - |
| 8 | `updated_at` | timestamptz | YES | `now()` | - |

**Seeded Rules (15 patterns):** SWIGGY, ZOMATO, GOOGLE, RAZORPAY, OLA, UBER, AMAZON, DIGITALOCEAN, AWS, GODADDY, SLACK, NOTION, TDS, INCOME TAX, GST

---

### bank_statements

**Description:** Uploaded bank statement files. Each statement generates many transaction rows. Currently only IDFC FIRST bank.
**Row Count:** 1

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `filename` | text | NO | - | Original uploaded filename |
| 3 | `bank_name` | text | NO | `'IDFC FIRST'` | Bank name |
| 4 | `account_number` | text | YES | null | Masked account number |
| 5 | `statement_period_start` | date | YES | null | - |
| 6 | `statement_period_end` | date | YES | null | - |
| 7 | `opening_balance` | numeric(12,2) | YES | null | - |
| 8 | `closing_balance` | numeric(12,2) | YES | null | - |
| 9 | `total_debit` | numeric(12,2) | YES | null | - |
| 10 | `total_credit` | numeric(12,2) | YES | null | - |
| 11 | `transaction_count` | integer | YES | `0` | Number of rows imported |
| 12 | `status` | text | NO | `'processing'` | CHECK IN ('processing', 'completed', 'error') |
| 13 | `uploaded_at` | timestamptz | YES | `now()` | - |
| 14 | `uploaded_by` | uuid | YES | null | FK -> profiles(id) |

---

### transactions

**Description:** Individual bank transactions imported from bank statements. Supports auto-categorization via expense_rules, manual review, and linking to invoices/projects.
**Row Count:** 81

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `statement_id` | uuid | NO | - | FK -> bank_statements(id) ON DELETE CASCADE |
| 3 | `transaction_date` | date | NO | - | - |
| 4 | `value_date` | date | YES | null | Bank value date |
| 5 | `particulars` | text | NO | - | Transaction description from bank statement |
| 6 | `cheque_number` | text | YES | null | - |
| 7 | `debit` | numeric(12,2) | YES | null | Outflow amount (NULL for credit transactions) |
| 8 | `credit` | numeric(12,2) | YES | null | Inflow amount (NULL for debit transactions) |
| 9 | `balance` | numeric(12,2) | YES | null | Running balance after this transaction |
| 10 | `category_id` | uuid | YES | null | FK -> expense_categories(id) |
| 11 | `is_auto_categorized` | boolean | YES | `false` | Set true when category assigned by auto-categorization |
| 12 | `is_manually_reviewed` | boolean | YES | `false` | Set true when manually confirmed |
| 13 | `matched_rule_id` | uuid | YES | null | FK -> expense_rules(id). Which rule matched |
| 14 | `linked_invoice_id` | uuid | YES | null | FK -> invoices(id). Invoice this payment relates to |
| 15 | `transaction_type` | text | YES | null | CHECK IN ('expense', 'income', 'transfer', 'tax', 'loan', 'uncategorized') |
| 16 | `project_id` | uuid | YES | null | FK -> projects(id) ON DELETE SET NULL. Added migration 002 |
| 17 | `notes` | text | YES | null | Manual notes |
| 18 | `created_at` | timestamptz | YES | `now()` | - |
| 19 | `updated_at` | timestamptz | YES | `now()` | - |

**Indexes:**
- `idx_transactions_project` ON (`project_id`)

---

### financial_targets

**Description:** Revenue, MRR, and growth targets. Supports monthly, quarterly, and annual periods aligned to Indian FY.
**Row Count:** 3

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `title` | text | NO | - | - |
| 3 | `target_type` | text | NO | - | CHECK IN ('revenue', 'mrr', 'new_clients', 'expense_reduction', 'custom') |
| 4 | `period_type` | text | NO | - | CHECK IN ('monthly', 'quarterly', 'annual') |
| 5 | `financial_year` | text | NO | - | e.g. '2025-26' |
| 6 | `month` | integer | YES | null | 1-12, for monthly targets |
| 7 | `quarter` | integer | YES | null | 1-4, for quarterly targets |
| 8 | `target_amount` | numeric(12,2) | NO | - | Goal amount |
| 9 | `current_amount` | numeric(12,2) | YES | `0` | Progress so far |
| 10 | `service_type` | text | YES | null | Optional: filter by service type |
| 11 | `currency` | text | YES | `'INR'` | - |
| 12 | `notes` | text | YES | null | - |
| 13 | `created_at` | timestamptz | YES | `now()` | - |
| 14 | `updated_at` | timestamptz | YES | `now()` | Auto-updated by trigger |
| 15 | `created_by` | uuid | YES | null | FK -> profiles(id) |

**Trigger:** `update_financial_targets_updated_at` - BEFORE UPDATE sets `updated_at = now()`

---

### tds_certificates

**Description:** TDS (Tax Deducted at Source) certificates received from clients.

> **IMPORTANT:** Two migrations (001 and 007) both define this table. Migration 007 used `CREATE TABLE IF NOT EXISTS`, so if 001 ran first the table keeps 001's schema. **Verify actual live columns in Supabase Studio.**

**Columns from migration 007 (if table was freshly created):**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `certificate_number` | text | NO | - | TDS certificate number |
| 3 | `client_id` | uuid | YES | null | FK -> clients(id) ON DELETE SET NULL |
| 4 | `amount` | numeric(12,2) | NO | `0` | TDS amount |
| 5 | `financial_year` | text | NO | - | e.g. '2025-26' |
| 6 | `quarter` | text | YES | null | 'Q1', 'Q2', 'Q3', 'Q4' |
| 7 | `received_date` | date | YES | null | Date certificate received |
| 8 | `notes` | text | YES | null | - |
| 9 | `created_at` | timestamptz | NO | `now()` | - |

**Columns from migration 001 (if table pre-existed from 001):**

| # | Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `client_id` | uuid | NO | - | FK -> clients(id) |
| 3 | `financial_year` | text | NO | - | - |
| 4 | `quarter` | integer | NO | - | CHECK (1-4) |
| 5 | `certificate_received` | boolean | YES | `false` | - |
| 6 | `received_date` | date | YES | null | - |
| 7 | `amount` | numeric(12,2) | YES | null | - |
| 8 | `file_url` | text | YES | null | Storage URL |
| 9 | `notes` | text | YES | null | - |
| 10 | `created_at` | timestamptz | YES | `now()` | - |

**Row Count:** 0

---

### investor_reports

**Description:** Generated investor/management reports stored with metadata and JSONB data payload.
**Row Count:** 2

**Columns:**

| # | Column | Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| 2 | `title` | text | NO | - | Report title |
| 3 | `report_month` | integer | NO | - | 1-12 |
| 4 | `report_year` | integer | NO | - | e.g. 2026 |
| 5 | `financial_year` | text | NO | - | e.g. '2025-26' |
| 6 | `report_data` | jsonb | NO | `'{}'` | Report content (metrics, charts data, etc.) |
| 7 | `status` | text | NO | `'draft'` | CHECK IN ('draft', 'generated', 'sent') |
| 8 | `pdf_url` | text | YES | null | Storage URL of PDF |
| 9 | `sent_to` | text[] | YES | null | Array of recipient emails |
| 10 | `sent_at` | timestamptz | YES | null | When sent |
| 11 | `generated_at` | timestamptz | YES | `now()` | When generated |
| 12 | `report_type` | text | NO | `'monthly'` | CHECK IN ('monthly', 'quarterly', 'annual'). Added migration 008 |
| 13 | `created_by` | uuid | YES | null | FK -> profiles(id) |

---

## Views

All views are in the `public` schema. They are **NOT** in the Supabase auto-generated TypeScript types and require `as any` cast when querying from TypeScript. Views are read-only.

---

### monthly_pl_view

**Purpose:** Monthly profit and loss - revenue from payments vs expenses from bank transactions.
**Source Tables:** `invoice_payments`, `transactions`

**Columns:**

| Column | Type | Description |
|---|---|---|
| `month_start` | timestamptz | First day of the month |
| `month_label` | text | Formatted label e.g. 'Feb 2026' |
| `total_revenue` | numeric | Sum of invoice_payments.amount_received_inr (or amount_received if no INR equivalent) |
| `total_expenses` | numeric | Sum of transactions.debit (excludes income-type transactions) |
| `net_profit` | numeric | total_revenue - total_expenses |

**SQL Definition:**
```sql
CREATE OR REPLACE VIEW monthly_pl_view AS
WITH revenue AS (
  SELECT
    DATE_TRUNC('month', ip.payment_date) AS month_start,
    SUM(COALESCE(ip.amount_received_inr, ip.amount_received)) AS total_revenue
  FROM invoice_payments ip
  GROUP BY DATE_TRUNC('month', ip.payment_date)
),
expenses AS (
  SELECT
    DATE_TRUNC('month', t.transaction_date) AS month_start,
    SUM(t.debit) AS total_expenses
  FROM transactions t
  WHERE t.debit IS NOT NULL AND t.transaction_type != 'income'
  GROUP BY DATE_TRUNC('month', t.transaction_date)
)
SELECT
  COALESCE(r.month_start, e.month_start) AS month_start,
  TO_CHAR(COALESCE(r.month_start, e.month_start), 'Mon YYYY') AS month_label,
  COALESCE(r.total_revenue, 0) AS total_revenue,
  COALESCE(e.total_expenses, 0) AS total_expenses,
  COALESCE(r.total_revenue, 0) - COALESCE(e.total_expenses, 0) AS net_profit
FROM revenue r
FULL OUTER JOIN expenses e USING (month_start)
ORDER BY month_start;
```

---

### revenue_by_client_view

**Purpose:** Revenue collected per client with invoice counts and average days-to-payment.
**Source Tables:** `clients`, `invoices`, `invoice_payments`

**Columns:**

| Column | Type | Description |
|---|---|---|
| `client_id` | uuid | Client identifier |
| `client_name` | text | Company name |
| `invoice_count` | bigint | Number of non-draft invoices |
| `total_invoiced` | numeric | Sum of invoice total_amount |
| `total_collected` | numeric | Sum of invoice_payments.amount_received_inr |
| `avg_days_to_payment` | numeric | Average days from invoice_date to paid_at |

---

### expenses_by_category_view

**Purpose:** Monthly expense totals grouped by expense category.
**Source Tables:** `transactions`, `expense_categories`

**Columns:**

| Column | Type | Description |
|---|---|---|
| `month_label` | text | e.g. 'Feb 2026' |
| `month_start` | timestamptz | First day of month |
| `category` | text | Category name or 'Uncategorized' |
| `total_amount` | numeric | Sum of debit amounts |
| `transaction_count` | bigint | Number of transactions in this group |

---

### invoice_status_summary

**Purpose:** Quick aggregation of invoice counts and values by status.
**Source Tables:** `invoices`

**Columns:**

| Column | Type | Description |
|---|---|---|
| `status` | text | Invoice status |
| `invoice_count` | bigint | Number of invoices |
| `total_value` | numeric | Sum of total_amount |

---

### client_health_scores

**Purpose:** Computed health score (0-100) per client based on payment behavior.
**Source Tables:** `clients`, `invoices`, `invoice_payments`

**Health Score Formula:** 60% on-time payment rate + 40% payment speed (lower avg_days = better)

**Columns:**

| Column | Type | Description |
|---|---|---|
| `client_id` | uuid | Client identifier |
| `client_name` | text | Company name |
| `paid_count` | bigint | Total paid invoices |
| `on_time_count` | bigint | Invoices paid on or before due_date |
| `overdue_count` | bigint | Currently overdue invoices |
| `avg_payment_days` | numeric | Average days from invoice_date to paid_at |
| `total_collected` | numeric | Total revenue collected from this client |
| `on_time_pct` | numeric | Percentage of invoices paid on time |
| `health_score` | numeric | 0-100 computed score |

---

### project_revenue_by_type

**Purpose:** Revenue aggregated by project type (seo, branding, web_development, etc.).
**Source Tables:** `projects`, `invoices`, `invoice_payments`

**Columns:**

| Column | Type | Description |
|---|---|---|
| `project_type` | text | Project type |
| `project_count` | bigint | Number of projects |
| `total_collected` | numeric | Total revenue collected |

---

### cash_flow_monthly

**Purpose:** Monthly cash flow - inflows from payments received vs outflows from bank debits.
**Source Tables:** `invoice_payments`, `transactions`

**Columns:**

| Column | Type | Description |
|---|---|---|
| `month_start` | timestamptz | First day of month |
| `month_label` | text | e.g. 'Feb 2026' |
| `inflow` | numeric | Payments received (invoice_payments) |
| `outflow` | numeric | Transaction debits |
| `net` | numeric | inflow - outflow |

---

### revenue_by_service_view

**Purpose:** Revenue and project count per service from the services catalogue.
**Source Tables:** `services`, `projects`, `invoice_line_items`

**Columns:**

| Column | Type | Description |
|---|---|---|
| `service_id` | uuid | Service identifier |
| `service_name` | text | Service name |
| `color` | text | Hex color |
| `is_active` | boolean | Active flag |
| `project_count` | bigint | Projects using this service |
| `line_item_count` | bigint | Invoice line items for this service |
| `total_line_item_revenue` | numeric | Sum of line item amount * quantity |
| `monthly_retainer_value` | numeric | Sum of retainer project amounts |

---

### project_expense_breakdown

**Purpose:** Per-project expense breakdown by month and category.
**Source Tables:** `transactions`, `projects`, `clients`, `expense_categories`

**Columns:**

| Column | Type | Description |
|---|---|---|
| `project_id` | uuid | Project identifier |
| `project_name` | text | Project name |
| `client_id` | uuid | Client identifier |
| `client_name` | text | Client company name |
| `month_label` | text | e.g. 'Feb 2026' |
| `month_start` | timestamptz | First day of month |
| `category` | text | Expense category name |
| `total_expense` | numeric | Sum of debits for this combination |
| `transaction_count` | bigint | Number of transactions |

---

## Functions

### get_next_invoice_number(seq_type TEXT)

**Purpose:** Atomically increments invoice sequence and returns the next formatted number. Prevents race conditions for concurrent invoice creation.
**Returns:** TEXT

```sql
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

**Usage:**
```sql
SELECT get_next_invoice_number('gst');     -- 'G00114'
SELECT get_next_invoice_number('non_gst'); -- 'NG00203'
```

---

### update_updated_at_column()

**Purpose:** Generic trigger function used by all tables with an `updated_at` column.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### handle_new_user()

**Purpose:** Auto-creates a `profiles` row when a new user registers via Supabase Auth.
**Security:** SECURITY DEFINER (executes as function owner, bypasses RLS)

```sql
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
```

---

## Triggers

| Trigger Name | Table | Event | Timing | Function |
|---|---|---|---|---|
| `update_profiles_updated_at` | `profiles` | UPDATE | BEFORE | `update_updated_at_column()` |
| `update_clients_updated_at` | `clients` | UPDATE | BEFORE | `update_updated_at_column()` |
| `update_projects_updated_at` | `projects` | UPDATE | BEFORE | `update_updated_at_column()` |
| `update_invoices_updated_at` | `invoices` | UPDATE | BEFORE | `update_updated_at_column()` |
| `update_contracts_updated_at` | `contracts` | UPDATE | BEFORE | `update_updated_at_column()` |
| `update_financial_targets_updated_at` | `financial_targets` | UPDATE | BEFORE | `update_updated_at_column()` |
| `set_scheduled_invoices_updated_at` | `scheduled_invoices` | UPDATE | BEFORE | `update_updated_at_column()` |
| `set_services_updated_at` | `services` | UPDATE | BEFORE | `update_updated_at_column()` |
| `on_auth_user_created` | `auth.users` | INSERT | AFTER | `handle_new_user()` |

---

## Indexes

| Index Name | Table | Columns | Unique |
|---|---|---|---|
| `idx_clients_status` | `clients` | `(status)` | NO |
| `idx_clients_type` | `clients` | `(client_type)` | NO |
| `idx_projects_client` | `projects` | `(client_id)` | NO |
| `idx_projects_status` | `projects` | `(status)` | NO |
| `idx_projects_service` | `projects` | `(service_id)` | NO |
| `idx_invoices_client` | `invoices` | `(client_id)` | NO |
| `idx_invoices_status` | `invoices` | `(status)` | NO |
| `idx_invoices_type` | `invoices` | `(invoice_type)` | NO |
| `idx_invoices_date` | `invoices` | `(invoice_date)` | NO |
| `idx_invoice_line_items_service` | `invoice_line_items` | `(service_id)` | NO |
| `idx_invoice_email_activity_invoice_id` | `invoice_email_activity` | `(invoice_id)` | NO |
| `idx_invoice_email_activity_sent_at` | `invoice_email_activity` | `(sent_at)` | NO |
| `idx_scheduled_invoices_client` | `scheduled_invoices` | `(client_id)` | NO |
| `idx_scheduled_invoices_date` | `scheduled_invoices` | `(scheduled_date)` | NO |
| `idx_scheduled_invoices_status` | `scheduled_invoices` | `(status)` | NO |
| `idx_scheduled_invoices_billing_month` | `scheduled_invoices` | `(billing_month)` | NO |
| `idx_scheduled_invoices_project` | `scheduled_invoices` | `(project_id)` | NO |
| `idx_transactions_project` | `transactions` | `(project_id)` | NO |

---

## RLS Policies

**All tables have RLS enabled.** The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS. Client-side anonymous and authenticated roles are subject to these policies.

### Table: profiles

| Policy Name | Command | USING Clause |
|---|---|---|
| `Users can view all profiles` | SELECT | `true` |
| `Users can update own profile` | UPDATE | `auth.uid() = id` |
| `Admins can manage profiles` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')` |

---

### Table: clients

| Policy Name | Command | USING Clause |
|---|---|---|
| `Authenticated users can view clients` | SELECT | `auth.uid() IS NOT NULL` |
| `Admin/Manager can manage clients` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))` |

---

### Table: client_contacts

| Policy Name | Command | USING Clause |
|---|---|---|
| `Authenticated users can view contacts` | SELECT | `auth.uid() IS NOT NULL` |
| `Admin/Manager can manage contacts` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))` |

---

### Table: projects

| Policy Name | Command | USING Clause |
|---|---|---|
| `Authenticated read projects` | SELECT | `auth.uid() IS NOT NULL` |
| `Admin/Manager write projects` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))` |

---

### Table: invoices

| Policy Name | Command | USING Clause |
|---|---|---|
| `Authenticated read invoices` | SELECT | `auth.uid() IS NOT NULL` |
| `Admin/Manager/Accountant write invoices` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))` |

---

### Table: invoice_line_items

| Policy Name | Command | USING Clause |
|---|---|---|
| `Authenticated read line items` | SELECT | `auth.uid() IS NOT NULL` |
| `Admin/Manager/Accountant write line items` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))` |

---

### Table: invoice_payments

| Policy Name | Command | USING Clause |
|---|---|---|
| `Authenticated read payments` | SELECT | `auth.uid() IS NOT NULL` |
| `Admin/Manager/Accountant write payments` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))` |

---

### Table: invoice_sequences

| Policy Name | Command | USING Clause |
|---|---|---|
| `auth read invoice_sequences` | SELECT | `auth.uid() IS NOT NULL` |
| `accountant write invoice_sequences` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ANY(ARRAY['admin','manager','accountant']))` |

---

### Table: invoice_email_activity

| Policy Name | Command | USING Clause |
|---|---|---|
| `Authenticated read email activity` | SELECT | `auth.uid() IS NOT NULL` |
| `Admin/Manager/Accountant write email activity` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))` |

---

### Table: scheduled_invoices

| Policy Name | Command | USING Clause |
|---|---|---|
| `authenticated_read_scheduled_invoices` | SELECT | `true` |
| `managers_write_scheduled_invoices` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))` |

---

### Table: contracts

| Policy Name | Command | USING Clause |
|---|---|---|
| `Authenticated read contracts` | SELECT | `auth.uid() IS NOT NULL` |
| `Admin/Manager write contracts` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))` |

---

### Table: services

| Policy Name | Command | USING Clause |
|---|---|---|
| `Authenticated users can view services` | SELECT | `auth.uid() IS NOT NULL` |
| `Admin/Manager can manage services` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))` |

---

### Table: expense_categories

| Policy Name | Command | USING Clause |
|---|---|---|
| `auth read expense_categories` | SELECT | `auth.uid() IS NOT NULL` |
| `admin write expense_categories` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))` |

---

### Table: expense_rules

| Policy Name | Command | USING Clause |
|---|---|---|
| `auth read expense_rules` | SELECT | `auth.uid() IS NOT NULL` |
| `admin write expense_rules` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))` |

---

### Table: bank_statements

| Policy Name | Command | USING Clause |
|---|---|---|
| `auth read bank_statements` | SELECT | `auth.uid() IS NOT NULL` |
| `admin write bank_statements` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))` |

---

### Table: transactions

| Policy Name | Command | USING Clause |
|---|---|---|
| `auth read transactions` | SELECT | `auth.uid() IS NOT NULL` |
| `admin write transactions` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))` |

---

### Table: financial_targets

| Policy Name | Command | USING Clause |
|---|---|---|
| `auth read financial_targets` | SELECT | `auth.uid() IS NOT NULL` |
| `admin write financial_targets` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))` |

---

### Table: tds_certificates

| Policy Name | Command | USING Clause |
|---|---|---|
| `auth read tds_certificates` | SELECT | `auth.uid() IS NOT NULL` |
| `admin write tds_certificates` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'accountant'))` |

---

### Table: investor_reports

**Note: Write access is admin-only (not manager).**

| Policy Name | Command | USING Clause |
|---|---|---|
| `auth read investor_reports` | SELECT | `auth.uid() IS NOT NULL` |
| `admin write investor_reports` | ALL | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')` |

---

### Storage RLS Policies (on storage.objects)

| Policy Name | Bucket | Command | Condition |
|---|---|---|---|
| `auth read invoices storage` | `invoices` | SELECT | `auth.uid() IS NOT NULL` |
| `accountant write invoices storage` | `invoices` | INSERT | role IN ('admin', 'manager', 'accountant') |
| `accountant delete invoices storage` | `invoices` | DELETE | role IN ('admin', 'manager', 'accountant') |
| `auth read contracts storage` | `contracts` | SELECT | `auth.uid() IS NOT NULL` |
| `manager write contracts storage` | `contracts` | INSERT | role IN ('admin', 'manager') |
| `manager delete contracts storage` | `contracts` | DELETE | role IN ('admin', 'manager') |
| `auth read bank-statements storage` | `bank-statements` | SELECT | `auth.uid() IS NOT NULL` |
| `accountant write bank-statements storage` | `bank-statements` | INSERT | role IN ('admin', 'manager', 'accountant') |
| `accountant delete bank-statements storage` | `bank-statements` | DELETE | role IN ('admin', 'manager', 'accountant') |
| `public read avatars storage` | `avatars` | SELECT | public (no auth required) |
| `auth write avatars storage` | `avatars` | INSERT | `auth.uid() IS NOT NULL` |
| `own delete avatars storage` | `avatars` | DELETE | `auth.uid() IS NOT NULL` |

---

## Storage Buckets

| Bucket Name | Public | Size Limit | Description |
|---|---|---|---|
| `invoices` | NO (private) | 10 MB | Generated invoice PDFs |
| `contracts` | NO (private) | 10 MB | Contract documents (signed/unsigned PDFs) |
| `bank-statements` | NO (private) | 50 MB | Uploaded bank statement files (XLSX/CSV) |
| `avatars` | YES (public) | 2 MB | User profile pictures |
| `documents` | NO (private) | - | General private document storage (TDS certs, etc.) |

### Storage Path Conventions

| Bucket | Path Pattern | Used For |
|---|---|---|
| `invoices` | `{invoice_number}.pdf` | Invoice PDFs |
| `contracts` | `{client_id}/{contract_id}.pdf` | Contract documents |
| `bank-statements` | `{filename}` | Statement uploads |
| `avatars` | `{user_id}/{filename}` | Profile avatars |
| `documents` | `tds/{clientId}/{filename}` | TDS certificate files |

---

## Relationships

### Entity Relationship Overview

```
auth.users (Supabase Auth)
  +-- 1:1 --> profiles  [via on_auth_user_created trigger]

profiles
  +-- 1:N --> clients          (created_by)
  +-- 1:N --> projects         (created_by)
  +-- 1:N --> invoices         (created_by)
  +-- 1:N --> contracts        (created_by)
  +-- 1:N --> financial_targets (created_by)
  +-- 1:N --> invoice_payments  (created_by)
  +-- 1:N --> bank_statements   (uploaded_by)
  +-- 1:N --> investor_reports  (created_by)

clients
  +-- 1:N --> client_contacts      [ON DELETE CASCADE]
  +-- 1:N --> projects             [ON DELETE CASCADE]
  +-- 1:N --> invoices             (client_id FK)
  +-- 1:N --> contracts            (client_id FK)
  +-- 1:N --> scheduled_invoices   [ON DELETE CASCADE]
  +-- 1:N --> tds_certificates     (ON DELETE SET NULL)

services
  +-- 1:N --> projects              (service_id, ON DELETE SET NULL)
  +-- 1:N --> invoice_line_items    (service_id, ON DELETE SET NULL)

invoices
  +-- 1:N --> invoice_line_items    [ON DELETE CASCADE]
  +-- 1:N --> invoice_payments      [ON DELETE CASCADE]
  +-- 1:N --> invoice_email_activity [ON DELETE CASCADE]
  +-- referenced by scheduled_invoices.invoice_id (ON DELETE SET NULL)
  +-- referenced by transactions.linked_invoice_id

projects
  +-- referenced by invoices.project_ids (UUID array, no FK enforcement)
  +-- 1:N --> transactions (project_id, ON DELETE SET NULL)
  +-- 1:N --> scheduled_invoices (project_id, ON DELETE SET NULL)
  +-- referenced by contracts.project_id

bank_statements
  +-- 1:N --> transactions   [ON DELETE CASCADE]

expense_categories
  +-- 1:N --> expense_rules  [ON DELETE CASCADE]
  +-- 1:N --> transactions   (category_id)

expense_rules
  +-- referenced by transactions.matched_rule_id
```

### Foreign Key Summary

| Column | Source Table | References | On Delete |
|---|---|---|---|
| `id` | `profiles` | `auth.users(id)` | CASCADE |
| `client_id` | `client_contacts` | `clients(id)` | CASCADE |
| `client_id` | `projects` | `clients(id)` | CASCADE |
| `service_id` | `projects` | `services(id)` | SET NULL |
| `created_by` | `projects` | `profiles(id)` | - |
| `client_id` | `invoices` | `clients(id)` | - |
| `created_by` | `invoices` | `profiles(id)` | - |
| `invoice_id` | `invoice_line_items` | `invoices(id)` | CASCADE |
| `service_id` | `invoice_line_items` | `services(id)` | SET NULL |
| `invoice_id` | `invoice_payments` | `invoices(id)` | CASCADE |
| `created_by` | `invoice_payments` | `profiles(id)` | - |
| `invoice_id` | `invoice_email_activity` | `invoices(id)` | CASCADE |
| `created_by` | `invoice_email_activity` | `auth.users(id)` | - |
| `client_id` | `contracts` | `clients(id)` | - |
| `project_id` | `contracts` | `projects(id)` | - |
| `created_by` | `contracts` | `profiles(id)` | - |
| `client_id` | `scheduled_invoices` | `clients(id)` | CASCADE |
| `project_id` | `scheduled_invoices` | `projects(id)` | SET NULL |
| `invoice_id` | `scheduled_invoices` | `invoices(id)` | SET NULL |
| `category_id` | `expense_rules` | `expense_categories(id)` | CASCADE |
| `uploaded_by` | `bank_statements` | `profiles(id)` | - |
| `statement_id` | `transactions` | `bank_statements(id)` | CASCADE |
| `category_id` | `transactions` | `expense_categories(id)` | - |
| `matched_rule_id` | `transactions` | `expense_rules(id)` | - |
| `linked_invoice_id` | `transactions` | `invoices(id)` | - |
| `project_id` | `transactions` | `projects(id)` | SET NULL |
| `created_by` | `financial_targets` | `profiles(id)` | - |
| `client_id` | `tds_certificates` | `clients(id)` | SET NULL |
| `created_by` | `investor_reports` | `profiles(id)` | - |

---

## Migration History

| # | File | Summary | Tables Affected |
|---|---|---|---|
| 001 | `001_schema.sql` | Initial schema. All core tables + functions + triggers + RLS + storage RLS | profiles, clients, client_contacts, projects, invoices, invoice_line_items, invoice_payments, contracts, expense_categories, expense_rules, bank_statements, transactions, financial_targets, investor_reports, tds_certificates, invoice_sequences |
| 002 | `002_schema_additions.sql` | Phase 2 UX additions | clients (+avg_days_to_pay, +on_time_payment_pct, +billing_day), projects (+progress_pct), investor_reports (+report_type), transactions (+project_id) |
| 003 | `003_pipeline.sql` | Pipeline + cash flow | clients (+payment_terms_days), scheduled_invoices (CREATE) |
| 004 | `004_analytics.sql` | Analytics views | monthly_pl_view, revenue_by_client_view, expenses_by_category_view, invoice_status_summary, client_health_scores, project_revenue_by_type, cash_flow_monthly |
| 005 | `005_services.sql` | Service catalogue | services (CREATE), invoice_line_items (+service_id), projects (+service_id), revenue_by_service_view |
| 006 | `006_project_expenses.sql` | Project expense view | project_expense_breakdown |
| 007 | `007_tds_certificates.sql` | TDS table (v2) | tds_certificates (CREATE IF NOT EXISTS with new schema) |
| 008 | `008_investor_report_type.sql` | Report type column | investor_reports (+report_type) |
| 009 | `009_add_closed_status.sql` | Closed client status | clients (status constraint updated) |
| 010 | `010_invoice_archived_status.sql` | Archived invoice status | invoices (status constraint updated) |
| 011 | `011_services_hsn.sql` | HSN codes for services | services (+hsn_code, pre-filled for seeded services) |
| 012 | `012_invoice_email_activity.sql` | Email audit log | invoice_email_activity (CREATE + indexes + RLS) |

---

## Query Examples

```sql
-- Get all tables in public schema
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_type, table_name;

-- Get all columns for a specific table
SELECT column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'clients'
ORDER BY ordinal_position;

-- Get all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Get all indexes
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Get all foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Get table row counts (approximate, from pg stats)
SELECT schemaname, relname AS table_name, n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Get all triggers
SELECT trigger_name, event_object_table, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Get all functions
SELECT routine_name, routine_type, data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Get all views with their definitions
SELECT viewname, definition
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- Get all storage buckets
SELECT id, name, public, file_size_limit
FROM storage.buckets
ORDER BY name;
```

---

## Important Notes

### 1. Authentication Pattern

All Next.js API routes use the **Service Role Key** which bypasses all RLS policies:
```typescript
// Server-side API routes only
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

Client components use the **Anon Key** via SSR client (subject to RLS):
```typescript
import { createBrowserClient } from '@supabase/ssr';
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 2. Views Require `as any` Cast

SQL views are NOT included in the auto-generated `database.types.ts`. Always use `as any`:
```typescript
const { data } = await supabase
  .from('monthly_pl_view' as any)
  .select('*');
```

Views requiring `as any` cast:
- `monthly_pl_view`
- `revenue_by_client_view`
- `expenses_by_category_view`
- `invoice_status_summary`
- `client_health_scores`
- `project_revenue_by_type`
- `cash_flow_monthly`
- `revenue_by_service_view`
- `project_expense_breakdown`

### 3. invoices.project_ids is NOT an Enforced Foreign Key

`invoices.project_ids` is a `uuid[]` array column. PostgreSQL does not enforce referential integrity on array values. Deleting a project will NOT cascade-delete or null-out the project ID from this array. Handle this in application code.

### 4. Indian Financial Year

- FY runs: April 1 - March 31
- Current FY: 2025-26 (April 2025 - March 2026)
- FY label format: 'YYYY-YY' e.g. '2025-26'
- Q1: Apr-Jun | Q2: Jul-Sep | Q3: Oct-Dec | Q4: Jan-Mar
- TDS quarters follow the same structure

### 5. tds_certificates Schema Conflict

Migrations 001 and 007 both define `tds_certificates`. Since migration 007 uses `CREATE TABLE IF NOT EXISTS`, if migration 001 already created the table, migration 007 does not alter it. The live schema will be migration 001's version unless the table was manually dropped and recreated.

**To check live schema:**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tds_certificates'
ORDER BY ordinal_position;
```

### 6. Role Permissions Matrix

| Operation | viewer | accountant | manager | admin |
|---|---|---|---|---|
| Read all data | YES | YES | YES | YES |
| Write invoices, line items, payments | NO | YES | YES | YES |
| Write expense categories, rules, bank data | NO | YES | YES | YES |
| Write clients, contacts, projects, contracts | NO | NO | YES | YES |
| Write financial targets | NO | NO | YES | YES |
| Write services | NO | NO | YES | YES |
| Write investor reports | NO | NO | NO | YES |
| Update own profile | YES | YES | YES | YES |

### 7. Running Seed Data

Run `supabase/seed.sql` in Supabase SQL Editor after all migrations to seed:
- 10 expense categories
- 15 auto-categorization rules
- 6 sample clients
- 7 client contacts
- 6 projects
- 9 invoices
- 13 invoice line items
- 5 invoice payments
- 3 financial targets

Services are seeded in migration 005 (`005_services.sql`).

### 8. Realtime Subscriptions

The app uses Supabase Realtime (postgres_changes) on these tables via `RealtimeSync` provider:
- `invoices`
- `invoice_payments`
- `clients`
- `projects`
- `transactions`
- `financial_targets`
- `scheduled_invoices`

### 9. Migration Run Order

Migrations must be run in numbered order (001 through 012). Use Supabase SQL Editor and run each file sequentially. To check applied migrations:
```sql
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;
```

---

*Generated from: Supabase live database (OpenAPI spec) + supabase/migrations/*.sql + supabase/seed.sql*
*Row counts fetched live from Supabase on 2026-03-04*
*Last Updated: 2026-03-04*
