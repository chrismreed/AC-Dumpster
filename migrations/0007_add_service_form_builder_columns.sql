-- Add missing columns to services table for form builder functionality
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'custom_form';
ALTER TABLE services ADD COLUMN IF NOT EXISTS form_schema JSONB;
ALTER TABLE services ADD COLUMN IF NOT EXISTS pricing_rules JSONB;
ALTER TABLE services ADD COLUMN IF NOT EXISTS flat_price INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Update existing services to have a flat_price if they don't have one
UPDATE services SET flat_price = 0 WHERE flat_price IS NULL;
