-- Migration 0013: Add weight, notes, and receipt photo URL to load_records
-- These fields support the load details prompt shown when advancing pickup to "dumping" status

ALTER TABLE "load_records" ADD COLUMN IF NOT EXISTS "load_weight" integer;
ALTER TABLE "load_records" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "load_records" ADD COLUMN IF NOT EXISTS "receipt_photo_url" text;
