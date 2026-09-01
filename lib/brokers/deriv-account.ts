import type { BrokerAccountAdapter, BrokerAccountSnapshot, BrokerPosition } from './types';

const API_BASE = 'https://api.derivws.com';

async function derivRest<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const appId = process.env.DERIV_APP_ID;
  if (!appId) throw new Error('DERIV_APP_ID_MISSING');
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Deriv-App-ID': appId,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`DERIV_HTTP_${response.status}`);
  return response.json() as Promise<T>;
}

export class DerivLiveAccountAdapter implements BrokerAccountAdapter {
  readonly broker = 'DERIV' as const;

  constructor(private readonly token: string) {
    if (!token) throw new Error('DERIV_AUTH_TOKEN_REQUIRED');
  }

  async getAccountSnapshot(externalAccountId: string): Promise<BrokerAccountSnapshot> {
    // The current Deriv Options API exposes balance through an authenticated WebSocket.
    // Use the server-side wallet/account service to obtain the canonical snapshot.
    const otp = await derivRest<{ data: { url: string } }>(`/trading/v1/options/accounts/${encodeURIComponent(externalAccountId)}/otp`, this.token, { method: 'POST' });
    if (!otp.data?.url) throw new Error('DERIV_OTP_URL_MISSING');
    return {
      broker: 'DERIV',
      externalAccountId,
      currency: 'UNKNOWN',
      source: 'LIVE',
      asOf: new Date().toISOString(),
      // Balance/equity are intentionally populated by the authenticated WebSocket worker,
      // not guessed from an HTTP response.
    };
  }

  async getPositions(externalAccountId: string): Promise<BrokerPosition[]> {
    // Position snapshots are likewise streamed over the authenticated WebSocket.
    // The worker owns the connection and persists normalized snapshots.
    void externalAccountId;
    throw new Error('DERIV_POSITION_STREAM_REQUIRED');
  }
}
