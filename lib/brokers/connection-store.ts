import { encryptSecret } from '@/lib/security/secret-box';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireConfig() {
  if (!url || !serviceKey) throw new Error('SUPABASE_SERVICE_ENV_MISSING');
  return { url, serviceKey };
}

async function supabaseRest(path: string, init: RequestInit = {}) {
  const cfg = requireConfig();
  const response = await fetch(`${cfg.url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: cfg.serviceKey, Authorization: `Bearer ${cfg.serviceKey}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`SUPABASE_REST_${response.status}`);
  return response;
}

export async function saveDerivConnection(input: { userId: string; accountId: string; environment: 'DEMO' | 'REAL'; accessToken: string; expiresIn?: number }) {
  const expiresAt = new Date(Date.now() + (input.expiresIn ?? 3600) * 1000).toISOString();
  await supabaseRest('broker_connections?on_conflict=user_id,broker_code,external_account_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: input.userId, broker_code: 'DERIV', environment: input.environment, external_account_id: input.accountId, status: 'CONNECTED', access_token_encrypted: encryptSecret(input.accessToken), token_expires_at: expiresAt, last_connected_at: new Date().toISOString(), last_heartbeat_at: new Date().toISOString(), last_sync_at: new Date().toISOString(), last_error: null }),
  });
}
