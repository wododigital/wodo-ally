-- Migration 008: Add report_type column to investor_reports
-- Run this in the Supabase SQL editor

ALTER TABLE investor_reports
  ADD COLUMN IF NOT EXISTS report_type text NOT NULL DEFAULT 'monthly'
  CHECK (report_type IN ('monthly', 'quarterly', 'annual'));
