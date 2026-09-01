import { createClient } from '@supabase/supabase-js';

const DERIV_API = 'https://api.derivws.com/trading/v1/options';
const DEMO_WS_PREFIX = 'wss://api.derivws.com/trading/v1/options/ws/demo';

type Json = Record<string, unknown>;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name}_MISSING`);
  return value;
}

function supabaseAdmin() {
  return createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function assertDemoEnvironment(environment: string) {
  if (environment.toUpperCase() !== 'DEMO') throw new Error('REAL_ENVIRONMENT_BLOCKED');
}

export function createDerivOAuthUrl(input: {
  state: string;
  codeChallenge: string;
  redirectUri: string;
}) {
  const clientId = required('DERIV_OAUTH_CLIENT_ID');
  const url = new URL('https://auth.deriv.com/oauth2/auth');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', input.redirectUri);
  url.searchParams.set('scope', 'trade');
  url.searchParams.set('state', input.state);
  url.searchParams.set('code_challenge', input.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

export async function exchangeDerivCode(code: string, verifier: string) {
  const response = await fetch('https://auth.deriv.com/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: required('DERIV_OAUTH_CLIENT_ID'),
      client_secret: required('DERIV_OAUTH_CLIENT_SECRET'),
      code,
      code_verifier: verifier,
      redirect_uri: required('DERIV_OAUTH_REDIRECT_URI'),
    }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`DERIV_TOKEN_EXCHANGE_${response.status}`);
  return (await response.json()) as Json;
}

async function requestOtp(accountId: string, accessToken: string) {
  assertDemoEnvironment('DEMO');
  const response = await fetch(`${DERIV_API}/accounts/${encodeURIComponent(accountId)}/otp`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Deriv-App-ID': required('DERIV_APP_ID'),
    },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`DERIV_OTP_${response.status}`);
  const body = (await response.json()) as { data?: { url?: string } };
  const url = body.data?.url;
  if (!url || !url.startsWith(DEMO_WS_PREFIX)) throw new Error('DERIV_REAL_WS_BLOCKED');
  return url;
}

function messageValue(message: Json, key: string) {
  const value = message[key];
  return value && typeof value === 'object' ? (value as Json) : undefined;
}

function normalizeSnapshot(message: Json, accountId: string) {
  const balance = messageValue(message, 'balance') ?? messageValue(message, 'account');
  if (!balance) return null;
  const numeric = (key: string) => {
    const value = Number(balance[key]);
    return Number.isFinite(value) ? value : null;
  };
  return {
    external_account_id: accountId,
    broker: 'DERIV',
    environment: 'DEMO',
    currency: typeof balance.currency === 'string' ? balance.currency : null,
    balance: numeric('balance'),
    equity: numeric('equity'),
    available: numeric('available'),
    margin: numeric('margin'),
    profit: numeric('profit'),
    source: 'DERIV_AUTH_WS',
    raw: message,
  };
}

function normalizePositions(message: Json, accountId: string) {
  const portfolio = messageValue(message, 'portfolio');
  const positions = Array.isArray(portfolio?.positions)
    ? portfolio.positions
    : Array.isArray(message.portfolio)
      ? message.portfolio
      : [];
  return positions.filter((p): p is Json => !!p && typeof p === 'object').map((p) => ({
    external_account_id: accountId,
    broker: 'DERIV',
    environment: 'DEMO',
    external_position_id: String(p.id ?? p.contract_id ?? p.position_id ?? crypto.randomUUID()),
    symbol: String(p.symbol ?? p.underlying ?? 'UNKNOWN'),
    side: typeof p.direction === 'string' ? p.direction.toUpperCase() : null,
    quantity: Number.isFinite(Number(p.amount)) ? Number(p.amount) : null,
    entry_price: Number.isFinite(Number(p.entry_price ?? p.buy_price)) ? Number(p.entry_price ?? p.buy_price) : null,
    current_price: Number.isFinite(Number(p.current_price ?? p.sell_price)) ? Number(p.current_price ?? p.sell_price) : null,
    profit: Number.isFinite(Number(p.profit)) ? Number(p.profit) : null,
    raw: p,
  }));
}

async function send(ws: WebSocket, payload: Json) {
  ws.send(JSON.stringify(payload));
}

export async function syncDerivDemoAccount(input: {
  connectionId: string;
  accountId: string;
  accessToken: string;
  timeoutMs?: number;
}) {
  assertDemoEnvironment('DEMO');
  const wsUrl = await requestOtp(input.accountId, input.accessToken);
  const ws = new WebSocket(wsUrl);
  const timeoutMs = input.timeoutMs ?? 15_000;
  const supabase = supabaseAdmin();
  const started = Date.now();
  let snapshot: ReturnType<typeof normalizeSnapshot> = null;
  let positionCount = 0;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => { ws.close(); reject(new Error('DERIV_WS_TIMEOUT')); }, timeoutMs);
    ws.addEventListener('open', async () => {
      try {
        await send(ws, { balance: 1, subscribe: 1 });
        await send(ws, { portfolio: 1, subscribe: 1 });
        await send(ws, { transaction: 1, subscribe: 1 });
        await send(ws, { profit_table: 1 });
        await send(ws, { statement: 1 });
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    }, { once: true });

    ws.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(String(event.data)) as Json;
        const eventType = String(message.msg_type ?? 'unknown');
        const externalEventId = message.transaction_id != null
          ? String(message.transaction_id)
          : message.id != null ? String(message.id) : null;

        await supabase.from('broker_events').insert({
          connection_id: input.connectionId,
          broker: 'DERIV',
          environment: 'DEMO',
          event_type: eventType,
          external_event_id: externalEventId,
          occurred_at: new Date().toISOString(),
          payload: message,
        });

        const nextSnapshot = normalizeSnapshot(message, input.accountId);
        if (nextSnapshot) {
          snapshot = nextSnapshot;
          await supabase.from('broker_account_snapshots').insert({
            connection_id: input.connectionId,
            ...nextSnapshot,
            as_of: new Date().toISOString(),
          });
        }

        const positions = normalizePositions(message, input.accountId);
        if (positions.length) {
          positionCount = positions.length;
          await supabase.from('broker_positions').insert(positions.map((p) => ({
            connection_id: input.connectionId,
            ...p,
            as_of: new Date().toISOString(),
          })));
        }

        if (snapshot && (Date.now() - started > 2_000 || positionCount > 0)) {
          clearTimeout(timer);
          ws.close();
          resolve();
        }
      } catch (error) {
        clearTimeout(timer);
        ws.close();
        reject(error);
      }
    });
    ws.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error('DERIV_WS_ERROR'));
    }, { once: true });
  });

  await supabase.from('broker_connections').update({
    status: 'CONNECTED',
    last_connected_at: new Date().toISOString(),
    last_heartbeat_at: new Date().toISOString(),
    last_error: null,
  }).eq('id', input.connectionId);

  return { broker: 'DERIV', environment: 'DEMO', accountId: input.accountId, snapshot, positionCount };
}
