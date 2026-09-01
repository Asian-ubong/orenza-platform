import crypto from 'node:crypto';
import { decryptSecret } from '@/lib/security/secret-box';

const API = 'https://api.derivws.com';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function db(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ENV_MISSING');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) }, cache: 'no-store' });
  if (!response.ok) throw new Error(`SUPABASE_${response.status}`);
  return response;
}

async function otp(accountId: string, token: string) {
  const appId = process.env.DERIV_APP_ID;
  if (!appId) throw new Error('DERIV_APP_ID_MISSING');
  const response = await fetch(`${API}/trading/v1/options/accounts/${encodeURIComponent(accountId)}/otp`, { method: 'POST', headers: { 'Deriv-App-ID': appId, Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!response.ok) throw new Error(`DERIV_OTP_${response.status}`);
  const body = await response.json() as { data?: { url?: string } };
  if (!body.data?.url) throw new Error('DERIV_OTP_URL_MISSING');
  return body.data.url;
}

function wsRequest(ws: WebSocket, payload: Record<string, unknown>, timeoutMs = 15000): Promise<any> {
  return new Promise((resolve, reject) => {
    const reqId = Math.floor(Math.random() * 2_000_000_000);
    const timer = setTimeout(() => reject(new Error(`DERIV_WS_TIMEOUT_${String(payload.msg_type ?? 'request')}`)), timeoutMs);
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(String(event.data));
        if (data.req_id !== reqId) return;
        clearTimeout(timer); ws.removeEventListener('message', handler as EventListener);
        if (data.error) reject(new Error(`DERIV_WS_${data.error.code ?? 'ERROR'}`)); else resolve(data);
      } catch (error) { clearTimeout(timer); ws.removeEventListener('message', handler as EventListener); reject(error); }
    };
    ws.addEventListener('message', handler as EventListener);
    ws.send(JSON.stringify({ ...payload, req_id: reqId }));
  });
}

async function persist(connectionId: string, broker: string, environment: string, accountId: string, message: any) {
  const type = message.msg_type;
  if (type === 'balance') {
    const b = message.balance ?? {};
    await db('broker_account_snapshots', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ connection_id: connectionId, broker, environment, external_account_id: accountId, currency: b.currency ?? null, balance: b.balance ?? null, equity: b.balance ?? null, available: b.balance ?? null, profit: null, as_of: new Date().toISOString(), source: 'DERIV_WS', raw: message }) });
  } else if (type === 'transaction') {
    const t = message.transaction ?? message;
    await db('broker_events', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ connection_id: connectionId, broker, environment, event_type: 'TRANSACTION', external_event_id: String(t.id ?? t.transaction_id ?? `${t.transaction_time ?? Date.now()}-${t.amount ?? ''}`), occurred_at: t.transaction_time ? new Date(Number(t.transaction_time) * 1000).toISOString() : new Date().toISOString(), payload: message }) });
  } else if (type === 'portfolio') {
    const positions = Array.isArray(message.portfolio) ? message.portfolio : [];
    for (const p of positions) await db('broker_positions', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ connection_id: connectionId, broker, environment, external_account_id: accountId, external_position_id: String(p.contract_id ?? p.id ?? crypto.randomUUID()), symbol: String(p.underlying ?? p.symbol ?? 'UNKNOWN'), side: p.contract_type ?? null, quantity: p.amount ?? null, entry_price: p.buy_price ?? null, current_price: p.bid_price ?? null, profit: p.profit ?? null, as_of: new Date().toISOString(), raw: p }) });
  } else if (type === 'profit_table' || type === 'statement') {
    await db('broker_events', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ connection_id: connectionId, broker, environment, event_type: type.toUpperCase(), external_event_id: `${type}-${Date.now()}`, occurred_at: new Date().toISOString(), payload: message }) });
  }
}

export async function syncDerivConnection(connectionId: string) {
  const response = await db(`broker_connections?id=eq.${encodeURIComponent(connectionId)}&select=*`);
  const rows = await response.json() as Array<{ external_account_id: string; environment: string; access_token_encrypted: string }>;
  const connection = rows[0];
  if (!connection?.access_token_encrypted) throw new Error('DERIV_CONNECTION_TOKEN_MISSING');
  const token = decryptSecret(connection.access_token_encrypted);
  const wsUrl = await otp(connection.external_account_id, token);
  const ws = new WebSocket(wsUrl);
  await new Promise<void>((resolve, reject) => { const timer = setTimeout(() => reject(new Error('DERIV_WS_CONNECT_TIMEOUT')), 15000); ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }); ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('DERIV_WS_CONNECT_ERROR')); }); });

  try {
    ws.addEventListener('message', (event) => { void persist(connectionId, 'DERIV', connection.environment, connection.external_account_id, JSON.parse(String(event.data))).catch(() => undefined); });
    await wsRequest(ws, { balance: 1, subscribe: 1 });
    await wsRequest(ws, { portfolio: 1 });
    await wsRequest(ws, { profit_table: 1 });
    await wsRequest(ws, { statement: 1 });
    await wsRequest(ws, { transaction: 1, subscribe: 1 });
    await db(`broker_connections?id=eq.${encodeURIComponent(connectionId)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'CONNECTED', last_heartbeat_at: new Date().toISOString(), last_sync_at: new Date().toISOString(), last_error: null }) });
  } catch (error) {
    await db(`broker_connections?id=eq.${encodeURIComponent(connectionId)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'DEGRADED', last_error: error instanceof Error ? error.message : 'DERIV_SYNC_ERROR' }) }).catch(() => undefined);
    try { ws.close(); } catch {}
    throw error;
  }

  return { connectionId, status: 'CONNECTED', environment: connection.environment, websocket: ws };
}

export async function runDerivWorker(connectionId: string) {
  let delay = 1000;
  for (;;) {
    try {
      const result = await syncDerivConnection(connectionId);
      delay = 1000;
      await new Promise<void>((resolve) => setTimeout(resolve, 30_000));
      try { result.websocket.close(); } catch {}
    } catch {
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, 60_000);
    }
  }
}
