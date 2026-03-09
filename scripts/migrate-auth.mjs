// Migration script: Add password auth fields to customer_accounts
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const urlObj = new URL(connectionString);

const sql = postgres({
  host: urlObj.hostname,
  port: parseInt(urlObj.port),
  database: urlObj.pathname.slice(1),
  username: urlObj.username,
  password: decodeURIComponent(urlObj.password),
  ssl: urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1' ? false : 'require',
  max: 1,
});

async function migrate() {
  console.log('Starting migration: Add password auth fields to customer_accounts...');

  try {
    // 1. Make access_code nullable (was NOT NULL)
    console.log('  -> Making access_code nullable...');
    await sql`ALTER TABLE customer_accounts ALTER COLUMN access_code DROP NOT NULL`;
    console.log('     Done.');
  } catch (e) {
    if (e.message?.includes('not have a not-null') || e.message?.includes('already')) {
      console.log('     Already nullable, skipping.');
    } else {
      console.log('     Note:', e.message);
    }
  }

  try {
    // 2. Add password_hash column
    console.log('  -> Adding password_hash column...');
    await sql`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS password_hash TEXT`;
    console.log('     Done.');
  } catch (e) {
    console.log('     Note:', e.message);
  }

  try {
    // 3. Add email_verified column
    console.log('  -> Adding email_verified column...');
    await sql`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false`;
    console.log('     Done.');
  } catch (e) {
    console.log('     Note:', e.message);
  }

  try {
    // 4. Add verification_token column
    console.log('  -> Adding verification_token column...');
    await sql`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS verification_token TEXT`;
    console.log('     Done.');
  } catch (e) {
    console.log('     Note:', e.message);
  }

  try {
    // 5. Add token_expires_at column
    console.log('  -> Adding token_expires_at column...');
    await sql`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP`;
    console.log('     Done.');
  } catch (e) {
    console.log('     Note:', e.message);
  }

  console.log('\nMigration complete! Verifying columns...');

  const columns = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'customer_accounts'
    ORDER BY ordinal_position
  `;

  console.log('\nCustomer accounts table columns:');
  for (const col of columns) {
    console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
  }

  await sql.end();
  console.log('\nDone!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
