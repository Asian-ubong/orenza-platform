import { syncDerivConnection } from '../services/deriv-adapter/worker';

async function main() {
  if (process.env.ENABLE_REAL_TRADING === 'true' || process.env.ENABLE_PROFIT_PAYOUT === 'true') throw new Error('SAFETY_GATE_FAILED_REAL_FEATURE_FLAG');

  const connectionId = process.env.DERIV_DEMO_CONNECTION_ID;
  if (!connectionId) throw new Error('DERIV_DEMO_CONNECTION_ID_REQUIRED');
  const deriv = await syncDerivConnection(connectionId);
  if (deriv.environment !== 'DEMO') throw new Error(`DERIV_NOT_DEMO:${deriv.environment}`);
  console.log(JSON.stringify({ step: 'DERIV_DEMO_SYNC', status: 'PASS', connectionId, environment: deriv.environment }));
  try { deriv.websocket.close(); } catch {}

  const bridge = process.env.MT5_BRIDGE_URL;
  const token = process.env.MT5_BRIDGE_SERVICE_TOKEN;
  const account = process.env.MT5_DEMO_ACCOUNT_ID;
  if (!bridge || !token || !account) throw new Error('MT5_DEMO_ENV_REQUIRED');
  const response = await fetch(`${bridge.replace(/\/$/, '')}/v1/accounts/${encodeURIComponent(account)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!response.ok) throw new Error(`MT5_DEMO_ACCOUNT_FAILED:${response.status}`);
  const data = await response.json() as { login?: number; server?: string };
  if (String(data.login) !== String(account)) throw new Error('MT5_ACCOUNT_MISMATCH');
  console.log(JSON.stringify({ step: 'MT5_DEMO_ACCOUNT', status: 'PASS', account: data.login, server: data.server ?? null }));

  console.log(JSON.stringify({ status: 'PASS', message: 'Provider demo connectivity verified. No real trade or payout was executed.' }));
}

main().catch((error) => { console.error(JSON.stringify({ status: 'FAIL', error: error instanceof Error ? error.message : String(error) })); process.exit(1); });
