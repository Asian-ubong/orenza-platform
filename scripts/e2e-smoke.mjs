const base = (process.env.E2E_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

const checks = [
  ['home', '/', 200],
  ['register', '/register', 200],
  ['login', '/login', 200],
  ['verify', '/verify', 200],
  ['promotion', '/promotion', 200],
  ['private access', '/private-access', 200],
  ['provider login', '/provider-login', 200],
  ['security check', '/security-check', 200],
  ['sandbox', '/sandbox', 200],
  ['markets', '/markets', 200],
  ['AI Premium', '/ai-premium', 200],
  ['trade', '/trade', 200],
  ['trade confirmation', '/trade/confirm', 200],
  ['portfolio', '/portfolio', 200],
  ['wallet', '/wallet', 200],
  ['profit units', '/profit-units', 200],
  ['payout', '/payout', 200],
  ['payout security', '/payout/security', 200],
  ['payout history', '/payout-history', 200],
  ['activity', '/activity', 200],
  ['settings', '/settings', 200],
  ['announcements', '/announcements', 200],
  ['events', '/events', 200],
  ['videos', '/videos', 200],
  ['version', '/api/version', 200],
];

let failures = 0;

async function check(name, path, expected) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual' });
  const ok = response.status === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${response.status} (expected ${expected})`);
  if (!ok) failures += 1;
}

for (const checkItem of checks) await check(...checkItem);

const admin = await fetch(`${base}/admin`, { redirect: 'manual' });
const adminBlocked = [301, 302, 303, 307, 308, 401, 403, 503].includes(admin.status);
console.log(`${adminBlocked ? 'PASS' : 'FAIL'} admin is not anonymously exposed: ${admin.status}`);
if (!adminBlocked) failures += 1;

const version = await fetch(`${base}/api/version`, { redirect: 'manual' });
const cacheControl = version.headers.get('cache-control') || '';
const noStore = cacheControl.toLowerCase().includes('no-store');
console.log(`${noStore ? 'PASS' : 'FAIL'} version endpoint is not cached: ${cacheControl || '(missing)'}`);
if (!noStore) failures += 1;

if (failures) {
  console.error(`E2E smoke checks failed: ${failures}`);
  process.exit(1);
}
console.log('E2E smoke checks passed.');
