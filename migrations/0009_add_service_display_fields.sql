-- Add display settings fields to services table
ALTER TABLE services
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_on_services_page BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN services.image_url IS 'URL to the primary/hero image for this service';
COMMENT ON COLUMN services.show_on_homepage IS 'Whether this service should appear on the homepage';
COMMENT ON COLUMN services.show_on_services_page IS 'Whether this service should appear on the /services page';
COMMENT ON COLUMN services.is_featured IS 'Whether this service should be highlighted/featured';
