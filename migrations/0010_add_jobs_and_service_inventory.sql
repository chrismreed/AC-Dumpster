-- Migration: Add unified jobs system and service inventory settings
-- This migration adds:
-- 1. Inventory configuration fields to the services table
-- 2. Inventory tracking fields to the service_responses table
-- 3. A new jobs table for unified dispatch of all work items

-- ============================================
-- PART 1: Add inventory settings to services
-- ============================================

ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "requires_dumpster" boolean DEFAULT false;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "dumpster_assignment_mode" text;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "allowed_dumpster_ids" jsonb;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "default_dumpster_id" integer;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "dumpster_quantity" integer DEFAULT 1;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "show_dumpster_pricing" boolean DEFAULT true;

-- Add check constraint for dumpster_assignment_mode
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_dumpster_assignment_mode_check'
  ) THEN
    ALTER TABLE "services" ADD CONSTRAINT "services_dumpster_assignment_mode_check"
      CHECK ("dumpster_assignment_mode" IS NULL OR "dumpster_assignment_mode" IN ('fixed', 'customer_choice'));
  END IF;
END $$;

-- ============================================
-- PART 2: Add inventory fields to service_responses
-- ============================================

ALTER TABLE "service_responses" ADD COLUMN IF NOT EXISTS "selected_dumpster_id" integer;
ALTER TABLE "service_responses" ADD COLUMN IF NOT EXISTS "scheduled_date" timestamp;
ALTER TABLE "service_responses" ADD COLUMN IF NOT EXISTS "service_address" text;
ALTER TABLE "service_responses" ADD COLUMN IF NOT EXISTS "service_city" text;
ALTER TABLE "service_responses" ADD COLUMN IF NOT EXISTS "service_zip_code" text;

-- ============================================
-- PART 3: Create the unified jobs table
-- ============================================

CREATE TABLE IF NOT EXISTS "jobs" (
  "id" serial PRIMARY KEY,
  "job_type" text NOT NULL,

  -- Source references
  "booking_id" integer REFERENCES "bookings"("id"),
  "service_response_id" integer REFERENCES "service_responses"("id"),
  "swap_request_id" integer REFERENCES "swap_requests"("id"),

  -- Customer information (denormalized for driver convenience)
  "customer_name" text NOT NULL,
  "customer_email" text NOT NULL,
  "customer_phone" text NOT NULL,

  -- Location
  "address" text NOT NULL,
  "city" text NOT NULL,
  "zip_code" text NOT NULL,
  "placement_instructions" text,

  -- Scheduling
  "scheduled_date" timestamp NOT NULL,
  "time_preference" text,

  -- Fleet assignment
  "dumpster_id" integer REFERENCES "dumpsters"("id"),
  "assigned_fleet_unit_id" integer REFERENCES "fleet_units"("id"),

  -- Status
  "status" text NOT NULL DEFAULT 'pending',
  "priority" integer DEFAULT 0,

  -- Notes
  "notes" text,
  "admin_notes" text,

  -- For pickup jobs
  "rental_end_date" timestamp,

  -- Completion tracking
  "completed_at" timestamp,

  -- Audit
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add check constraints for jobs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_job_type_check'
  ) THEN
    ALTER TABLE "jobs" ADD CONSTRAINT "jobs_job_type_check"
      CHECK ("job_type" IN ('delivery', 'pickup', 'swap', 'service'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_status_check'
  ) THEN
    ALTER TABLE "jobs" ADD CONSTRAINT "jobs_status_check"
      CHECK ("status" IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled'));
  END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "jobs_booking_id_idx" ON "jobs"("booking_id");
CREATE INDEX IF NOT EXISTS "jobs_service_response_id_idx" ON "jobs"("service_response_id");
CREATE INDEX IF NOT EXISTS "jobs_swap_request_id_idx" ON "jobs"("swap_request_id");
CREATE INDEX IF NOT EXISTS "jobs_scheduled_date_idx" ON "jobs"("scheduled_date");
CREATE INDEX IF NOT EXISTS "jobs_status_idx" ON "jobs"("status");
CREATE INDEX IF NOT EXISTS "jobs_dumpster_id_idx" ON "jobs"("dumpster_id");
CREATE INDEX IF NOT EXISTS "jobs_assigned_fleet_unit_id_idx" ON "jobs"("assigned_fleet_unit_id");
CREATE INDEX IF NOT EXISTS "jobs_job_type_idx" ON "jobs"("job_type");
