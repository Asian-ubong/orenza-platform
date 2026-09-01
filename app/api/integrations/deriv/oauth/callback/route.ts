import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exchangeDerivCode } from '@/lib/brokers/deriv-demo-sync';
import { encryptSecret } from '@/lib/brokers/secret-box';

function admin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVER_CONFIG_MISSING');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = request.headers.get('cookie')?.match(/(?:^|; )orenzaderiv_oauth_state=([^;]+)/)?.[1];
  const verifier = request.headers.get('cookie')?.match(/(?:^|; )orenzaderiv_oauth_verifier=([^;]+)/)?.[1];

  if (!code || !state || !expectedState || state !== decodeURIComponent(expectedState) || !verifier) {
    return NextResponse.json({ error: 'DERIV_OAUTH_STATE_INVALID' }, { status: 400 });
  }

  try {
    const token = await exchangeDerivCode(code, decodeURIComponent(verifier));
    const accessToken = typeof token.access_token === 'string' ? token.access_token : '';
    if (!accessToken) throw new Error('DERIV_ACCESS_TOKEN_MISSING');

    const accountsResponse = await fetch('https://api.derivws.com/trading/v1/options/accounts', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Deriv-App-ID': process.env.DERIV_APP_ID ?? '',
      },
      cache: 'no-store',
    });
    if (!accountsResponse.ok) throw new Error(`DERIV_ACCOUNTS_${accountsResponse.status}`);
    const accountsBody = await accountsResponse.json() as { data?: Array<Record<string, unknown>> };
    const demo = (accountsBody.data ?? []).find((account) => String(account.account_type ?? account.environment ?? '').toLowerCase() === 'demo');
    if (!demo) throw new Error('DERIV_DEMO_ACCOUNT_NOT_FOUND');

    const accountId = String(demo.account_id ?? demo.id ?? '');
    if (!accountId) throw new Error('DERIV_DEMO_ACCOUNT_ID_MISSING');

    const { data: connection, error } = await admin().from('broker_connections').insert({
      broker: 'DERIV',
      environment: 'DEMO',
      external_account_id: accountId,
      status: 'AUTHENTICATED',
      access_token_encrypted: encryptSecret(accessToken),
      token_expires_at: token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000).toISOString() : null,
      last_connected_at: new Date().toISOString(),
    }).select('id').single();
    if (error) throw new Error(`DERIV_CONNECTION_CREATE_FAILED:${error.message}`);

    const response = NextResponse.json({
      ok: true,
      broker: 'DERIV',
      environment: 'DEMO',
      connectionId: connection.id,
      accountId,
      next: '/settings?deriv=connected',
    });
    response.cookies.delete('orenzaderiv_oauth_state');
    response.cookies.delete('orenzaderiv_oauth_verifier');
    response.cookies.delete('orenzaderiv_oauth_return');
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'DERIV_OAUTH_CALLBACK_FAILED' }, { status: 502 });
  }
}
