import { NextResponse } from 'next/server';
import { DerivLiveMarketAdapter } from '@/lib/brokers/deriv-market';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const symbol = new URL(request.url).searchParams.get('symbol')?.trim();
  if (!symbol) return NextResponse.json({ error: 'SYMBOL_REQUIRED' }, { status: 400 });

  try {
    const quote = await new DerivLiveMarketAdapter().getQuote(symbol);
    return NextResponse.json({ mode: 'LIVE_MARKET_DATA', quote }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'DERIV_QUOTE_FAILED' }, { status: 502 });
  }
}
