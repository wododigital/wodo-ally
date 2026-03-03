create table if not exists tds_certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_number text not null,
  client_id uuid references clients(id) on delete set null,
  amount numeric(12,2) not null default 0,
  financial_year text not null,  -- e.g. '2025-26'
  quarter text,                   -- e.g. 'Q1', 'Q2', 'Q3', 'Q4'
  received_date date,
  notes text,
  created_at timestamptz not null default now()
);
