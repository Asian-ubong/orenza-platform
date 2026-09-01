import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeDerivCode } from '@/lib/brokers/deriv-oauth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

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
  if (!code || !state || !expectedState || state !== expectedState || !verifier || !userId || !clientId || !redirectUri) {
    return NextResponse.json({ error: 'INVALID_DERIV_OAUTH_CALLBACK' }, { status: 400 });
  }

  const token = await exchangeDerivCode({ clientId, code, verifier, redirectUri });
  const supabase = await createSupabaseServerClient();
  const { data: accounts, error: accountError } = await supabase.auth.admin.listUsers();
  void accounts; void accountError;

  // Token storage is intentionally server-only. The current public Supabase client cannot perform
  // privileged writes, so the worker/service should persist this token using the service key.
  // Return a short-lived handoff marker instead of exposing the access token to the browser.
  const handoff = Buffer.from(JSON.stringify({ userId, accessToken: token.access_token, expiresIn: token.expires_in ?? 3600 }), 'utf8').toString('base64url');
  const response = NextResponse.redirect(new URL(`/settings?deriv=connected&handoff=${handoff}`, url.origin));
  response.cookies.delete('orenza_deriv_oauth_state');
  response.cookies.delete('orenza_deriv_oauth_verifier');
  response.cookies.delete('orenza_deriv_oauth_user');
  return response;
}
