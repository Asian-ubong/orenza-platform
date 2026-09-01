import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createDerivOAuthUrl } from '@/lib/brokers/deriv-demo-sync';

function base64url(buffer: Buffer) {
  return buffer.toString('base64url');
}

export async function GET(request: Request) {
  const redirectUri = process.env.DERIV_OAUTH_REDIRECT_URI;
  if (!redirectUri) return NextResponse.json({ error: 'DERIV_OAUTH_REDIRECT_URI_MISSING' }, { status: 503 });

  const verifier = base64url(crypto.randomBytes(48));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  const state = base64url(crypto.randomBytes(32));
  const response = NextResponse.redirect(createDerivOAuthUrl({ state, codeChallenge: challenge, redirectUri }));
  response.cookies.set('orenzaderiv_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' });
  response.cookies.set('orenzaderiv_oauth_verifier', verifier, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' });
  response.cookies.set('orenzaderiv_oauth_return', new URL(request.url).origin, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' });
  return response;
}
