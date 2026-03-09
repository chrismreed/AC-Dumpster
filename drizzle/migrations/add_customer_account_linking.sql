-- Migration: Add customer account linking to bookings
-- This enables automatic customer profile creation when bookings are made

-- Add new columns to customer_accounts table
ALTER TABLE "customer_accounts" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "customer_accounts" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "customer_accounts" ADD COLUMN IF NOT EXISTS "total_bookings" integer DEFAULT 0;
ALTER TABLE "customer_accounts" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- Add customer_account_id column to bookings table
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "customer_account_id" integer REFERENCES "customer_accounts"("id");

-- Create index for faster customer lookups
CREATE INDEX IF NOT EXISTS "idx_bookings_customer_account_id" ON "bookings" ("customer_account_id");
CREATE INDEX IF NOT EXISTS "idx_customer_accounts_email" ON "customer_accounts" ("email");

-- Backfill existing bookings with customer accounts
-- This creates customer accounts for any existing bookings that don't have one
DO $$
DECLARE
    booking_record RECORD;
    existing_account_id INTEGER;
    new_account_id INTEGER;
BEGIN
    FOR booking_record IN
        SELECT DISTINCT ON (LOWER(customer_email))
            id, customer_name, customer_email, customer_phone
        FROM bookings
        WHERE customer_account_id IS NULL
        ORDER BY LOWER(customer_email), created_at ASC
    LOOP
        -- Check if account already exists
        SELECT id INTO existing_account_id
        FROM customer_accounts
        WHERE LOWER(email) = LOWER(booking_record.customer_email);

        IF existing_account_id IS NOT NULL THEN
            -- Use existing account
            UPDATE bookings
            SET customer_account_id = existing_account_id
            WHERE LOWER(customer_email) = LOWER(booking_record.customer_email)
              AND customer_account_id IS NULL;
        ELSE
            -- Create new account
            INSERT INTO customer_accounts (email, name, phone, access_code, total_bookings, created_at, updated_at)
            VALUES (
                LOWER(booking_record.customer_email),
                booking_record.customer_name,
                booking_record.customer_phone,
                LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
                (SELECT COUNT(*) FROM bookings WHERE LOWER(customer_email) = LOWER(booking_record.customer_email)),
                NOW(),
                NOW()
            )
            RETURNING id INTO new_account_id;

            -- Link all bookings with this email to the new account
            UPDATE bookings
            SET customer_account_id = new_account_id
            WHERE LOWER(customer_email) = LOWER(booking_record.customer_email)
              AND customer_account_id IS NULL;
        END IF;
    END LOOP;
END $$;
