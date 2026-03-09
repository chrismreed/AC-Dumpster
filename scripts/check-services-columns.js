const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrl = envContent.split('\n').find(line => line.startsWith('DATABASE_URL=')).split('=')[1].trim();

const postgres = require('postgres');
const sql = postgres(dbUrl, { ssl: 'require' });

async function checkColumns() {
  try {
    console.log('Checking services table columns...\n');

    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'services'
      ORDER BY ordinal_position
    `;

    console.log('Services table columns:');
    columns.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });

    console.log('\nChecking if new display fields exist:');
    const displayFields = ['image_url', 'show_on_homepage', 'show_on_services_page', 'is_featured'];
    displayFields.forEach(field => {
      const exists = columns.some(col => col.column_name === field);
      console.log(`- ${field}: ${exists ? '✓ EXISTS' : '✗ MISSING'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkColumns();
