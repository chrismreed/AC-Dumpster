import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE = 'C:\\Users\\chris\\Documents\\Alley Cat Dumpsters\\Alleycat\\AC-Dumpster\\src\\app\\api\\admin\\';

// Files without verifyAdminAuth that still need it
const FILES_NEEDING_AUTH = [
  'add-ons\\[id]\\route.ts',
  'additional-charges\\[chargeId]\\route.ts',
  'bookings\\[id]\\check-payment-status\\route.ts',
  'bookings\\[id]\\payment-link\\route.ts',
  'bookings\\[id]\\payment-links\\route.ts',
  'bookings\\[id]\\status\\route.ts',
  'customer-accounts\\[id]\\route.ts',
  'fleet-location-options\\route.ts',
  'jobs\\route.ts',
  'jobs\\[id]\\route.ts',
  'jobs\\[id]\\status\\route.ts',
  'me\\route.ts',
  'notifications\\log\\route.ts',
  'notifications\\templates\\route.ts',
  'notifications\\test\\route.ts',
  'payment-links\\[linkId]\\check-status\\route.ts',
  'payment-links\\[linkId]\\route.ts',
  'payment-links\\[linkId]\\send\\route.ts',
  'payment-settings\\route.ts',
];

const IMPORT = `import { verifyAdminAuth } from '@/lib/admin-auth';`;

const AUTH_GUARD = `
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
`;

for (const relPath of FILES_NEEDING_AUTH) {
  const filePath = join(BASE, relPath);
  let content = readFileSync(filePath, 'utf8');

  // Skip if already has verifyAdminAuth
  if (content.includes('verifyAdminAuth')) {
    console.log('[SKIP already auth]', relPath);
    continue;
  }

  // Add import after the last consecutive import line at top
  if (!content.includes("from '@/lib/admin-auth'")) {
    content = content.replace(
      /((?:^import [^\n]+\n)+)/m,
      (match) => match + IMPORT + '\n'
    );
  }

  // Remove old admin_id cookie auth block if present (me/route.ts style)
  content = content.replace(
    /\s*const cookieStore = cookies\(\);\s*\n\s*const adminId = cookieStore\.get\('admin_id'\)\?\.value;\s*\n[\s\S]*?if \(!adminId\) \{[\s\S]*?status: 401[\s\S]*?\}\s*\n/,
    '\n'
  );

  // Remove old user lookup by adminId if present
  content = content.replace(
    /\s*const \[user\] = await db\.select\(\)\.from\(users\)\.where\(eq\(users\.id, parseInt\(adminId\)\)\);[\s\S]*?if \(!user\) \{[\s\S]*?status: 401[\s\S]*?\}\s*\n/,
    '\n'
  );

  // Remove TODO comment lines if present
  content = content.replace(
    /[ \t]*\/\/ TODO: Add admin authentication middleware\r?\n(?:[ \t]*\/\/ For now, allow all requests\r?\n)?/g,
    ''
  );

  // Insert auth guard after `try {` in each exported handler
  content = content.replace(
    /(export async function (?:GET|POST|PUT|PATCH|DELETE)\b[^{]*?\{[^{]*?try \{)(\r?\n)/gs,
    (match, tryBlock, newline) => tryBlock + newline + AUTH_GUARD
  );

  writeFileSync(filePath, content, 'utf8');
  console.log('[UPDATED]', relPath);
}

console.log('\nDone!');
