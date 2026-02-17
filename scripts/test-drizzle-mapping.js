const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrl = envContent.split('\n').find(line => line.startsWith('DATABASE_URL=')).split('=')[1].trim();

const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const schema = require('../shared/schema');

const connectionString = dbUrl;
const client = postgres(connectionString, { ssl: 'require' });
const db = drizzle({ client, schema });

async function testMapping() {
  try {
    console.log('Testing Drizzle column mapping...\n');

    // Get service using Drizzle
    const services = await db
      .select()
      .from(schema.services)
      .limit(1);

    if (services.length === 0) {
      console.log('No services found');
      return;
    }

    const service = services[0];

    console.log('Service data from Drizzle:');
    console.log('  ID:', service.id);
    console.log('  Name:', service.name);
    console.log('  Category:', service.category);
    console.log('\nDisplay fields (camelCase):');
    console.log('  imageUrl:', service.imageUrl);
    console.log('  showOnHomepage:', service.showOnHomepage);
    console.log('  showOnServicesPage:', service.showOnServicesPage);
    console.log('  isFeatured:', service.isFeatured);

    console.log('\nChecking if snake_case exists:');
    console.log('  image_url:', service.image_url);
    console.log('  show_on_homepage:', service.show_on_homepage);

    console.log('\nAll keys on object:');
    console.log(Object.keys(service).join(', '));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

testMapping();
