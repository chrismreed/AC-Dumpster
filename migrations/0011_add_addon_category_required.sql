-- Add category and isRequired columns to add_ons table
ALTER TABLE "add_ons" ADD COLUMN IF NOT EXISTS "category" text NOT NULL DEFAULT 'other';
ALTER TABLE "add_ons" ADD COLUMN IF NOT EXISTS "is_required" boolean NOT NULL DEFAULT false;
