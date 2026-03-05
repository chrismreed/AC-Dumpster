/**
 * One-time migration: create the login_attempts table for rate limiting.
 * Run with: npx tsx scripts/create-login-attempts-table.ts
 */
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Creating login_attempts table...');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id SERIAL PRIMARY KEY,
      ip TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      attempt_count INTEGER NOT NULL DEFAULT 1,
      window_start TIMESTAMP NOT NULL DEFAULT NOW(),
      last_attempt_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS login_attempts_ip_endpoint_idx
    ON login_attempts (ip, endpoint)
  `);

  console.log('Done — login_attempts table created.');
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
