-- ============================================================
-- WODO Ally - Add HSN Code to Services
-- Migration 011 - Run in Supabase SQL Editor after 010_invoice_archived_status.sql
-- ============================================================

-- Add hsn_code column to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS hsn_code TEXT;

-- Pre-fill HSN codes for existing seeded services
-- 998314 = Design & Development
-- 998313 = Marketing & SEO / Advertising
UPDATE services SET hsn_code = '998314'
  WHERE name ILIKE '%web%'
     OR name ILIKE '%development%'
     OR name ILIKE '%design%'
     OR name ILIKE '%ui%'
     OR name ILIKE '%ux%'
     OR name ILIKE '%brand%';

UPDATE services SET hsn_code = '998313'
  WHERE name ILIKE '%seo%'
     OR name ILIKE '%marketing%'
     OR name ILIKE '%social%'
     OR name ILIKE '%content%'
     OR name ILIKE '%ads%'
     OR name ILIKE '%digital pr%'
     OR name ILIKE '%google my business%'
     OR name ILIKE '%full service%';
