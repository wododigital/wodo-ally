-- Audit log table for tracking sensitive operations
-- Logs payment recording, invoice status changes, settings updates, etc.

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,           -- e.g. 'payment.create', 'invoice.status_change', 'settings.update'
  entity_type text,               -- e.g. 'invoice', 'payment', 'client', 'settings'
  entity_id text,                 -- UUID or identifier of the affected entity
  details jsonb default '{}',     -- Additional context (old_value, new_value, etc.)
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Index for querying by user
create index if not exists idx_audit_log_user_id on audit_log(user_id);

-- Index for querying by action type
create index if not exists idx_audit_log_action on audit_log(action);

-- Index for querying by entity
create index if not exists idx_audit_log_entity on audit_log(entity_type, entity_id);

-- Index for time-based queries
create index if not exists idx_audit_log_created_at on audit_log(created_at desc);

-- RLS: only authenticated users can insert, only admins can read
alter table audit_log enable row level security;

create policy "Authenticated users can insert audit logs"
  on audit_log for insert
  to authenticated
  with check (true);

create policy "Admins can read audit logs"
  on audit_log for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
