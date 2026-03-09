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
      // Remove surrounding quotes
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
    // Step 1: Drop old constraint FIRST (so UPDATE can use new values)
    await sql`ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check`;
    console.log('Step 1: Dropped old jobs_status_check constraint');

    // Step 2: Migrate existing in_progress rows to en_route
    const updated = await sql`UPDATE jobs SET status = 'en_route' WHERE status = 'in_progress'`;
    console.log(`Step 2: Migrated ${updated.count} rows from in_progress to en_route`);

    // Step 3: Add new constraint with updated status values
    await sql`ALTER TABLE jobs ADD CONSTRAINT jobs_status_check CHECK (status IN ('pending', 'scheduled', 'en_route', 'picked_up', 'dumping', 'completed', 'cancelled'))`;
    console.log('Step 3: Added new jobs_status_check constraint');

    console.log('\nMigration 0012 complete!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
