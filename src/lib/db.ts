import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;

// Parse the URL for explicit parameters
const urlObj = new URL(connectionString);

// Use a global variable to persist the connection across HMR in development
const globalForDb = global as unknown as {
  sql: postgres.Sql<any> | undefined;
};

// Create postgres client with better connection handling for local dev and serverless
const sql = globalForDb.sql ?? postgres({
  host: urlObj.hostname,
  port: parseInt(urlObj.port),
  database: urlObj.pathname.slice(1),
  username: urlObj.username,
  password: decodeURIComponent(urlObj.password),
  max: 10, // Allow multiple connections
  idle_timeout: 30, // Increase idle timeout
  connect_timeout: 10, // Allow more time for connection attempts
  ssl: urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1' ? false : 'require',
  prepare: false, // Required for Supabase transaction pooler (port 6543)
  connection: {
    application_name: 'ac-dumpster-api-next'
  }
});

// Cache connection in all environments to avoid connection pool exhaustion
globalForDb.sql = sql;

// Export for direct SQL queries if needed
export { sql };

export const db = drizzle({ client: sql, schema });
