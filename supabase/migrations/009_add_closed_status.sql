-- Migration 009: Add 'closed' to client status check constraint
-- The TypeScript types already include 'closed' but the DB constraint was missing it.

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_status_check;
ALTER TABLE clients ADD CONSTRAINT clients_status_check
  CHECK (status IN ('active', 'inactive', 'churned', 'closed'));
