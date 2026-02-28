/**
 * Migration: Add hybrid pricing mode columns to dumpsters and bookings tables.
 *
 * Run with: npx tsx scripts/migrate-pricing-mode.ts
 */
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Parse .env.local manually (dotenv not installed)
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let value = trimmed.slice(eqIdx + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set');
  }

  const urlObj = new URL(databaseUrl);
  const sql = postgres({
    host: urlObj.hostname,
    port: parseInt(urlObj.port),
    database: urlObj.pathname.slice(1),
    username: urlObj.username,
    password: decodeURIComponent(urlObj.password),
    ssl: urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1' ? false : 'require',
    prepare: false, // Required for Supabase transaction pooler (port 6543)
    max: 1,
  });

  console.log('Starting pricing mode migration...');

  // Step 1: Add columns to dumpsters table
  console.log('Adding columns to dumpsters table...');
  await sql`ALTER TABLE dumpsters ADD COLUMN IF NOT EXISTS pricing_mode TEXT NOT NULL DEFAULT 'tier'`;
  await sql`ALTER TABLE dumpsters ADD COLUMN IF NOT EXISTS base_price_per_day INTEGER`;
  await sql`ALTER TABLE dumpsters ADD COLUMN IF NOT EXISTS daily_rate INTEGER`;
  await sql`ALTER TABLE dumpsters ADD COLUMN IF NOT EXISTS min_days INTEGER`;
  await sql`ALTER TABLE dumpsters ADD COLUMN IF NOT EXISTS max_days INTEGER`;
  await sql`ALTER TABLE dumpsters ADD COLUMN IF NOT EXISTS overage_rate INTEGER`;
  console.log('✓ Dumpsters table updated');

  // Step 2: Add columns to bookings table + make pricing_id nullable
  console.log('Adding columns to bookings table...');
  await sql`ALTER TABLE bookings ALTER COLUMN pricing_id DROP NOT NULL`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rental_days INTEGER`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rental_price INTEGER`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_pricing_mode TEXT`;
  console.log('✓ Bookings table updated');

  // Step 3: Backfill existing bookings with rental_days and rental_price from their pricing tier
  console.log('Backfilling existing bookings...');
  const result = await sql`
    UPDATE bookings b
    SET rental_days = dp.days,
        rental_price = dp.price,
        booking_pricing_mode = 'tier'
    FROM dumpster_pricing dp
    WHERE b.pricing_id = dp.id
      AND b.rental_days IS NULL
  `;
  console.log(`✓ Backfilled ${result.count} bookings`);

  console.log('Migration complete!');
  await sql.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
