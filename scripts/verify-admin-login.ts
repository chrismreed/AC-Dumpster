/**
 * Directly verify the stored password hash against the temp password.
 * Run with: npx tsx scripts/verify-admin-login.ts
 */
import { db } from '../src/lib/db';
import { users } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const TEST_PASSWORD = 'Admin@TempPass1!';

async function main() {
  // 1. Fetch the admin user exactly as the login route does
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.username, 'admin'), eq(users.isAdmin, true)));

  if (!user) {
    console.log('❌ No user found with username="admin" and isAdmin=true');
    process.exit(1);
  }

  console.log(`✅ User found: id=${user.id}, username="${user.username}", isAdmin=${user.isAdmin}`);
  console.log(`   Stored hash: ${user.password}`);

  // 2. Run the same bcrypt.compare the login route uses
  const isValid = await bcrypt.compare(TEST_PASSWORD, user.password);
  console.log(`\n   bcrypt.compare("${TEST_PASSWORD}", hash) => ${isValid}`);

  if (isValid) {
    console.log('\n✅ Password check PASSES — login should work. Check if dev server needs restart.\n');
  } else {
    console.log('\n❌ Password check FAILS — hash in DB does not match the temp password.\n');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
