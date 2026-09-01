import crypto from 'node:crypto';

const AUTH_BASE = 'https://auth.deriv.com/oauth2';

export function createPkcePair() {
  const verifier = crypto.randomBytes(64).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  const state = crypto.randomBytes(32).toString('hex');
  return { verifier, challenge, state };
}

export function buildDerivAuthorizationUrl(params: {
  clientId: string;
  redirectUri: string;
  scope?: string;
  state: string;
  challenge: string;
}) {
  const url = new URL(`${AUTH_BASE}/auth`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('scope', params.scope ?? 'trade');
  url.searchParams.set('state', params.state);
  url.searchParams.set('code_challenge', params.challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

export async function exchangeDerivCode(params: {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  code: string;
  verifier: string;
}) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: params.clientId,
    code: params.code,
    code_verifier: params.verifier,
    redirect_uri: params.redirectUri,
  });
  if (params.clientSecret) body.set('client_secret', params.clientSecret);

  const response = await fetch(`${AUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`DERIV_OAUTH_TOKEN_${response.status}`);
  return response.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  }>;
}
