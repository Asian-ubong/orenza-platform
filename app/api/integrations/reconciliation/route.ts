import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVER_CONFIG_MISSING');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { connectionId?: string };
  if (!body.connectionId) return NextResponse.json({ error: 'CONNECTION_ID_REQUIRED' }, { status: 400 });
  const db = admin();
  const startedAt = new Date().toISOString();

  try {
    const { data: connection, error: connectionError } = await db.from('broker_connections')
      .select('id, broker, environment, external_account_id')
      .eq('id', body.connectionId).single();
    if (connectionError || !connection) return NextResponse.json({ error: 'CONNECTION_NOT_FOUND' }, { status: 404 });
    if (connection.environment !== 'DEMO') return NextResponse.json({ error: 'REAL_ENVIRONMENT_BLOCKED' }, { status: 403 });

    const { data: snapshots, error: snapshotError } = await db.from('broker_account_snapshots')
      .select('balance,equity,available,profit,as_of')
      .eq('connection_id', connection.id).order('as_of', { ascending: false }).limit(1);
    if (snapshotError) throw snapshotError;

    const { count: eventCount, error: eventError } = await db.from('broker_events')
      .select('id', { count: 'exact', head: true }).eq('connection_id', connection.id);
    if (eventError) throw eventError;

    const { count: positionCount, error: positionError } = await db.from('broker_positions')
      .select('id', { count: 'exact', head: true }).eq('connection_id', connection.id);
    if (positionError) throw positionError;

    const snapshot = snapshots?.[0] ?? null;
    const status = snapshot && (eventCount ?? 0) > 0 ? 'MATCHED' : 'MISMATCH';
    const details = {
      mode: 'DEMO',
      reconciliation_type: 'provider_sync_integrity',
      ledger_balance: null,
      note: 'Financial ledger comparison is intentionally not inferred until the canonical ORENZA ledger adapter is configured.',
      event_count: eventCount ?? 0,
      position_count: positionCount ?? 0,
      latest_snapshot: snapshot,
    };

    const { data: run, error: runError } = await db.from('reconciliation_runs').insert({
      connection_id: connection.id,
      status,
      broker_balance: snapshot?.balance ?? null,
      ledger_balance: null,
      delta: null,
      broker_positions_count: positionCount ?? 0,
      ledger_positions_count: null,
      details,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
    }).select('id,status,details,started_at,completed_at').single();
    if (runError) throw runError;

    return NextResponse.json({ ok: status === 'MATCHED', mode: 'DEMO', run });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'RECONCILIATION_FAILED', mode: 'DEMO' }, { status: 502 });
  }
}
