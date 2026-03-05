/**
 * Check & reset (or create) the admin user.
 * Run with: npx tsx scripts/reset-admin.ts
 *
 * Prints the new temp password to the console — change it in the admin UI after first login.
 */
import { db } from '../src/lib/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const TEMP_PASSWORD = 'Admin@TempPass1!';

async function main() {
  const allAdmins = await db.select().from(users);
  console.log(`\nAll users in DB (${allAdmins.length} total):`);
  allAdmins.forEach(u => {
    console.log(`  id=${u.id}  username="${u.username}"  isAdmin=${u.isAdmin}  email=${u.email ?? '(none)'}`);
  });

  const admins = allAdmins.filter(u => u.isAdmin);

  if (admins.length === 0) {
    console.log('\nNo admin users found — creating one...');
    const hash = await bcrypt.hash(TEMP_PASSWORD, 12);
    const [newAdmin] = await db.insert(users).values({
      username: 'admin',
      password: hash,
      isAdmin: true,
      email: null,
    }).returning();
    console.log(`\n✅ Created admin user (id=${newAdmin.id}, username="${newAdmin.username}")`);
  } else {
    // Reset password on the first admin found
    const target = admins[0];
    const hash = await bcrypt.hash(TEMP_PASSWORD, 12);
    await db.update(users)
      .set({ password: hash })
      .where(eq(users.id, target.id));
    console.log(`\n✅ Reset password on admin user id=${target.id} username="${target.username}"`);
  }

  console.log(`\n🔑 Temporary password: ${TEMP_PASSWORD}`);
  console.log('   Change this in the admin UI right after logging in.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
