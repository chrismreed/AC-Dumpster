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
    console.log('Running migration 0011_add_addon_category_required.sql...');

    const migrationPath = join(process.cwd(), 'migrations', '0011_add_addon_category_required.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split by statement breakpoint and run each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 80) + '...');
      await sql.unsafe(statement);
    }

    console.log('Migration completed successfully!');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await sql.end();
    process.exit(1);
  }
}

runMigration();
