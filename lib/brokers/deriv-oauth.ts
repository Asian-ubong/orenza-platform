import crypto from 'node:crypto';

const AUTH_URL = 'https://auth.deriv.com/oauth2/auth';
const TOKEN_URL = 'https://auth.deriv.com/oauth2/token';

function base64url(input: Buffer) {
  return input.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function createPkce() {
  const verifier = base64url(crypto.randomBytes(48));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  const state = base64url(crypto.randomBytes(32));
  return { verifier, challenge, state };
}

export function derivOAuthUrl(input: { clientId: string; redirectUri: string; scope: string; state: string; challenge: string }) {
  const url = new URL(AUTH_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', input.clientId);
  url.searchParams.set('redirect_uri', input.redirectUri);
  url.searchParams.set('scope', input.scope);
  url.searchParams.set('state', input.state);
  url.searchParams.set('code_challenge', input.challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

export async function exchangeDerivCode(input: { clientId: string; code: string; verifier: string; redirectUri: string }) {
  const body = new URLSearchParams({ grant_type: 'authorization_code', client_id: input.clientId, code: input.code, code_verifier: input.verifier, redirect_uri: input.redirectUri });
  const response = await fetch(TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body, cache: 'no-store' });
  if (!response.ok) throw new Error(`DERIV_OAUTH_TOKEN_${response.status}`);
  return response.json() as Promise<{ access_token: string; expires_in?: number; token_type: string }>;
}
