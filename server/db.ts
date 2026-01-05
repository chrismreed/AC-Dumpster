import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;

// Log connection string (without password) for debugging
try {
  const urlObj = new URL(connectionString);
  const hasCredentials = urlObj.username && urlObj.password;
  console.log(`Connecting to database: ${urlObj.protocol}//${hasCredentials ? urlObj.username + '@' : ''}${urlObj.hostname}:${urlObj.port}${urlObj.pathname}`);
  if (!hasCredentials) {
    console.error('WARNING: Connection string appears to be missing username/password!');
  }
} catch (e) {
  console.error('Error parsing connection string:', e);
}

// Parse the URL for explicit parameters
const url = new URL(connectionString);

// Create postgres client with better connection handling
const client = postgres({
  host: url.hostname,
  port: parseInt(url.port),
  database: url.pathname.slice(1),
  username: url.username,
  password: decodeURIComponent(url.password), // Decode in case of special chars
  max: 10, // Allow more concurrent connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // 10 second connection timeout
  ssl: 'require',
  prepare: false, // Required for Supabase transaction pooler (port 6543)
  connection: {
    application_name: 'ac-dumpster-api'
  }
});

// Export for direct SQL queries if needed
export { client as sql };

export const db = drizzle({ client, schema });
