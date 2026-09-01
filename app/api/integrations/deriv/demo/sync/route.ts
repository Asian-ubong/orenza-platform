import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncDerivDemoAccount } from '@/lib/brokers/deriv-demo-sync';
import { decryptSecret } from '@/lib/brokers/secret-box';

function admin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVER_CONFIG_MISSING');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { connectionId?: string };
  if (!body.connectionId) return NextResponse.json({ error: 'CONNECTION_ID_REQUIRED' }, { status: 400 });

  try {
    const { data: connection, error } = await admin().from('broker_connections')
      .select('id, broker, environment, external_account_id, access_token_encrypted')
      .eq('id', body.connectionId).single();
    if (error || !connection) return NextResponse.json({ error: 'CONNECTION_NOT_FOUND' }, { status: 404 });
    if (connection.broker !== 'DERIV' || connection.environment !== 'DEMO') return NextResponse.json({ error: 'DEMO_ONLY' }, { status: 403 });
    if (!connection.access_token_encrypted) return NextResponse.json({ error: 'DERIV_TOKEN_NOT_STORED' }, { status: 409 });

    const result = await syncDerivDemoAccount({
      connectionId: connection.id,
      accountId: connection.external_account_id,
      accessToken: decryptSecret(connection.access_token_encrypted),
    });
    return NextResponse.json({ ok: true, ...result, mode: 'DEMO' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'DERIV_SYNC_FAILED', mode: 'DEMO' }, { status: 502 });
  }
}
