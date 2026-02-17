// Migration script: Add notification system tables
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
  console.log('Starting migration: Add notification system tables...\n');

  // 1. Create notification_templates table
  try {
    console.log('  -> Creating notification_templates table...');
    await sql`
      CREATE TABLE IF NOT EXISTS notification_templates (
        id SERIAL PRIMARY KEY,
        event_type TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        email_enabled BOOLEAN NOT NULL DEFAULT true,
        sms_enabled BOOLEAN NOT NULL DEFAULT false,
        email_subject TEXT NOT NULL DEFAULT '',
        email_body TEXT NOT NULL DEFAULT '',
        sms_body TEXT NOT NULL DEFAULT '',
        available_variables TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT now() NOT NULL,
        updated_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `;
    console.log('     Done.');
  } catch (e) {
    console.log('     Note:', e.message);
  }

  // 2. Create notification_log table
  try {
    console.log('  -> Creating notification_log table...');
    await sql`
      CREATE TABLE IF NOT EXISTS notification_log (
        id SERIAL PRIMARY KEY,
        event_type TEXT NOT NULL,
        channel TEXT NOT NULL,
        recipient_email TEXT,
        recipient_phone TEXT,
        subject TEXT,
        body TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'sent',
        error_message TEXT,
        booking_id INTEGER,
        job_id INTEGER,
        swap_request_id INTEGER,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `;
    console.log('     Done.');
  } catch (e) {
    console.log('     Note:', e.message);
  }

  // 3. Seed default notification templates
  try {
    console.log('  -> Seeding default notification templates...');

    // Check if templates already exist
    const existing = await sql`SELECT COUNT(*) as count FROM notification_templates`;
    if (existing[0].count > 0) {
      console.log(`     Already have ${existing[0].count} templates, skipping seed.`);
    } else {
      await sql`
        INSERT INTO notification_templates (event_type, name, description, email_enabled, sms_enabled, email_subject, email_body, sms_body, available_variables) VALUES
        ('booking_confirmed', 'Booking Confirmed', 'Sent after payment is completed', true, false,
          'Your Dumpster Rental is Confirmed - Booking #{{bookingId}}',
          '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h2 style="color: #333;">Hi {{customerName}},</h2><p style="color: #555; font-size: 16px; line-height: 1.6;">Your booking <strong>#{{bookingId}}</strong> has been confirmed!</p><p style="color: #555; font-size: 16px; line-height: 1.6;"><strong>Delivery Date:</strong> {{deliveryDate}}<br/><strong>Dumpster:</strong> {{dumpsterSize}}<br/><strong>Address:</strong> {{address}}<br/><strong>Total:</strong> ${{totalPrice}}</p><p style="color: #555; font-size: 16px;">Thank you for choosing Alley Cat Dumpsters!</p></div>',
          'Alley Cat Dumpsters: Your booking #{{bookingId}} is confirmed! Delivery on {{deliveryDate}} to {{address}}.',
          'customerName,customerEmail,customerPhone,bookingId,deliveryDate,dumpsterSize,address,totalPrice'),

        ('job_scheduled', 'Job Scheduled', 'Sent when a job is assigned a scheduled date', true, false,
          'Your {{jobType}} is Scheduled - {{scheduledDate}}',
          '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h2 style="color: #333;">Hi {{customerName}},</h2><p style="color: #555; font-size: 16px; line-height: 1.6;">Your dumpster {{jobType}} has been scheduled for <strong>{{scheduledDate}}</strong>.</p><p style="color: #555; font-size: 16px; line-height: 1.6;"><strong>Address:</strong> {{address}}<br/><strong>Dumpster:</strong> {{dumpsterSize}}</p></div>',
          'Alley Cat Dumpsters: Your {{jobType}} is scheduled for {{scheduledDate}} at {{address}}.',
          'customerName,customerEmail,customerPhone,bookingId,jobId,jobType,scheduledDate,address,dumpsterSize'),

        ('driver_en_route', 'Driver En Route', 'Sent when job status changes to in_progress', true, true,
          'Your Driver is On the Way!',
          '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h2 style="color: #333;">Hi {{customerName}},</h2><p style="color: #555; font-size: 16px; line-height: 1.6;">Our driver is on the way to <strong>{{address}}</strong> with your {{dumpsterSize}} dumpster.</p><p style="color: #555; font-size: 16px;">Please ensure the placement area is clear and accessible.</p></div>',
          'Alley Cat Dumpsters: Our driver is on the way to {{address}} with your dumpster! Please ensure area is clear.',
          'customerName,customerEmail,customerPhone,bookingId,jobId,jobType,address,dumpsterSize'),

        ('job_completed', 'Job Completed', 'Sent when job status changes to completed', true, false,
          'Your {{jobType}} is Complete',
          '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h2 style="color: #333;">Hi {{customerName}},</h2><p style="color: #555; font-size: 16px; line-height: 1.6;">Your {{jobType}} job has been completed at <strong>{{address}}</strong>.</p><p style="color: #555; font-size: 16px;">If you have any questions, please don''t hesitate to contact us.</p></div>',
          'Alley Cat Dumpsters: Your {{jobType}} at {{address}} is complete. Questions? Contact us!',
          'customerName,customerEmail,customerPhone,bookingId,jobId,jobType,address,dumpsterSize'),

        ('swap_request_update', 'Swap Request Update', 'Sent when swap request status changes', true, false,
          'Swap Request Update - {{swapStatus}}',
          '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h2 style="color: #333;">Hi {{customerName}},</h2><p style="color: #555; font-size: 16px; line-height: 1.6;">Your {{requestType}} request has been updated to: <strong>{{swapStatus}}</strong>.</p><p style="color: #555; font-size: 16px;">{{adminNotes}}</p></div>',
          'Alley Cat Dumpsters: Your {{requestType}} request is now: {{swapStatus}}.',
          'customerName,customerEmail,customerPhone,bookingId,swapRequestId,requestType,swapStatus,adminNotes,scheduledDate')
      `;
      console.log('     Seeded 5 default templates.');
    }
  } catch (e) {
    console.log('     Note:', e.message);
  }

  console.log('\nMigration complete! Verifying...');

  const templates = await sql`SELECT event_type, name, email_enabled, sms_enabled FROM notification_templates ORDER BY id`;
  console.log('\nNotification templates:');
  for (const t of templates) {
    console.log(`  ${t.event_type}: "${t.name}" (email: ${t.email_enabled}, sms: ${t.sms_enabled})`);
  }

  await sql.end();
  console.log('\nDone!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
