-- ============================================================
-- WODO Ally - Service Catalogue
-- Migration 005 - Add user-defined services
-- Run in Supabase SQL Editor after 004_analytics.sql
-- ============================================================

-- 1. SERVICES TABLE
CREATE TABLE IF NOT EXISTS services (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT    NOT NULL,
  description TEXT,
  color       TEXT    NOT NULL DEFAULT '#fd7e14',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view services" ON services;
DROP POLICY IF EXISTS "Admin/Manager can manage services"     ON services;
CREATE POLICY "Authenticated users can view services" ON services
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Manager can manage services" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE TRIGGER set_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. ADD service_id TO invoice_line_items
ALTER TABLE invoice_line_items
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_service
  ON invoice_line_items(service_id);

-- 3. ADD service_id TO projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_service
  ON projects(service_id);

-- 4. REVENUE BY SERVICE VIEW
-- Aggregates collected invoice revenue and project counts per service.
CREATE OR REPLACE VIEW revenue_by_service_view AS
SELECT
  s.id                                                AS service_id,
  s.name                                              AS service_name,
  s.color,
  s.is_active,
  COUNT(DISTINCT p.id)                                AS project_count,
  COUNT(DISTINCT ili.id)                              AS line_item_count,
  COALESCE(SUM(ili.amount * ili.quantity), 0)         AS total_line_item_revenue,
  COALESCE(
    SUM(CASE WHEN p.engagement_type = 'retainer'
             THEN COALESCE(p.retainer_amount, 0)
             ELSE 0
        END), 0
  )                                                   AS monthly_retainer_value
FROM services s
LEFT JOIN projects p            ON p.service_id  = s.id
LEFT JOIN invoice_line_items ili ON ili.service_id = s.id
GROUP BY s.id, s.name, s.color, s.is_active
ORDER BY total_line_item_revenue DESC;

-- 5. SEED DEFAULT SERVICES (idempotent)
INSERT INTO services (name, description, color, sort_order) VALUES
  ('SEO',               'Search engine optimisation and organic ranking',   '#fd7e14', 1),
  ('Google My Business','GMB profile setup, posts, and review management',  '#f59e0b', 2),
  ('Web Development',   'Website design, development, and deployment',      '#3b82f6', 3),
  ('Branding',          'Brand identity, logo design, and brand guidelines','#8b5cf6', 4),
  ('Google Ads',        'Paid search and display advertising management',   '#22c55e', 5),
  ('Social Media',      'Social media strategy, content, and management',   '#ec4899', 6),
  ('UI/UX Design',      'User interface and experience design',             '#06b6d4', 7),
  ('Content Marketing', 'Content strategy, creation, and distribution',     '#84cc16', 8),
  ('Digital PR',        'Online reputation and digital public relations',   '#f97316', 9),
  ('Full Service',      'Comprehensive digital marketing retainer',         '#6366f1', 10)
ON CONFLICT DO NOTHING;
