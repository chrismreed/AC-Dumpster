import postgres from 'postgres';

const url = new URL(process.env.DATABASE_URL);
const sql = postgres({
  host: url.hostname,
  port: parseInt(url.port),
  database: url.pathname.slice(1),
  username: url.username,
  password: decodeURIComponent(url.password),
  ssl: 'require',
  max: 1,
});

const templates = [
  {
    event_type: 'booking_confirmed',
    name: 'Booking Confirmed',
    description: 'Sent after payment is completed',
    email_enabled: true,
    sms_enabled: false,
    email_subject: 'Your Dumpster Rental is Confirmed - Booking #{{bookingId}}',
    email_body: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>Hi {{customerName}},</h2><p>Your booking <strong>#{{bookingId}}</strong> has been confirmed!</p><p><strong>Delivery Date:</strong> {{deliveryDate}}<br/><strong>Dumpster:</strong> {{dumpsterSize}}<br/><strong>Address:</strong> {{address}}<br/><strong>Total:</strong> {{totalPrice}}</p><p>Thank you for choosing Alley Cat Dumpsters!</p></div>',
    sms_body: 'Alley Cat Dumpsters: Your booking #{{bookingId}} is confirmed! Delivery on {{deliveryDate}} to {{address}}.',
    available_variables: 'customerName,customerEmail,customerPhone,bookingId,deliveryDate,dumpsterSize,address,totalPrice',
  },
  {
    event_type: 'job_scheduled',
    name: 'Job Scheduled',
    description: 'Sent when a job is assigned a scheduled date',
    email_enabled: true,
    sms_enabled: false,
    email_subject: 'Your {{jobType}} is Scheduled - {{scheduledDate}}',
    email_body: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>Hi {{customerName}},</h2><p>Your dumpster {{jobType}} has been scheduled for <strong>{{scheduledDate}}</strong>.</p><p><strong>Address:</strong> {{address}}<br/><strong>Dumpster:</strong> {{dumpsterSize}}</p></div>',
    sms_body: 'Alley Cat Dumpsters: Your {{jobType}} is scheduled for {{scheduledDate}} at {{address}}.',
    available_variables: 'customerName,customerEmail,customerPhone,bookingId,jobId,jobType,scheduledDate,address,dumpsterSize',
  },
  {
    event_type: 'driver_en_route',
    name: 'Driver En Route',
    description: 'Sent when job status changes to in_progress',
    email_enabled: true,
    sms_enabled: true,
    email_subject: 'Your Driver is On the Way!',
    email_body: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>Hi {{customerName}},</h2><p>Our driver is on the way to <strong>{{address}}</strong> with your {{dumpsterSize}} dumpster.</p><p>Please ensure the placement area is clear and accessible.</p></div>',
    sms_body: 'Alley Cat Dumpsters: Our driver is on the way to {{address}} with your dumpster! Please ensure area is clear.',
    available_variables: 'customerName,customerEmail,customerPhone,bookingId,jobId,jobType,address,dumpsterSize',
  },
  {
    event_type: 'job_completed',
    name: 'Job Completed',
    description: 'Sent when job status changes to completed',
    email_enabled: true,
    sms_enabled: false,
    email_subject: 'Your {{jobType}} is Complete',
    email_body: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>Hi {{customerName}},</h2><p>Your {{jobType}} job has been completed at <strong>{{address}}</strong>.</p><p>If you have any questions, please contact us.</p></div>',
    sms_body: 'Alley Cat Dumpsters: Your {{jobType}} at {{address}} is complete. Questions? Contact us!',
    available_variables: 'customerName,customerEmail,customerPhone,bookingId,jobId,jobType,address,dumpsterSize',
  },
  {
    event_type: 'swap_request_update',
    name: 'Swap Request Update',
    description: 'Sent when swap request status changes',
    email_enabled: true,
    sms_enabled: false,
    email_subject: 'Swap Request Update - {{swapStatus}}',
    email_body: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>Hi {{customerName}},</h2><p>Your {{requestType}} request has been updated to: <strong>{{swapStatus}}</strong>.</p><p>{{adminNotes}}</p></div>',
    sms_body: 'Alley Cat Dumpsters: Your {{requestType}} request is now: {{swapStatus}}.',
    available_variables: 'customerName,customerEmail,customerPhone,bookingId,swapRequestId,requestType,swapStatus,adminNotes,scheduledDate',
  },
];

for (const t of templates) {
  await sql`
    INSERT INTO notification_templates
      (event_type, name, description, email_enabled, sms_enabled, email_subject, email_body, sms_body, available_variables)
    VALUES
      (${t.event_type}, ${t.name}, ${t.description}, ${t.email_enabled}, ${t.sms_enabled}, ${t.email_subject}, ${t.email_body}, ${t.sms_body}, ${t.available_variables})
    ON CONFLICT (event_type) DO UPDATE SET
      name = ${t.name},
      description = ${t.description},
      email_subject = ${t.email_subject},
      email_body = ${t.email_body},
      sms_body = ${t.sms_body},
      available_variables = ${t.available_variables}
  `;
  console.log(`  Seeded: ${t.event_type}`);
}

const result = await sql`SELECT event_type, name FROM notification_templates ORDER BY id`;
console.log(`\nDone! ${result.length} templates in database.`);
await sql.end();
