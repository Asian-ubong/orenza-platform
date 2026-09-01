import { NextResponse } from 'next/server';
import { DerivLiveMarketAdapter } from '@/lib/brokers/deriv-market';

export const runtime = 'nodejs';

const DEFAULT_SYMBOLS = ['frxEURUSD', 'frxGBPUSD', 'frxUSDJPY', 'cryBTCUSD', 'cryETHUSD'];

export async function GET(request: Request) {
  const symbols = (new URL(request.url).searchParams.get('symbols')?.split(',').map((x) => x.trim()).filter(Boolean) ?? DEFAULT_SYMBOLS).slice(0, 10);
  const adapter = new DerivLiveMarketAdapter();
  const quotes = await Promise.all(symbols.map(async (symbol) => {
    try { return await adapter.getQuote(symbol); }
    catch { return { symbol, source: 'LIVE' as const, error: 'QUOTE_UNAVAILABLE' }; }
  }));
  return NextResponse.json({ source: 'DERIV', environment: 'PUBLIC_LIVE_MARKET_DATA', timestamp: new Date().toISOString(), quotes }, { headers: { 'Cache-Control': 'no-store' } });
}
