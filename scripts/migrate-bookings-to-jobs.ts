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

// Status mapping from booking status to job statuses
// | Booking Status | Delivery Job | Pickup Job |
// |----------------|--------------|------------|
// | pending        | pending      | pending    |
// | confirmed      | scheduled    | pending    |
// | delivered      | completed    | scheduled  |
// | picked_up      | completed    | completed  |
// | complete       | completed    | completed  |
// | cancelled      | cancelled    | cancelled  |

function getDeliveryJobStatus(bookingStatus: string): string {
  switch (bookingStatus) {
    case 'pending':
      return 'pending';
    case 'confirmed':
      return 'scheduled';
    case 'delivered':
    case 'picked_up':
    case 'complete':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

function getPickupJobStatus(bookingStatus: string): string {
  switch (bookingStatus) {
    case 'pending':
    case 'confirmed':
      return 'pending';
    case 'delivered':
      return 'scheduled';
    case 'picked_up':
    case 'complete':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

interface Booking {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  dumpster_id: number;
  delivery_address: string;
  delivery_city: string;
  delivery_zip_code: string;
  delivery_instructions: string | null;
  placement_location: string | null;
  delivery_date: Date;
  delivery_time_preference: string | null;
  status: string;
  assigned_fleet_unit_id: number | null;
  created_at: Date;
  pricing_id: number;
}

interface DumpsterPricing {
  id: number;
  dumpster_id: number;
  days: number;
  price: number;
}

async function migrateBookingsToJobs() {
  try {
    console.log('Starting migration of existing bookings to jobs...\n');

    // First, check if there are already jobs in the database
    const existingJobs = await sql`SELECT COUNT(*) as count FROM jobs WHERE booking_id IS NOT NULL`;
    const existingJobCount = parseInt(existingJobs[0].count as string);

    if (existingJobCount > 0) {
      console.log(`Found ${existingJobCount} existing jobs linked to bookings.`);
      console.log('Skipping migration to avoid duplicates.\n');
      console.log('If you want to re-run the migration, delete existing jobs first:');
      console.log('  DELETE FROM jobs WHERE booking_id IS NOT NULL;\n');
      await sql.end();
      process.exit(0);
    }

    // Fetch all bookings
    const bookings = await sql<Booking[]>`
      SELECT
        id, customer_name, customer_email, customer_phone,
        dumpster_id, delivery_address, delivery_city, delivery_zip_code,
        delivery_instructions, placement_location, delivery_date,
        delivery_time_preference, status, assigned_fleet_unit_id, created_at, pricing_id
      FROM bookings
      ORDER BY id
    `;

    console.log(`Found ${bookings.length} bookings to migrate.\n`);

    if (bookings.length === 0) {
      console.log('No bookings to migrate.');
      await sql.end();
      process.exit(0);
    }

    // Fetch pricing data to calculate rental end dates
    const pricingData = await sql<DumpsterPricing[]>`
      SELECT id, dumpster_id, days, price FROM dumpster_pricing
    `;
    const pricingMap = new Map(pricingData.map(p => [p.id, p]));

    let deliveryJobsCreated = 0;
    let pickupJobsCreated = 0;
    let errors = 0;

    for (const booking of bookings) {
      try {
        const pricing = pricingMap.get(booking.pricing_id);
        const rentalDays = pricing?.days || 7; // Default to 7 days if pricing not found

        // Calculate rental end date
        const deliveryDate = new Date(booking.delivery_date);
        const rentalEndDate = new Date(deliveryDate);
        rentalEndDate.setDate(rentalEndDate.getDate() + rentalDays);

        const deliveryJobStatus = getDeliveryJobStatus(booking.status);
        const pickupJobStatus = getPickupJobStatus(booking.status);

        // Determine completion dates
        const deliveryCompletedAt = deliveryJobStatus === 'completed' ? booking.delivery_date : null;
        const pickupCompletedAt = pickupJobStatus === 'completed' ? new Date() : null;

        // Create delivery job
        await sql`
          INSERT INTO jobs (
            job_type, booking_id, customer_name, customer_email, customer_phone,
            address, city, zip_code, placement_instructions,
            scheduled_date, time_preference, dumpster_id, assigned_fleet_unit_id,
            status, priority, notes, rental_end_date, completed_at, created_at, updated_at
          ) VALUES (
            'delivery',
            ${booking.id},
            ${booking.customer_name},
            ${booking.customer_email},
            ${booking.customer_phone},
            ${booking.delivery_address},
            ${booking.delivery_city},
            ${booking.delivery_zip_code},
            ${booking.placement_location || booking.delivery_instructions},
            ${booking.delivery_date},
            ${booking.delivery_time_preference},
            ${booking.dumpster_id},
            ${booking.assigned_fleet_unit_id},
            ${deliveryJobStatus},
            0,
            ${booking.delivery_instructions},
            ${rentalEndDate},
            ${deliveryCompletedAt},
            ${booking.created_at},
            NOW()
          )
        `;
        deliveryJobsCreated++;

        // Create pickup job
        await sql`
          INSERT INTO jobs (
            job_type, booking_id, customer_name, customer_email, customer_phone,
            address, city, zip_code, placement_instructions,
            scheduled_date, time_preference, dumpster_id, assigned_fleet_unit_id,
            status, priority, notes, rental_end_date, completed_at, created_at, updated_at
          ) VALUES (
            'pickup',
            ${booking.id},
            ${booking.customer_name},
            ${booking.customer_email},
            ${booking.customer_phone},
            ${booking.delivery_address},
            ${booking.delivery_city},
            ${booking.delivery_zip_code},
            ${booking.placement_location || booking.delivery_instructions},
            ${rentalEndDate},
            'anytime',
            ${booking.dumpster_id},
            ${booking.assigned_fleet_unit_id},
            ${pickupJobStatus},
            0,
            ${booking.delivery_instructions},
            ${rentalEndDate},
            ${pickupCompletedAt},
            ${booking.created_at},
            NOW()
          )
        `;
        pickupJobsCreated++;

        console.log(`✓ Booking #${booking.id} (${booking.status}) → Delivery: ${deliveryJobStatus}, Pickup: ${pickupJobStatus}`);
      } catch (err) {
        console.error(`✗ Failed to migrate booking #${booking.id}:`, err);
        errors++;
      }
    }

    console.log('\n========================================');
    console.log('Migration Summary:');
    console.log('========================================');
    console.log(`Total bookings processed: ${bookings.length}`);
    console.log(`Delivery jobs created: ${deliveryJobsCreated}`);
    console.log(`Pickup jobs created: ${pickupJobsCreated}`);
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

migrateBookingsToJobs();
