/**
 * Manual schema migration script.
 * Uses the same `postgres` package the app uses (which handles Supabase SSL correctly).
 * Run with:  node scripts/push-schema.mjs
 */
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load DATABASE_URL from .env
const envPath = resolve(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf8');
const match = envContent.match(/^DATABASE_URL=(.+)$/m);
if (!match) throw new Error('DATABASE_URL not found in .env');
const DATABASE_URL = match[1].trim();

const urlObj = new URL(DATABASE_URL);

const sql = postgres({
  host: urlObj.hostname,
  port: parseInt(urlObj.port),
  database: urlObj.pathname.slice(1),
  username: urlObj.username,
  password: decodeURIComponent(urlObj.password),
  ssl: 'require',
  prepare: false,
  max: 1,
});

const alterStatements = [
  `ALTER TABLE dumpsters ADD COLUMN IF NOT EXISTS first_day_rate integer`,
  `ALTER TABLE dumpsters ADD COLUMN IF NOT EXISTS rate_decline_type text`,
  `ALTER TABLE dumpsters ADD COLUMN IF NOT EXISTS rate_decline_amount integer`,
  `ALTER TABLE dumpsters ADD COLUMN IF NOT EXISTS minimum_daily_rate integer`,
];

console.log('Connecting to Supabase…');

try {
  for (const stmt of alterStatements) {
    console.log(`  Running: ${stmt}`);
    await sql.unsafe(stmt);
    console.log('  ✓ OK');
  }
  console.log('\n✅ All columns added successfully.');
} catch (err) {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
} finally {
  await sql.end();
}
