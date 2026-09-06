const base = (process.env.E2E_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

const checks = [
  ['home', '/', 200], ['register', '/register', 200], ['login', '/login', 200], ['verify', '/verify', 200],
  ['promotion', '/promotion', 200], ['private access', '/private-access', 200], ['provider login', '/provider-login', 200],
  ['security check', '/security-check', 200], ['sandbox', '/sandbox', 200], ['markets', '/markets', 200],
  ['AI Premium', '/ai-premium', 200], ['trade', '/trade', 200], ['trade confirmation', '/trade/confirm', 200],
  ['portfolio', '/portfolio', 200], ['wallet', '/wallet', 200], ['profit units', '/profit-units', 200],
  ['payout', '/payout', 200], ['payout security', '/payout/security', 200], ['payout history', '/payout-history', 200],
  ['activity', '/activity', 200], ['settings', '/settings', 200], ['announcements', '/announcements', 200],
  ['events', '/events', 200], ['videos', '/videos', 200], ['version', '/api/version', 200],
];

let failures = 0;
async function check(name, path, expected) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual' });
  const ok = response.status === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${response.status} (expected ${expected})`);
  if (!ok) failures += 1;
}

for (const item of checks) await check(...item);

for (const path of ['/admin', '/admin/payout-approvals', '/api/admin/approvals']) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual' });
  const blocked = [301, 302, 303, 307, 308, 401, 403, 503].includes(response.status);
  console.log(`${blocked ? 'PASS' : 'FAIL'} anonymous admin protection ${path}: ${response.status}`);
  if (!blocked) failures += 1;
}

const payoutApi = await fetch(`${base}/api/payout/withdraw`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ user_id: '00000000-0000-0000-0000-000000000001', amount: 1 }),
  redirect: 'manual',
});
const payoutBlocked = payoutApi.status === 401;
console.log(`${payoutBlocked ? 'PASS' : 'FAIL'} unauthenticated profit payout is blocked: ${payoutApi.status}`);
if (!payoutBlocked) failures += 1;

for (const path of ['/api/payout/withdraw', '/api/sandbox/e2e']) {
  const response = await fetch(`${base}${path}`, { method: 'GET', redirect: 'manual' });
  const methodProtected = response.status === 405;
  console.log(`${methodProtected ? 'PASS' : 'FAIL'} protected POST-only API rejects GET ${path}: ${response.status}`);
  if (!methodProtected) failures += 1;
}

const version = await fetch(`${base}/api/version`, { redirect: 'manual' });
const cacheControl = version.headers.get('cache-control') || '';
const noStore = cacheControl.toLowerCase().includes('no-store');
console.log(`${noStore ? 'PASS' : 'FAIL'} version endpoint is not cached: ${cacheControl || '(missing)'}`);
if (!noStore) failures += 1;

if (failures) { console.error(`E2E smoke checks failed: ${failures}`); process.exit(1); }
console.log('E2E smoke checks passed.');
