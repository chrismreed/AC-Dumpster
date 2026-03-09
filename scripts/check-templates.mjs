import postgres from 'postgres';
const url = new URL(process.env.DATABASE_URL);
const sql = postgres({ host: url.hostname, port: parseInt(url.port), database: url.pathname.slice(1), username: url.username, password: decodeURIComponent(url.password), ssl: 'require', max: 1 });
const r = await sql`SELECT event_type, name FROM notification_templates ORDER BY id`;
console.log('Templates:', r.map(t => t.event_type).join(', '));
console.log('Count:', r.length);
await sql.end();
