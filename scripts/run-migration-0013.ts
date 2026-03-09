import { readFileSync } from 'fs';
import { resolve } from 'path';
import postgres from 'postgres';

// Load .env manually (no dotenv dependency needed)
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {}
}
loadEnv();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const urlObj = new URL(url);
  const sql = postgres({
    host: urlObj.hostname,
    port: parseInt(urlObj.port),
    database: urlObj.pathname.slice(1),
    username: urlObj.username,
    password: decodeURIComponent(urlObj.password),
    ssl: urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1' ? false : 'require',
  });

  try {
    // Create table if it doesn't exist (may not have been created by earlier migration)
    await sql`
      CREATE TABLE IF NOT EXISTS load_records (
        id serial PRIMARY KEY,
        booking_id integer NOT NULL REFERENCES bookings(id),
        swap_request_id integer REFERENCES swap_requests(id),
        load_number integer NOT NULL,
        price_charged integer NOT NULL DEFAULT 0,
        load_weight integer,
        notes text,
        receipt_photo_url text,
        completed_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log('Step 1: Ensured load_records table exists');

    // Add columns if they don't exist (in case table existed without them)
    await sql`ALTER TABLE load_records ADD COLUMN IF NOT EXISTS load_weight integer`;
    await sql`ALTER TABLE load_records ADD COLUMN IF NOT EXISTS notes text`;
    await sql`ALTER TABLE load_records ADD COLUMN IF NOT EXISTS receipt_photo_url text`;
    console.log('Step 2: Ensured load_weight, notes, receipt_photo_url columns exist');

    console.log('\nMigration 0013 complete!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
