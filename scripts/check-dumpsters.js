const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    process.env[key] = value;
  }
});

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

async function checkDumpsters() {
  try {
    console.log('Connecting to database...');

    // Check dumpsters table
    const dumpsters = await sql`SELECT * FROM dumpsters ORDER BY sort_order`;
    console.log('\n=== DUMPSTERS ===');
    console.log(`Found ${dumpsters.length} dumpsters:`);
    dumpsters.forEach(d => {
      console.log(`  - ID: ${d.id}, Name: ${d.name}, Dimensions: ${d.dimensions}`);
    });

    // Check dumpster pricing
    const pricing = await sql`SELECT * FROM dumpster_pricing ORDER BY dumpster_id, sort_order`;
    console.log('\n=== DUMPSTER PRICING ===');
    console.log(`Found ${pricing.length} pricing options:`);
    pricing.forEach(p => {
      console.log(`  - Dumpster ID: ${p.dumpster_id}, Days: ${p.days}, Price: $${(p.price / 100).toFixed(2)}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await sql.end();
  }
}

checkDumpsters();
