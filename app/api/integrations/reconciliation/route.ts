import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVER_CONFIG_MISSING');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const DEFAULT_STALE_AFTER_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { connectionId?: string };
  if (!body.connectionId) return NextResponse.json({ error: 'CONNECTION_ID_REQUIRED' }, { status: 400 });

  const db = admin();
  const startedAt = new Date().toISOString();

  try {
    const { data: connection, error: connectionError } = await db.from('broker_connections')
      .select('id, broker, environment, external_account_id, status, last_sync_at')
      .eq('id', body.connectionId)
      .single();

    if (connectionError || !connection) return NextResponse.json({ error: 'CONNECTION_NOT_FOUND' }, { status: 404 });
    if (connection.environment !== 'DEMO') return NextResponse.json({ error: 'REAL_ENVIRONMENT_BLOCKED' }, { status: 403 });

    const [{ data: snapshots, error: snapshotError }, { count: eventCount, error: eventError }, { data: positions, error: positionError }] = await Promise.all([
      db.from('broker_account_snapshots')
        .select('balance,equity,available,profit,as_of')
        .eq('connection_id', connection.id)
        .order('as_of', { ascending: false })
        .limit(1),
      db.from('broker_events')
        .select('id', { count: 'exact', head: true })
        .eq('connection_id', connection.id),
      db.from('broker_positions')
        .select('external_position_id,symbol,side,quantity,entry_price,current_price,profit,as_of')
        .eq('connection_id', connection.id)
        .order('as_of', { ascending: false })
        .limit(500),
    ]);

    if (snapshotError) throw snapshotError;
    if (eventError) throw eventError;
    if (positionError) throw positionError;

    const snapshot = snapshots?.[0] ?? null;
    const positionRows = positions ?? [];
    const positionIds = positionRows.map((position) => position.external_position_id).filter(Boolean);
    const duplicatePositionIds = [...new Set(positionIds.filter((id, index) => positionIds.indexOf(id) !== index))];
    const latestPositionAsOf = positionRows.reduce<string | null>((latest, position) => {
      if (!position.as_of) return latest;
      return !latest || position.as_of > latest ? position.as_of : latest;
    }, null);

    const latestObservedAt = [snapshot?.as_of ?? null, latestPositionAsOf, connection.last_sync_at ?? null]
      .filter((value): value is string => !!value)
      .sort()
      .at(-1) ?? null;
    const staleAfterMs = Number(process.env.RECONCILIATION_STALE_AFTER_MS ?? DEFAULT_STALE_AFTER_MS);
    const stale = latestObservedAt ? Date.now() - new Date(latestObservedAt).getTime() > staleAfterMs : true;
    const hasProviderEvidence = Boolean(snapshot) && (eventCount ?? 0) > 0;
    const positionIntegrity = duplicatePositionIds.length === 0;
    const status = hasProviderEvidence && positionIntegrity && !stale ? 'MATCHED' : 'MISMATCH';

    const checks = {
      provider_snapshot_present: Boolean(snapshot),
      provider_events_present: (eventCount ?? 0) > 0,
      position_integrity: positionIntegrity,
      duplicate_position_ids: duplicatePositionIds,
      provider_data_stale: stale,
      latest_observed_at: latestObservedAt,
      stale_after_ms: staleAfterMs,
      ledger_comparison: 'NOT_CONFIGURED',
    };

    const details = {
      mode: 'DEMO',
      reconciliation_type: 'provider_sync_integrity',
      broker: connection.broker,
      external_account_id: connection.external_account_id,
      checks,
      event_count: eventCount ?? 0,
      position_count: positionRows.length,
      latest_snapshot: snapshot,
      note: 'Financial ledger comparison is intentionally not inferred until the canonical ORENZA ledger adapter is configured.',
    };

    const { data: run, error: runError } = await db.from('reconciliation_runs').insert({
      connection_id: connection.id,
      status,
      broker_balance: snapshot?.balance ?? null,
      ledger_balance: null,
      delta: null,
      broker_positions_count: positionRows.length,
      ledger_positions_count: null,
      details,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
    }).select('id,status,details,started_at,completed_at').single();

    if (runError) throw runError;

    return NextResponse.json({
      ok: status === 'MATCHED',
      mode: 'DEMO',
      status,
      connection: { id: connection.id, broker: connection.broker, accountId: connection.external_account_id },
      run,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'RECONCILIATION_FAILED', mode: 'DEMO' }, { status: 502 });
  }
}
