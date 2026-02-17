import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

// Load environment variables manually
const envPath = join(process.cwd(), '.env.local');
try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+?)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
} catch (e) {
  console.log('No .env.local file found, using environment variables');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

const connectionString = process.env.DATABASE_URL;
const urlObj = new URL(connectionString);

const sql = postgres({
  host: urlObj.hostname,
  port: parseInt(urlObj.port),
  database: urlObj.pathname.slice(1),
  username: urlObj.username,
  password: decodeURIComponent(urlObj.password),
  ssl: urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1' ? false : 'require',
  prepare: false,
});

async function runMigration() {
  try {
    console.log('Running Jobs & Service Inventory Migration...\n');

    // Run migrations in explicit order
    const migrations = [
      // Part 1: Services table columns
      {
        name: 'Add requires_dumpster to services',
        sql: `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "requires_dumpster" boolean DEFAULT false;`
      },
      {
        name: 'Add dumpster_assignment_mode to services',
        sql: `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "dumpster_assignment_mode" text;`
      },
      {
        name: 'Add allowed_dumpster_ids to services',
        sql: `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "allowed_dumpster_ids" jsonb;`
      },
      {
        name: 'Add default_dumpster_id to services',
        sql: `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "default_dumpster_id" integer;`
      },
      {
        name: 'Add dumpster_quantity to services',
        sql: `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "dumpster_quantity" integer DEFAULT 1;`
      },
      {
        name: 'Add show_dumpster_pricing to services',
        sql: `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "show_dumpster_pricing" boolean DEFAULT true;`
      },

      // Part 2: Service responses columns
      {
        name: 'Add selected_dumpster_id to service_responses',
        sql: `ALTER TABLE "service_responses" ADD COLUMN IF NOT EXISTS "selected_dumpster_id" integer;`
      },
      {
        name: 'Add scheduled_date to service_responses',
        sql: `ALTER TABLE "service_responses" ADD COLUMN IF NOT EXISTS "scheduled_date" timestamp;`
      },
      {
        name: 'Add service_address to service_responses',
        sql: `ALTER TABLE "service_responses" ADD COLUMN IF NOT EXISTS "service_address" text;`
      },
      {
        name: 'Add service_city to service_responses',
        sql: `ALTER TABLE "service_responses" ADD COLUMN IF NOT EXISTS "service_city" text;`
      },
      {
        name: 'Add service_zip_code to service_responses',
        sql: `ALTER TABLE "service_responses" ADD COLUMN IF NOT EXISTS "service_zip_code" text;`
      },

      // Part 3: Create jobs table
      {
        name: 'Create jobs table',
        sql: `
CREATE TABLE IF NOT EXISTS "jobs" (
  "id" serial PRIMARY KEY,
  "job_type" text NOT NULL,
  "booking_id" integer REFERENCES "bookings"("id"),
  "service_response_id" integer REFERENCES "service_responses"("id"),
  "swap_request_id" integer REFERENCES "swap_requests"("id"),
  "customer_name" text NOT NULL,
  "customer_email" text NOT NULL,
  "customer_phone" text NOT NULL,
  "address" text NOT NULL,
  "city" text NOT NULL,
  "zip_code" text NOT NULL,
  "placement_instructions" text,
  "scheduled_date" timestamp NOT NULL,
  "time_preference" text,
  "dumpster_id" integer REFERENCES "dumpsters"("id"),
  "assigned_fleet_unit_id" integer REFERENCES "fleet_units"("id"),
  "status" text NOT NULL DEFAULT 'pending',
  "priority" integer DEFAULT 0,
  "notes" text,
  "admin_notes" text,
  "rental_end_date" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);`
      },

      // Part 4: Add constraints and indexes
      {
        name: 'Add job_type constraint',
        sql: `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_job_type_check'
  ) THEN
    ALTER TABLE "jobs" ADD CONSTRAINT "jobs_job_type_check"
      CHECK ("job_type" IN ('delivery', 'pickup', 'swap', 'service'));
  END IF;
END $$;`
      },
      {
        name: 'Add status constraint',
        sql: `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_status_check'
  ) THEN
    ALTER TABLE "jobs" ADD CONSTRAINT "jobs_status_check"
      CHECK ("status" IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled'));
  END IF;
END $$;`
      },
      {
        name: 'Add dumpster_assignment_mode constraint to services',
        sql: `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_dumpster_assignment_mode_check'
  ) THEN
    ALTER TABLE "services" ADD CONSTRAINT "services_dumpster_assignment_mode_check"
      CHECK ("dumpster_assignment_mode" IS NULL OR "dumpster_assignment_mode" IN ('fixed', 'customer_choice'));
  END IF;
END $$;`
      },

      // Part 5: Create indexes
      {
        name: 'Create jobs_booking_id_idx',
        sql: `CREATE INDEX IF NOT EXISTS "jobs_booking_id_idx" ON "jobs"("booking_id");`
      },
      {
        name: 'Create jobs_service_response_id_idx',
        sql: `CREATE INDEX IF NOT EXISTS "jobs_service_response_id_idx" ON "jobs"("service_response_id");`
      },
      {
        name: 'Create jobs_swap_request_id_idx',
        sql: `CREATE INDEX IF NOT EXISTS "jobs_swap_request_id_idx" ON "jobs"("swap_request_id");`
      },
      {
        name: 'Create jobs_scheduled_date_idx',
        sql: `CREATE INDEX IF NOT EXISTS "jobs_scheduled_date_idx" ON "jobs"("scheduled_date");`
      },
      {
        name: 'Create jobs_status_idx',
        sql: `CREATE INDEX IF NOT EXISTS "jobs_status_idx" ON "jobs"("status");`
      },
      {
        name: 'Create jobs_dumpster_id_idx',
        sql: `CREATE INDEX IF NOT EXISTS "jobs_dumpster_id_idx" ON "jobs"("dumpster_id");`
      },
      {
        name: 'Create jobs_assigned_fleet_unit_id_idx',
        sql: `CREATE INDEX IF NOT EXISTS "jobs_assigned_fleet_unit_id_idx" ON "jobs"("assigned_fleet_unit_id");`
      },
      {
        name: 'Create jobs_job_type_idx',
        sql: `CREATE INDEX IF NOT EXISTS "jobs_job_type_idx" ON "jobs"("job_type");`
      },
    ];

    console.log(`Running ${migrations.length} migration steps...\n`);

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      console.log(`[${i + 1}/${migrations.length}] ${migration.name}...`);

      try {
        await sql.unsafe(migration.sql);
        console.log(`    ✓ Success`);
      } catch (err: any) {
        if (err.message?.includes('already exists')) {
          console.log(`    ⚠ Already exists (skipped)`);
        } else {
          console.error(`    ✗ Failed:`, err.message);
          throw err;
        }
      }
    }

    console.log('\n========================================');
    console.log('Migration completed successfully!');
    console.log('========================================\n');
    console.log('You can now run the bookings-to-jobs migration:');
    console.log('  npx tsx scripts/migrate-bookings-to-jobs.ts\n');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('\nMigration failed:', error);
    await sql.end();
    process.exit(1);
  }
}

runMigration();
