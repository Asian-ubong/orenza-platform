import type { BrokerMarketAdapter, NormalizedMarket } from './types';

const DERIV_PUBLIC_WS = 'wss://api.derivws.com/trading/v1/options/ws/public';

function request(ws: WebSocket, payload: Record<string, unknown>, timeoutMs = 8000): Promise<any> {
  return new Promise((resolve, reject) => {
    const reqId = Math.floor(Math.random() * 1_000_000_000);
    const timer = setTimeout(() => reject(new Error('DERIV_REQUEST_TIMEOUT')), timeoutMs);
    const onMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(String(event.data));
        if (message.req_id !== reqId) return;
        clearTimeout(timer);
        ws.removeEventListener('message', onMessage);
        if (message.error) reject(new Error(message.error.message ?? 'DERIV_API_ERROR'));
        else resolve(message);
      } catch (error) {
        clearTimeout(timer);
        ws.removeEventListener('message', onMessage);
        reject(error);
      }
    };
    ws.addEventListener('message', onMessage);
    ws.send(JSON.stringify({ ...payload, req_id: reqId }));
  });
}

async function withPublicSocket<T>(fn: (ws: WebSocket) => Promise<T>): Promise<T> {
  const ws = new WebSocket(DERIV_PUBLIC_WS);
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('DERIV_CONNECTION_TIMEOUT')), 8000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('DERIV_CONNECTION_FAILED')); }, { once: true });
  });
  try { return await fn(ws); } finally { ws.close(); }
}

export class DerivLiveMarketAdapter implements BrokerMarketAdapter {
  readonly broker = 'DERIV' as const;

  async getMarkets(): Promise<NormalizedMarket[]> {
    return withPublicSocket(async (ws) => {
      const response = await request(ws, { active_symbols: 'brief' });
      return (response.active_symbols ?? []).map((market: any) => ({
        broker: 'DERIV',
        symbol: String(market.symbol),
        displayName: String(market.display_name ?? market.symbol),
        assetClass: market.market,
        timestamp: new Date().toISOString(),
        marketStatus: market.exchange_is_open === 1 ? 'OPEN' : 'CLOSED',
        source: 'LIVE',
      }));
    });
  }

  async getQuote(symbol: string): Promise<NormalizedMarket> {
    if (!symbol.trim()) throw new Error('DERIV_SYMBOL_REQUIRED');
    return withPublicSocket(async (ws) => {
      const response = await request(ws, { ticks: symbol.trim() });
      const tick = response.tick;
      if (!tick) throw new Error('DERIV_QUOTE_UNAVAILABLE');
      const quote = Number(tick.quote);
      return {
        broker: 'DERIV',
        symbol: String(tick.symbol ?? symbol),
        displayName: String(tick.symbol ?? symbol),
        bid: Number.isFinite(Number(tick.bid)) ? Number(tick.bid) : undefined,
        ask: Number.isFinite(Number(tick.ask)) ? Number(tick.ask) : undefined,
        last: Number.isFinite(quote) ? quote : undefined,
        timestamp: new Date(Number(tick.epoch) * 1000 || Date.now()).toISOString(),
        marketStatus: 'OPEN',
        source: 'LIVE',
      };
    });
  }
}
