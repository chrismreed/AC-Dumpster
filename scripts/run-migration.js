const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    process.env[key] = value;
  }
});

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

async function runMigration() {
  try {
    console.log('Running migration: 0009_add_service_display_fields.sql');

    const migrationPath = path.join(__dirname, '..', 'migrations', '0009_add_service_display_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the entire migration as one transaction
    console.log('Executing migration...');
    await sql.unsafe(migrationSQL);

    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
