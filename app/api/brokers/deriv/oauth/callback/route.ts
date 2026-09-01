import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeDerivCode } from '@/lib/brokers/deriv-oauth';
import { saveDerivConnection } from '@/lib/brokers/connection-store';

export const runtime = 'nodejs';

async function derivAccounts(accessToken: string) {
  const appId = process.env.DERIV_APP_ID;
  if (!appId) throw new Error('DERIV_APP_ID_MISSING');
  const response = await fetch('https://api.derivws.com/trading/v1/options/accounts', { headers: { 'Deriv-App-ID': appId, Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
  if (!response.ok) throw new Error(`DERIV_ACCOUNTS_${response.status}`);
  return response.json() as Promise<{ data?: Array<{ id?: string; account_id?: string; environment?: string }> }>;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieStore = await cookies();
  const expectedState = cookieStore.get('orenza_deriv_oauth_state')?.value;
  const verifier = cookieStore.get('orenza_deriv_oauth_verifier')?.value;
  const userId = cookieStore.get('orenza_deriv_oauth_user')?.value;
  const clientId = process.env.DERIV_OAUTH_CLIENT_ID;
  const redirectUri = process.env.DERIV_OAUTH_REDIRECT_URI;
  if (!code || !state || !expectedState || state !== expectedState || !verifier || !userId || !clientId || !redirectUri) return NextResponse.json({ error: 'INVALID_DERIV_OAUTH_CALLBACK' }, { status: 400 });

  const token = await exchangeDerivCode({ clientId, code, verifier, redirectUri });
  const accounts = await derivAccounts(token.access_token);
  const account = accounts.data?.[0];
  const accountId = account?.id ?? account?.account_id;
  if (!accountId) return NextResponse.json({ error: 'DERIV_ACCOUNT_NOT_FOUND' }, { status: 502 });
  const environment = account?.environment === 'REAL' ? 'REAL' : 'DEMO';
  await saveDerivConnection({ userId, accountId, environment, accessToken: token.access_token, expiresIn: token.expires_in });

  const response = NextResponse.redirect(new URL('/settings?deriv=connected', url.origin));
  response.cookies.delete('orenza_deriv_oauth_state');
  response.cookies.delete('orenza_deriv_oauth_verifier');
  response.cookies.delete('orenza_deriv_oauth_user');
  return response;
}
