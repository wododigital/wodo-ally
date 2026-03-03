-- Migration 010: Add 'archived' status to invoices for auto-archiving expired proformas

-- Drop existing inline check constraint (PostgreSQL auto-names it invoices_status_check)
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Re-add with 'archived' included
ALTER TABLE invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN (
    'draft', 'sent', 'viewed', 'paid', 'partially_paid',
    'overdue', 'cancelled', 'archived'
  ));
