-- Bank accounts table - moves hardcoded bank details to database config
-- Allows editing from settings UI instead of code changes

create table if not exists bank_accounts (
  id uuid primary key default gen_random_uuid(),
  account_key text not null unique,  -- e.g. 'gst', 'usa', 'uae', 'nongst'
  title text not null,
  fields jsonb not null default '[]', -- array of {key, label, value, mono?, span?}
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table bank_accounts enable row level security;

create policy "Authenticated users can read bank accounts"
  on bank_accounts for select
  to authenticated
  using (auth.uid() is not null);

create policy "Admin/manager can update bank accounts"
  on bank_accounts for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager')
    )
  );

create policy "Admin can insert bank accounts"
  on bank_accounts for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Seed default bank accounts
insert into bank_accounts (account_key, title, fields, display_order) values
(
  'gst',
  'Indian GST Account',
  '[
    {"key": "beneficiary", "label": "Beneficiary Name", "value": "WODO Digital Private Limited"},
    {"key": "bank", "label": "Bank", "value": "IDFC FIRST Bank"},
    {"key": "account", "label": "Account Number", "value": "10213871315", "mono": true},
    {"key": "ifsc", "label": "IFSC Code", "value": "IDFB0080574", "mono": true},
    {"key": "swift", "label": "SWIFT Code", "value": "IDFBINBBMUM", "mono": true},
    {"key": "branch", "label": "Branch", "value": "KARNATAKA-DEVARAJA URS ROAD BRANCH"}
  ]'::jsonb,
  1
),
(
  'usa',
  'USA Account (Community Federal Savings Bank)',
  '[
    {"key": "holder", "label": "Account Holder Name", "value": "WODO DIGITAL PRIVATE LIMITED"},
    {"key": "method", "label": "Payment Method", "value": "ACH"},
    {"key": "routing", "label": "ACH Routing Number", "value": "026073150", "mono": true},
    {"key": "account", "label": "Account Number", "value": "8335312671", "mono": true},
    {"key": "bank", "label": "Bank Name", "value": "Community Federal Savings Bank"},
    {"key": "address", "label": "Beneficiary Address", "value": "5 Penn Plaza, 14th Floor, New York, NY 10001, US", "span": true},
    {"key": "currency", "label": "Account Currency", "value": "USD"}
  ]'::jsonb,
  2
),
(
  'uae',
  'UAE Account (Zand Bank PJSC)',
  '[
    {"key": "holder", "label": "Account Holder Name", "value": "WODO DIGITAL PRIVATE LIMITED"},
    {"key": "method", "label": "Payment Method", "value": "IPP / FTS"},
    {"key": "iban", "label": "IBAN (Account Number)", "value": "AE190960000691060009302", "mono": true},
    {"key": "bic", "label": "BIC / SWIFT Code", "value": "ZANDAEAAXXX", "mono": true},
    {"key": "bank", "label": "Bank Name", "value": "Zand Bank PJSC"},
    {"key": "address", "label": "Beneficiary Address", "value": "1st Floor, Emaar Square, Building 6, Dubai, UAE", "span": true},
    {"key": "currency", "label": "Account Currency", "value": "AED"}
  ]'::jsonb,
  3
),
(
  'nongst',
  'Non-GST Account',
  '[
    {"key": "name", "label": "Account Holder", "value": "Shyam Singh Bhati"},
    {"key": "bank", "label": "Bank", "value": "IDFC FIRST Bank"},
    {"key": "account", "label": "Account Number", "value": "10221086461", "mono": true},
    {"key": "ifsc", "label": "IFSC Code", "value": "IDFB0081105", "mono": true},
    {"key": "swift", "label": "SWIFT Code", "value": "IDFBINBBMUM", "mono": true},
    {"key": "branch", "label": "Branch", "value": "Bangalore - JP Nagar 5th Phase Branch"},
    {"key": "gpay", "label": "G-Pay Number", "value": "9535743993", "mono": true}
  ]'::jsonb,
  4
)
on conflict (account_key) do nothing;
