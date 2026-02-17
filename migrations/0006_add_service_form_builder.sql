-- Add service form builder columns and service responses table

-- Step 1: Rename pricing_type to service_type
DO $$
BEGIN
  IF EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name='services' AND column_name='pricing_type'
  ) THEN
    ALTER TABLE "services" RENAME COLUMN "pricing_type" TO "service_type";
  END IF;
END $$;

-- Step 2: Update existing data
DO $$
BEGIN
  IF EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name='services' AND column_name='service_type'
  ) THEN
    UPDATE "services" SET "service_type" = 'flat_rate' WHERE "service_type" IN ('flat', 'variable');
  END IF;
END $$;

-- Step 3: Remove old variable_config column (replaced by formSchema and pricingRules)
ALTER TABLE "services" DROP COLUMN IF EXISTS "variable_config";

-- Step 4: Add new columns for form builder
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "form_schema" jsonb;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "pricing_rules" jsonb;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- Step 5: Create service_responses table
CREATE TABLE IF NOT EXISTS "service_responses" (
  "id" serial PRIMARY KEY,
  "service_id" integer NOT NULL REFERENCES "services"("id") ON DELETE CASCADE,
  "booking_id" integer REFERENCES "bookings"("id"),

  "customer_name" text NOT NULL,
  "customer_email" text NOT NULL,
  "customer_phone" text NOT NULL,

  "responses" jsonb NOT NULL,
  "calculated_price" integer,

  "status" text NOT NULL DEFAULT 'pending_review',
  "admin_notes" text,
  "quoted_price" integer,
  "quoted_at" timestamp,
  "quoted_by" integer REFERENCES "users"("id"),

  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Step 6: Create indexes on service_responses for faster lookups
CREATE INDEX IF NOT EXISTS "service_responses_service_id_idx" ON "service_responses"("service_id");
CREATE INDEX IF NOT EXISTS "service_responses_status_idx" ON "service_responses"("status");
CREATE INDEX IF NOT EXISTS "service_responses_created_at_idx" ON "service_responses"("created_at");
