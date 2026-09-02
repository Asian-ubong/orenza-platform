'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, BarChart3, Globe2, RefreshCw, Search, ShieldCheck } from 'lucide-react';

type DerivSymbol = {
  underlying_symbol: string;
  underlying_symbol_name: string;
  underlying_symbol_type: string;
  market: string;
  subgroup?: string;
  submarket?: string;
  exchange_is_open?: number;
  is_trading_suspended?: number;
};

type Tick = { quote: number | string; epoch: number };

const FINANCIAL_MARKETS = new Set(['forex', 'stocks', 'stock_indices', 'indices', 'commodities', 'cryptocurrency', 'crypto', 'etf', 'etfs']);

function isRealWorld(symbol: DerivSymbol) {
  const market = String(symbol.market || '').toLowerCase();
  const type = String(symbol.underlying_symbol_type || '').toLowerCase();
  return FINANCIAL_MARKETS.has(market) || FINANCIAL_MARKETS.has(type) || market.includes('stock') || market.includes('forex') || market.includes('commodit') || market.includes('crypto');
}

function category(symbol: DerivSymbol) {
  const value = `${symbol.market} ${symbol.underlying_symbol_type}`.toLowerCase();
  if (value.includes('forex')) return 'Forex';
  if (value.includes('stock') && !value.includes('index')) return 'Stocks';
  if (value.includes('index')) return 'Indices';
  if (value.includes('commodit')) return 'Commodities';
  if (value.includes('crypto')) return 'Crypto';
  if (value.includes('etf')) return 'ETFs';
  return 'Other';
}

export default function MarketsPage() {
  const [symbols, setSymbols] = useState<DerivSymbol[]>([]);
  const [derived, setDerived] = useState<DerivSymbol[]>([]);
  const [selected, setSelected] = useState('');
  const [tick, setTick] = useState<Tick | null>(null);
  const [status, setStatus] = useState<'connecting' | 'live' | 'error'>('connecting');
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    const ws = new WebSocket('wss://api.derivws.com/trading/v1/options/ws/public');
    ws.onopen = () => ws.send(JSON.stringify({ active_symbols: 'brief', req_id: 1 }));
    ws.onmessage = event => {
      const data = JSON.parse(event.data);
      if (data.msg_type === 'active_symbols') {
        const all = Array.isArray(data.active_symbols) ? data.active_symbols : [];
        setSymbols(all.filter(isRealWorld));
        setDerived(all.filter((s: DerivSymbol) => !isRealWorld(s)));
        setUpdatedAt(Date.now());
        setStatus('live');
      }
    };
    ws.onerror = () => setStatus('error');
    return () => ws.close();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const ws = new WebSocket('wss://api.derivws.com/trading/v1/options/ws/public');
    ws.onopen = () => ws.send(JSON.stringify({ ticks: selected, subscribe: 1, req_id: 2 }));
    ws.onmessage = event => {
      const data = JSON.parse(event.data);
      if (data.msg_type === 'tick' && data.tick) setTick({ quote: data.tick.quote, epoch: data.tick.epoch });
    };
    return () => ws.close();
  }, [selected]);

  const categories = ['All', 'Forex', 'Stocks', 'Indices', 'Commodities', 'Crypto', 'ETFs'];
  const visible = useMemo(() => symbols.filter(s => {
    const name = `${s.underlying_symbol_name} ${s.underlying_symbol}`.toLowerCase();
    return (filter === 'All' || category(s) === filter) && name.includes(query.toLowerCase());
  }), [symbols, filter, query]);

  return <main className="marketsPage">
    <header className="marketsHero">
      <div>
        <p className="eyebrow">AURENZA BROKER · LIVE MARKETS</p>
        <h1>Real-world markets</h1>
        <p>Live market availability is read directly from Deriv. No hardcoded prices or invented instruments.</p>
      </div>
      <div className="liveState"><span className={status === 'live' ? 'liveDot' : 'statusDot'} />{status === 'live' ? 'DERIV MARKET FEED LIVE' : status === 'error' ? 'FEED ERROR' : 'CONNECTING'}</div>
    </header>

    <section className="marketStats">
      <div><span>REAL-WORLD INSTRUMENTS</span><strong>{symbols.length}</strong><small>Currently returned by Deriv</small></div>
      <div><span>DERIVED / OTHER</span><strong>{derived.length}</strong><small>Available separately, not mixed with financial markets</small></div>
      <div><span>DATA SOURCE</span><strong>DERIV</strong><small>{updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString()}` : 'Waiting for feed'}</small></div>
    </section>

    <section className="marketToolbar">
      <div className="marketSearch"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search markets, symbols…" /></div>
      <button className="refreshButton" onClick={() => window.location.reload()}><RefreshCw size={16}/>Refresh</button>
    </section>

    <div className="marketTabs">{categories.map(item => <button key={item} onClick={() => setFilter(item)} className={filter === item ? 'active' : ''}>{item}</button>)}</div>

    <section className="selectedMarket">
      <div><span className="label">LIVE QUOTE</span><strong>{selected ? (symbols.find(s => s.underlying_symbol === selected)?.underlying_symbol_name || selected) : 'Select a market'}</strong></div>
      <div className="quote">{tick ? Number(tick.quote).toLocaleString(undefined, { maximumFractionDigits: 8 }) : '—'}</div>
      <small>{tick ? `Tick ${new Date(tick.epoch * 1000).toLocaleTimeString()}` : 'Select an instrument below to stream its real-time price.'}</small>
    </section>

    <section className="marketList">
      {status === 'error' && <div className="marketEmpty"><ShieldCheck size={22}/><strong>Deriv market feed could not be reached.</strong><span>Check the connection and refresh. The app will not substitute fake prices.</span></div>}
      {status !== 'error' && visible.length === 0 && <div className="marketEmpty"><Activity size={22}/><strong>{status === 'connecting' ? 'Loading Deriv markets…' : 'No matching markets.'}</strong><span>Availability changes with provider conditions and account/product access.</span></div>}
      {visible.map(symbol => {
        const open = symbol.exchange_is_open === 1;
        const suspended = symbol.is_trading_suspended === 1;
        return <button key={symbol.underlying_symbol} className={`marketRow ${selected === symbol.underlying_symbol ? 'selected' : ''}`} onClick={() => { setSelected(symbol.underlying_symbol); setTick(null); }}>
          <div className="marketIcon">{category(symbol) === 'Forex' ? <Globe2 size={18}/> : category(symbol) === 'Indices' ? <BarChart3 size={18}/> : <ArrowUpRight size={18}/>}</div>
          <div className="marketName"><strong>{symbol.underlying_symbol_name || symbol.underlying_symbol}</strong><small>{symbol.underlying_symbol} · {category(symbol)}</small></div>
          <span className={`marketStatus ${suspended ? 'warn' : open ? 'open' : 'closed'}`}>{suspended ? 'SUSPENDED' : open ? 'OPEN' : 'CLOSED'}</span>
          <span className="marketArrow">›</span>
        </button>;
      })}
    </section>

    <footer className="marketsNote"><ShieldCheck size={17}/><span>Availability comes from Deriv's active-symbols feed. Some instruments may be unavailable in particular countries, account types, or products. AURENZA never fabricates market availability.</span></footer>
  </main>;
}
