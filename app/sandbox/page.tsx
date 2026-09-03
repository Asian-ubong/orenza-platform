'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, WalletCards, LockKeyhole, TrendingUp, CircleDollarSign } from 'lucide-react';

export default function SandboxMoneyPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('orenza_access_token') : null;
      const response = await fetch('/api/sandbox/welcome-bonus', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'AUTHORIZATION_REQUIRED');
      setData(body);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load sandbox account'); }
    finally { setLoading(false); }
  }

  async function activate() {
    try {
      const token = localStorage.getItem('orenza_access_token');
      if (!token) throw new Error('Please sign in before activating your sandbox welcome capital.');
      const response = await fetch('/api/sandbox/welcome-bonus', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ idempotency_key: `welcome:${token.slice(0, 24)}` }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Activation failed');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Activation failed'); }
  }

  useEffect(() => { void load(); }, []);
  const w = data?.wallet;
  const b = data?.bonus;
  const money = (v: unknown) => `$${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <main style={{ minHeight: '100vh', padding: '32px 20px', background: '#07111f', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div><p style={{ margin: 0, opacity: .65, letterSpacing: '.12em', fontSize: 12 }}>ORENZA • SANDBOX TREASURY</p><h1 style={{ margin: '8px 0', fontSize: 'clamp(32px, 6vw, 54px)' }}>Sandbox Capital</h1><p style={{ margin: 0, opacity: .72 }}>Virtual trading capital is separate from provider balances, real/user funds and payout accounting.</p></div>
          <span style={{ border: '1px solid rgba(255,255,255,.16)', borderRadius: 999, padding: '8px 12px', fontSize: 12 }}>SANDBOX • REAL MONEY DISABLED</span>
        </header>
        <section style={{ marginTop: 28, padding: 28, borderRadius: 24, background: 'linear-gradient(135deg, rgba(31,70,112,.8), rgba(10,24,42,.95))', border: '1px solid rgba(255,255,255,.1)' }}>
          <p style={{ margin: 0, opacity: .7 }}>Welcome sandbox capital</p><strong style={{ display: 'block', marginTop: 8, fontSize: 'clamp(36px, 7vw, 62px)' }}>{loading ? 'Loading…' : w ? money(w.balance) : '$5,000.00'}</strong>
          <small style={{ opacity: .7 }}>{b ? `Active until ${new Date(b.expires_at).toLocaleDateString()}` : 'Virtual capital • 30-day welcome allocation • no cash value'}</small>
          {!w && <button onClick={activate} style={{ marginTop: 18, border: 0, borderRadius: 12, padding: '12px 18px', fontWeight: 700, cursor: 'pointer' }}>Activate $5,000 sandbox capital</button>}
          {error && <p style={{ marginBottom: 0, color: '#fbbf24' }}>{error}</p>}
        </section>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginTop: 16 }}>
          {[[WalletCards,'SANDBOX CAPITAL',money(w?.balance ?? 0),'Virtual trading capital • never withdrawable'],[LockKeyhole,'IN ACTIVE TRADES',money(w?.reserved_balance ?? 0),'Reserved sandbox capital'],[WalletCards,'AVAILABLE SANDBOX',money(w?.available_balance ?? 0),'Unreserved virtual capital'],[TrendingUp,'REALIZED TRADING PROFIT',money(w?.realized_profit ?? 0),'Verified settlement profit'],[CircleDollarSign,'WITHDRAWABLE PROFIT',money(w?.withdrawable_profit ?? 0),'Eligible realized profit only'],[CircleDollarSign,'WITHDRAWN PROFIT',money(w?.withdrawn_profit ?? 0),'Recorded after sandbox payout completion']].map(([Icon,label,value,note]: any) => <div key={label} style={{ padding: 20, borderRadius: 18, background: '#0d1b2d', border: '1px solid rgba(255,255,255,.08)' }}><Icon size={19}/><small style={{ display: 'block', marginTop: 10, opacity: .6, letterSpacing: '.08em' }}>{label}</small><strong style={{ display: 'block', marginTop: 10, fontSize: 21 }}>{value}</strong><span style={{ display: 'block', marginTop: 6, opacity: .6, fontSize: 13 }}>{note}</span></div>)}
        </div>
        <section style={{ marginTop: 18, padding: 22, borderRadius: 18, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.22)' }}><strong>SANDBOX CAPITAL — VIRTUAL</strong><p style={{ margin: '7px 0 0', opacity: .75 }}>The $5,000 welcome allocation has no cash value and cannot itself be withdrawn. Only verified, eligible sandbox trading profit can enter the withdrawal workflow.</p></section>
        <section style={{ marginTop: 18, padding: 22, borderRadius: 18, background: '#0d1b2d', border: '1px solid rgba(255,255,255,.08)' }}><h2 style={{ marginTop: 0 }}>Settlement flow</h2>{['User account','$5,000 sandbox welcome allocation','Sandbox trade','Settlement','Profit calculation','Provider reconciliation','Profit eligibility','Sandbox withdrawal request','Ledger / audit','Paystack TEST simulation'].map((step, i) => <div key={step} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}><b style={{ width: 28, opacity: .55 }}>{String(i + 1).padStart(2, '0')}</b><span>{step}</span></div>)}</section>
        <p style={{ marginTop: 24, opacity: .6, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}><ShieldCheck size={16}/> Real-money payments, withdrawals, transfers, trading and profit payouts remain server-disabled.</p>
      </div>
    </main>
  );
}
