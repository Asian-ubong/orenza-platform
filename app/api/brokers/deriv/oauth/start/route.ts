import { NextResponse } from 'next/server';
import { createPkce, derivOAuthUrl } from '@/lib/brokers/deriv-oauth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const clientId = process.env.DERIV_OAUTH_CLIENT_ID;
  const redirectUri = process.env.DERIV_OAUTH_REDIRECT_URI;
  if (!clientId || !redirectUri) return NextResponse.json({ error: 'DERIV_OAUTH_NOT_CONFIGURED' }, { status: 503 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

  const { verifier, challenge, state } = createPkce();
  const response = NextResponse.redirect(derivOAuthUrl({ clientId, redirectUri, scope: process.env.DERIV_OAUTH_SCOPES ?? 'trade', state, challenge }));
  response.cookies.set('orenza_deriv_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600 });
  response.cookies.set('orenza_deriv_oauth_verifier', verifier, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600 });
  response.cookies.set('orenza_deriv_oauth_user', user.id, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600 });
  return response;
}
