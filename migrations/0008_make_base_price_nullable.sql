-- Make base_price and price_unit nullable since not all services have fixed pricing
ALTER TABLE services ALTER COLUMN base_price DROP NOT NULL;
ALTER TABLE services ALTER COLUMN price_unit DROP NOT NULL;

-- Add default values for existing services
UPDATE services SET base_price = 0 WHERE base_price IS NULL;
UPDATE services SET price_unit = 'quote required' WHERE price_unit IS NULL;
