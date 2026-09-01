type Json = Record<string, unknown>;

function config() {
  const baseUrl = process.env.MT5_BRIDGE_URL;
  const token = process.env.MT5_BRIDGE_SERVICE_TOKEN;
  if (!baseUrl || !token) throw new Error('MT5_BRIDGE_CONFIG_MISSING');
  if (process.env.MT5_DEMO_ONLY !== 'true') throw new Error('MT5_REAL_MODE_BLOCKED');
  return { baseUrl: baseUrl.replace(/\/$/, ''), token };
}

async function get(path: string) {
  const { baseUrl, token } = config();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`MT5_BRIDGE_${response.status}`);
  return response.json() as Promise<Json>;
}

export async function getMt5DemoAccount(accountId: string) {
  return get(`/v1/accounts/${encodeURIComponent(accountId)}`);
}

export async function getMt5DemoPositions(accountId: string) {
  return get(`/v1/accounts/${encodeURIComponent(accountId)}/positions`);
}

export async function verifyMt5DemoBridge() {
  const { baseUrl, token } = config();
  const response = await fetch(`${baseUrl}/health`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return { ok: response.ok, status: response.status, body: await response.text() };
}
