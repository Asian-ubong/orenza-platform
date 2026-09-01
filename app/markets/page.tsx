'use client';

import { useEffect, useState } from 'react';

const markets = [
  ['frxEURUSD', 'EUR/USD', 'Forex'],
  ['frxGBPUSD', 'GBP/USD', 'Forex'],
  ['frxUSDJPY', 'USD/JPY', 'Forex'],
  ['cryBTCUSD', 'BTC/USD', 'Crypto'],
  ['cryETHUSD', 'ETH/USD', 'Crypto'],
] as const;

type Quote = { symbol: string; price?: number; bid?: number; ask?: number; change?: number; changePercent?: number; source?: string; error?: string };

export default function MarketsPage() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [updated, setUpdated] = useState<string>('');

  async function load() {
    const response = await fetch(`/api/markets/deriv/quotes?symbols=${markets.map(([s]) => s).join(',')}`, { cache: 'no-store' });
    if (!response.ok) return;
    const body = await response.json() as { quotes: Quote[]; timestamp: string };
    setQuotes(Object.fromEntries(body.quotes.map((q) => [q.symbol, q])));
    setUpdated(body.timestamp);
  }

  useEffect(() => { void load(); const timer = setInterval(() => void load(), 5000); return () => clearInterval(timer); }, []);

  return <main style={{ minHeight: '100vh', padding: '48px 24px', background: '#071018', color: '#f5f7fa' }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'end', marginBottom: 28 }}>
        <div><p style={{ letterSpacing: 2, opacity: .65 }}>SUPPORTED MARKETS</p><h1 style={{ fontSize: 42, margin: '8px 0' }}>Live Markets</h1><p style={{ opacity: .7 }}>Deriv public market data • read-only • no trade execution</p></div>
        <div style={{ fontSize: 12, opacity: .6 }}>{updated ? `Updated ${new Date(updated).toLocaleTimeString()}` : 'Connecting…'}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        {markets.map(([symbol, name, category]) => {
          const q = quotes[symbol];
          const value = q?.price ?? q?.bid;
          return <article key={symbol} style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 18, padding: 20, background: 'rgba(255,255,255,.035)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><div><strong style={{ fontSize: 18 }}>{name}</strong><div style={{ opacity: .55, marginTop: 4 }}>{category} • {symbol}</div></div><span style={{ fontSize: 11, padding: '5px 8px', borderRadius: 999, border: '1px solid rgba(255,255,255,.14)' }}>{q?.error ? 'UNAVAILABLE' : 'LIVE'}</span></div>
            <div style={{ fontSize: 30, marginTop: 24, fontVariantNumeric: 'tabular-nums' }}>{value == null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 8 })}</div>
            <div style={{ display: 'flex', gap: 18, marginTop: 12, opacity: .7, fontSize: 13 }}><span>Bid {q?.bid?.toLocaleString(undefined, { maximumFractionDigits: 8 }) ?? '—'}</span><span>Ask {q?.ask?.toLocaleString(undefined, { maximumFractionDigits: 8 }) ?? '—'}</span></div>
          </article>;
        })}
      </div>
      <div style={{ marginTop: 24, padding: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', opacity: .7, fontSize: 13 }}>Market data is provider-sourced. ORENZA does not invent prices, signals or performance. Real trading remains disabled.</div>
    </div>
  </main>;
}
