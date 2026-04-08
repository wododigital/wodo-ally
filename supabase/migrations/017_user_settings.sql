-- User settings table - migrates localStorage settings to database
-- Stores per-user settings as JSONB keyed by category

create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,  -- e.g. 'company', 'invoice', 'notifications', 'email_templates', 'contract_templates'
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, category)
);

-- Index for fast lookup by user
create index if not exists idx_user_settings_user_id on user_settings(user_id);

-- RLS
alter table user_settings enable row level security;

-- Users can only read/write their own settings
create policy "Users can read own settings"
  on user_settings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on user_settings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on user_settings for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own settings"
  on user_settings for delete
  to authenticated
  using (auth.uid() = user_id);
