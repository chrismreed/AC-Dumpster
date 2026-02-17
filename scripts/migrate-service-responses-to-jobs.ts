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

// Map service response status to job status
function mapServiceResponseStatusToJobStatus(status: string): string {
  switch (status) {
    case 'pending_review':
    case 'pending':
    case 'quoted':
      return 'pending';
    case 'approved':
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

interface ServiceResponse {
  id: number;
  service_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  selected_dumpster_id: number | null;
  scheduled_date: Date | null;
  service_address: string | null;
  service_city: string | null;
  service_zip_code: string | null;
  created_at: Date;
}

interface Service {
  id: number;
  name: string;
}

async function migrateServiceResponsesToJobs() {
  try {
    console.log('Starting migration of service responses to jobs...\n');

    // Find service responses that don't have corresponding jobs
    const serviceResponsesWithoutJobs = await sql<ServiceResponse[]>`
      SELECT sr.id, sr.service_id, sr.customer_name, sr.customer_email, sr.customer_phone,
             sr.status, sr.selected_dumpster_id, sr.scheduled_date,
             sr.service_address, sr.service_city, sr.service_zip_code, sr.created_at
      FROM service_responses sr
      LEFT JOIN jobs j ON j.service_response_id = sr.id
      WHERE j.id IS NULL
      ORDER BY sr.id
    `;

    console.log(`Found ${serviceResponsesWithoutJobs.length} service responses without jobs.\n`);

    if (serviceResponsesWithoutJobs.length === 0) {
      console.log('All service responses already have jobs. Nothing to migrate.');
      await sql.end();
      process.exit(0);
    }

    // Fetch service names for all unique service IDs
    const serviceIds = [...new Set(serviceResponsesWithoutJobs.map(sr => sr.service_id))];
    const services = await sql<Service[]>`
      SELECT id, name FROM services WHERE id = ANY(${serviceIds})
    `;
    const serviceMap = new Map(services.map(s => [s.id, s.name]));

    let jobsCreated = 0;
    let errors = 0;

    for (const sr of serviceResponsesWithoutJobs) {
      try {
        const serviceName = serviceMap.get(sr.service_id) || 'Unknown Service';
        const jobStatus = mapServiceResponseStatusToJobStatus(sr.status);

        // Use scheduled date if available, otherwise use created_at
        const scheduledDate = sr.scheduled_date || sr.created_at;

        await sql`
          INSERT INTO jobs (
            job_type, service_response_id, customer_name, customer_email, customer_phone,
            address, city, zip_code, scheduled_date, time_preference,
            dumpster_id, status, notes, created_at, updated_at
          ) VALUES (
            'service',
            ${sr.id},
            ${sr.customer_name},
            ${sr.customer_email},
            ${sr.customer_phone},
            ${sr.service_address || 'Address not provided'},
            ${sr.service_city || 'City not provided'},
            ${sr.service_zip_code || '00000'},
            ${scheduledDate},
            'anytime',
            ${sr.selected_dumpster_id},
            ${jobStatus},
            ${`Service: ${serviceName}`},
            ${sr.created_at},
            NOW()
          )
        `;

        jobsCreated++;
        console.log(`✓ Service Response #${sr.id} (${serviceName}) → Job created (status: ${jobStatus})`);
      } catch (err) {
        console.error(`✗ Failed to migrate service response #${sr.id}:`, err);
        errors++;
      }
    }

    console.log('\n========================================');
    console.log('Migration Summary:');
    console.log('========================================');
    console.log(`Service responses processed: ${serviceResponsesWithoutJobs.length}`);
    console.log(`Jobs created: ${jobsCreated}`);
    console.log(`Errors: ${errors}`);
    console.log('========================================\n');

    if (errors === 0) {
      console.log('Migration completed successfully!');
    } else {
      console.log(`Migration completed with ${errors} errors.`);
    }

    await sql.end();
    process.exit(errors > 0 ? 1 : 0);
  } catch (error) {
    console.error('Migration failed:', error);
    await sql.end();
    process.exit(1);
  }
}

migrateServiceResponsesToJobs();
