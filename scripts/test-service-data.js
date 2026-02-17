const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrl = envContent.split('\n').find(line => line.startsWith('DATABASE_URL=')).split('=')[1].trim();

const postgres = require('postgres');
const sql = postgres(dbUrl, { ssl: 'require' });

async function testServiceData() {
  try {
    console.log('Fetching services from database...\n');

    const services = await sql`
      SELECT
        id, name, description, category,
        image_url, show_on_homepage, show_on_services_page, is_featured,
        is_active, created_at
      FROM services
      ORDER BY id
      LIMIT 3
    `;

    console.log('Found', services.length, 'services:\n');

    services.forEach(service => {
      console.log(`Service #${service.id}: ${service.name}`);
      console.log(`  Category: ${service.category || '(none)'}`);
      console.log(`  Image URL: ${service.image_url || '(none)'}`);
      console.log(`  Show on Homepage: ${service.show_on_homepage}`);
      console.log(`  Show on Services Page: ${service.show_on_services_page}`);
      console.log(`  Is Featured: ${service.is_featured}`);
      console.log(`  Is Active: ${service.is_active}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

testServiceData();
