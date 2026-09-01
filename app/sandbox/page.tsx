'use client';

import { useEffect, useState } from 'react';

type SandboxData = {
  mode: 'SANDBOX';
  wallet: {
    id: string;
    currency: string;
    balance: number;
    allocated: number;
    available_balance: number;
    reserved_balance: number;
    lifetime_allocated: number;
    daily_allocated: number;
    daily_allocation_date: string | null;
    status: string;
  } | null;
  orders: Array<{
    id: string;
    symbol: string;
    side: string;
    quantity: number;
    entry_price: number;
    notional_usd: number;
    status: string;
    simulated_pnl_usd: number;
    reference_id: string;
    created_at: string;
    settled_at: string | null;
  }>;
  allocations: Array<{ id: string; amount: number; status: string; reference_id: string; requested_at: string }>;
  ledger: Array<{ id: string; entry_type: string; direction: string; amount: number; reference_id: string; created_at: string }>;
};

const money = (value: number) => `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const key = () => `${Date.now()}-${crypto.randomUUID()}`;

export default function SandboxMoneyPage() {
  const [data, setData] = useState<SandboxData | null>(null);
  const [allocationAmount, setAllocationAmount] = useState('100');
  const [symbol, setSymbol] = useState('EURUSD');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('1');
  const [entryPrice, setEntryPrice] = useState('1.00000');
  const [notionalUsd, setNotionalUsd] = useState('50');
  const [status, setStatus] = useState('Loading sandbox state…');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const response = await fetch('/api/sandbox', { cache: 'no-store' });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setStatus(body.error === 'AUTH_REQUIRED' ? 'Sign in is required to use persistent Sandbox Money.' : body.error || 'Unable to load sandbox state.');
      return;
    }
    setData(await response.json());
    setStatus('Sandbox state synchronized.');
  };

  useEffect(() => { void load(); }, []);

  const requestAllocation = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/sandbox/allocation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(allocationAmount), idempotencyKey: key() }),
      });
      const body = await response.json();
      setStatus(response.ok ? `Sandbox allocation created: ${body.allocation?.reference_id ?? 'confirmed'}.` : body.error || 'Allocation rejected.');
      await load();
    } finally { setBusy(false); }
  };

  const placeOrder = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/sandbox/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, side, quantity: Number(quantity), entryPrice: Number(entryPrice), notionalUsd: Number(notionalUsd), idempotencyKey: key() }),
      });
      const body = await response.json();
      setStatus(response.ok ? `Simulated order executed: ${body.order?.reference_id ?? 'confirmed'}.` : body.error || 'Order rejected.');
      await load();
    } finally { setBusy(false); }
  };

  const settleOrder = async (orderId: string, pnlUsd: number) => {
    setBusy(true);
    try {
      const response = await fetch('/api/sandbox/settle', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, pnlUsd }),
      });
      const body = await response.json();
      setStatus(response.ok ? `Sandbox settlement posted: ${money(pnlUsd)} P/L.` : body.error || 'Settlement rejected.');
      await load();
    } finally { setBusy(false); }
  };

  const wallet = data?.wallet;
  return (
    <main style={{ minHeight: '100vh', padding: '32px 20px 64px', background: '#07111f', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, opacity: .65, letterSpacing: '.12em', fontSize: 12 }}>ORENZA • BROKER • TEST ENVIRONMENT</p>
            <h1 style={{ margin: '8px 0', fontSize: 'clamp(32px, 6vw, 54px)' }}>Sandbox Money</h1>
            <p style={{ margin: 0, opacity: .72 }}>Persistent virtual capital, simulated orders and append-only sandbox ledger.</p>
          </div>
          <span style={{ border: '1px solid rgba(255,255,255,.16)', borderRadius: 999, padding: '8px 12px', fontSize: 12 }}>SANDBOX / TEST MODE</span>
        </header>

        <section style={{ marginTop: 28, padding: 28, borderRadius: 24, background: 'linear-gradient(135deg, rgba(31,70,112,.8), rgba(10,24,42,.95))', border: '1px solid rgba(255,255,255,.1)' }}>
          <p style={{ margin: 0, opacity: .7 }}>Sandbox Capital</p>
          <strong style={{ display: 'block', marginTop: 8, fontSize: 'clamp(42px, 8vw, 72px)' }}>{money(wallet?.balance ?? 0)}</strong>
          <small style={{ opacity: .7 }}>Virtual test capital only • never legally withdrawable cash</small>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginTop: 16 }}>
          {[
            ['AVAILABLE', money(wallet?.available_balance ?? 0)],
            ['RESERVED', money(wallet?.reserved_balance ?? 0)],
            ['TODAY ALLOCATED', money(wallet?.daily_allocated ?? 0)],
            ['SANDBOX P/L', money((data?.orders ?? []).reduce((sum, order) => sum + Number(order.simulated_pnl_usd || 0), 0))],
          ].map(([label, value]) => <div key={label} style={{ padding: 20, borderRadius: 18, background: '#0d1b2d', border: '1px solid rgba(255,255,255,.08)' }}><small style={{ opacity: .6, letterSpacing: '.08em' }}>{label}</small><strong style={{ display: 'block', marginTop: 10, fontSize: 25 }}>{value}</strong></div>)}
        </div>

        <section style={{ marginTop: 18, padding: 22, borderRadius: 18, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.22)' }}>
          <strong>SANDBOX CAPITAL — VIRTUAL — NOT PAYOUT ELIGIBLE</strong>
          <p style={{ margin: '7px 0 0', opacity: .75 }}>Version 1 does not accept deposits, execute real trades, withdraw money, transfer money, or pay real profits. All trading and settlement actions are simulated.</p>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 18, marginTop: 18 }}>
          <section style={{ padding: 22, borderRadius: 18, background: '#0d1b2d', border: '1px solid rgba(255,255,255,.08)' }}>
            <h2 style={{ marginTop: 0 }}>Request test capital</h2>
            <p style={{ opacity: .65, fontSize: 14 }}>Backend enforced: $50 minimum, $200 maximum per request, $200 daily allocation limit.</p>
            <input value={allocationAmount} onChange={e => setAllocationAmount(e.target.value)} inputMode="decimal" style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 10, background: '#07111f', color: 'inherit', border: '1px solid rgba(255,255,255,.14)' }} />
            <button disabled={busy} onClick={requestAllocation} style={{ marginTop: 10, width: '100%', padding: 12, border: 0, borderRadius: 10, cursor: 'pointer' }}>Allocate Sandbox USD</button>
          </section>

          <section style={{ padding: 22, borderRadius: 18, background: '#0d1b2d', border: '1px solid rgba(255,255,255,.08)' }}>
            <h2 style={{ marginTop: 0 }}>Simulated trade</h2>
            <div style={{ display: 'grid', gap: 9 }}>
              <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="Symbol" style={{ padding: 12, borderRadius: 10, background: '#07111f', color: 'inherit', border: '1px solid rgba(255,255,255,.14)' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}><button onClick={() => setSide('BUY')} style={{ padding: 11, borderRadius: 10, border: side === 'BUY' ? '1px solid #fff' : '1px solid rgba(255,255,255,.14)', background: side === 'BUY' ? 'rgba(255,255,255,.12)' : 'transparent', color: 'inherit' }}>BUY</button><button onClick={() => setSide('SELL')} style={{ padding: 11, borderRadius: 10, border: side === 'SELL' ? '1px solid #fff' : '1px solid rgba(255,255,255,.14)', background: side === 'SELL' ? 'rgba(255,255,255,.12)' : 'transparent', color: 'inherit' }}>SELL</button></div>
              <input value={quantity} onChange={e => setQuantity(e.target.value)} inputMode="decimal" placeholder="Quantity" style={{ padding: 12, borderRadius: 10, background: '#07111f', color: 'inherit', border: '1px solid rgba(255,255,255,.14)' }} />
              <input value={entryPrice} onChange={e => setEntryPrice(e.target.value)} inputMode="decimal" placeholder="Simulated reference price" style={{ padding: 12, borderRadius: 10, background: '#07111f', color: 'inherit', border: '1px solid rgba(255,255,255,.14)' }} />
              <input value={notionalUsd} onChange={e => setNotionalUsd(e.target.value)} inputMode="decimal" placeholder="Notional USD" style={{ padding: 12, borderRadius: 10, background: '#07111f', color: 'inherit', border: '1px solid rgba(255,255,255,.14)' }} />
              <button disabled={busy} onClick={placeOrder} style={{ padding: 12, border: 0, borderRadius: 10, cursor: 'pointer' }}>Execute simulated order</button>
            </div>
          </section>
        </div>

        <section style={{ marginTop: 18, padding: 22, borderRadius: 18, background: '#0d1b2d', border: '1px solid rgba(255,255,255,.08)' }}>
          <h2 style={{ marginTop: 0 }}>Sandbox orders</h2>
          {(data?.orders ?? []).length === 0 ? <p style={{ opacity: .6 }}>No sandbox orders yet.</p> : <div style={{ display: 'grid', gap: 10 }}>{data?.orders.map(order => <div key={order.id} style={{ padding: 14, borderRadius: 12, background: '#07111f', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div><strong>{order.side} {order.symbol}</strong><div style={{ opacity: .6, fontSize: 12 }}>{order.reference_id} • {order.status} • {money(order.notional_usd)}</div></div>{order.status === 'EXECUTED' && <div style={{ display: 'flex', gap: 6 }}><button disabled={busy} onClick={() => settleOrder(order.id, 10)} style={{ padding: '8px 10px', borderRadius: 8, border: 0 }}>Simulate +$10</button><button disabled={busy} onClick={() => settleOrder(order.id, -10)} style={{ padding: '8px 10px', borderRadius: 8, background: 'transparent', color: 'inherit', border: '1px solid rgba(255,255,255,.14)' }}>Simulate -$10</button></div>}</div>)}</div>}
        </section>

        <section style={{ marginTop: 18, padding: 22, borderRadius: 18, background: '#0d1b2d', border: '1px solid rgba(255,255,255,.08)' }}>
          <h2 style={{ marginTop: 0 }}>Activity ledger</h2>
          {(data?.ledger ?? []).length === 0 ? <p style={{ opacity: .6 }}>No ledger entries yet.</p> : <div style={{ display: 'grid', gap: 8 }}>{data?.ledger.slice(0, 20).map(entry => <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}><span>{entry.entry_type} <small style={{ opacity: .5 }}>{entry.reference_id}</small></span><strong>{entry.direction === 'DEBIT' ? '-' : '+'}{money(entry.amount)}</strong></div>)}</div>}
        </section>

        <p style={{ marginTop: 18, opacity: .55, fontSize: 13 }}>Status: {status}</p>
      </div>
    </main>
  );
}
