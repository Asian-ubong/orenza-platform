const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function db(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ENV_MISSING');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) }, cache: 'no-store' });
  if (!response.ok) throw new Error(`SUPABASE_${response.status}`);
  return response;
}

function ledgerBalance(rows: Array<{ amount: number | string; direction: string }>) {
  return rows.reduce((total, row) => {
    const amount = Number(row.amount ?? 0);
    return total + (String(row.direction).toUpperCase() === 'DEBIT' ? -amount : amount);
  }, 0);
}

export async function reconcileBrokerConnection(connectionId: string) {
  const cResponse = await db(`broker_connections?id=eq.${encodeURIComponent(connectionId)}&select=id,user_id,environment,external_account_id`);
  const connections = await cResponse.json() as Array<{ id: string; user_id: string; environment: string; external_account_id: string }>;
  const connection = connections[0];
  if (!connection) throw new Error('BROKER_CONNECTION_NOT_FOUND');

  const snapshotResponse = await db(`broker_account_snapshots?connection_id=eq.${encodeURIComponent(connectionId)}&order=as_of.desc&limit=1`);
  const snapshots = await snapshotResponse.json() as Array<{ balance: number | string | null; currency: string | null }>;
  const snapshot = snapshots[0];
  if (!snapshot || snapshot.balance == null || !snapshot.currency) throw new Error('BROKER_SNAPSHOT_NOT_READY');

  const ledgerResponse = await db(`ledger_entries?user_id=eq.${encodeURIComponent(connection.user_id)}&currency=eq.${encodeURIComponent(snapshot.currency)}&select=amount,direction`);
  const ledgerRows = await ledgerResponse.json() as Array<{ amount: number | string; direction: string }>;
  const brokerBalance = Number(snapshot.balance);
  const ledgerBalanceValue = ledgerBalance(ledgerRows);
  const delta = brokerBalance - ledgerBalanceValue;
  const status = Math.abs(delta) < 0.01 ? 'MATCHED' : 'MISMATCH';

  await db('reconciliation_runs', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ connection_id: connectionId, status, broker_balance: brokerBalance, ledger_balance: ledgerBalanceValue, delta, details: { currency: snapshot.currency, environment: connection.environment, externalAccountId: connection.external_account_id }, started_at: new Date().toISOString(), completed_at: new Date().toISOString() }) });
  return { connectionId, status, brokerBalance, ledgerBalance: ledgerBalanceValue, delta, currency: snapshot.currency };
}
