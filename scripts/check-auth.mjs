import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const adminDir = 'C:\\Users\\chris\\Documents\\Alley Cat Dumpsters\\Alleycat\\AC-Dumpster\\src\\app\\api\\admin';

function walk(dir) {
  const r = [];
  for (const n of readdirSync(dir)) {
    const full = join(dir, n);
    if (statSync(full).isDirectory()) r.push(...walk(full));
    else if (n === 'route.ts') r.push(full);
  }
  return r;
}

const all = walk(adminDir).filter(f => !f.includes('\\login\\') && !f.includes('\\logout\\'));
const hasAuth = all.filter(f => readFileSync(f, 'utf8').includes('verifyAdminAuth'));
const noAuth = all.filter(f => !readFileSync(f, 'utf8').includes('verifyAdminAuth'));

console.log('Total admin routes (excl login/logout):', all.length);
console.log('Has verifyAdminAuth:', hasAuth.length);
console.log('Missing auth:', noAuth.length);
if (noAuth.length) {
  noAuth.forEach(f => console.log('  MISSING:', f.replace(adminDir + '\\', '')));
}
