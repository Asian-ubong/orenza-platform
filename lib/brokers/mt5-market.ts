import type { BrokerAccountAdapter, BrokerMarketAdapter, BrokerPosition, BrokerAccountSnapshot, NormalizedMarket } from './types';

/**
 * MT5 is terminal-based. Orenza does not put terminal credentials in Next.js.
 * A separately hosted, authenticated MT5 bridge is required. The bridge talks
 * to the MetaTrader 5 terminal using the official MetaTrader5 integration.
 */
function bridgeUrl(): string {
  const value = process.env.MT5_BRIDGE_URL;
  if (!value) throw new Error('MT5_BRIDGE_NOT_CONFIGURED');
  return value.replace(/\/$/, '');
}

async function bridgeFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = process.env.MT5_BRIDGE_SERVICE_TOKEN;
  if (!token) throw new Error('MT5_BRIDGE_SERVICE_TOKEN_MISSING');
  const response = await fetch(`${bridgeUrl()}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`MT5_BRIDGE_HTTP_${response.status}`);
  return response.json() as Promise<T>;
}

export class Mt5LiveMarketAdapter implements BrokerMarketAdapter {
  readonly broker = 'MT5' as const;

  async getMarkets(): Promise<NormalizedMarket[]> {
    const data = await bridgeFetch<{ markets: Array<{ symbol: string; displayName?: string; assetClass?: string; marketStatus?: 'OPEN' | 'CLOSED' | 'UNKNOWN' }> }>('/v1/markets');
    return data.markets.map((m) => ({
      broker: 'MT5', symbol: m.symbol, displayName: m.displayName ?? m.symbol,
      assetClass: m.assetClass, marketStatus: m.marketStatus ?? 'UNKNOWN',
      timestamp: new Date().toISOString(), source: 'LIVE',
    }));
  }

  async getQuote(symbol: string): Promise<NormalizedMarket> {
    const data = await bridgeFetch<{ symbol: string; displayName?: string; bid?: number; ask?: number; last?: number; timestamp?: string; marketStatus?: 'OPEN' | 'CLOSED' | 'UNKNOWN' }>(`/v1/quotes/${encodeURIComponent(symbol)}`);
    return {
      broker: 'MT5', symbol: data.symbol, displayName: data.displayName ?? data.symbol,
      bid: data.bid, ask: data.ask, last: data.last, timestamp: data.timestamp ?? new Date().toISOString(),
      marketStatus: data.marketStatus ?? 'UNKNOWN', source: 'LIVE',
    };
  }
}

export class Mt5LiveAccountAdapter implements BrokerAccountAdapter {
  readonly broker = 'MT5' as const;

  async getAccountSnapshot(externalAccountId: string): Promise<BrokerAccountSnapshot> {
    return bridgeFetch<BrokerAccountSnapshot>(`/v1/accounts/${encodeURIComponent(externalAccountId)}`);
  }

  async getPositions(externalAccountId: string): Promise<BrokerPosition[]> {
    const data = await bridgeFetch<{ positions: BrokerPosition[] }>(`/v1/accounts/${encodeURIComponent(externalAccountId)}/positions`);
    return data.positions;
  }
}
