'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, WalletCards, LockKeyhole, TrendingUp, CircleDollarSign, CheckCircle2, PlayCircle, ArrowRight } from 'lucide-react';
import { getSupabaseBrowser } from '../../lib/supabase-browser';

export default function SandboxMoneyPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<any>(null);

  async function authHeaders() {
    const supabase = getSupabaseBrowser();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); throw new Error('AUTHENTICATION_REQUIRED'); }
    return { Authorization: `Bearer ${session.access_token}` };
  }

  async function load() {
    try {
      setLoading(true);
      const headers = await authHeaders();
      const response = await fetch('/api/sandbox/welcome-bonus', { headers, cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Unable to load sandbox account');
      setData(body);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load sandbox account'); }
    finally { setLoading(false); }
  }

  async function activate() {
    try {
      setError('');
      const headers = await authHeaders();
      const response = await fetch('/api/sandbox/welcome-bonus', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ idempotency_key: `welcome:${headers.Authorization.slice(-32)}` }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Activation failed');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Activation failed'); }
  }

  async function verifyE2E() {
    try {
      setVerifying(true); setError(''); setVerification(null);
      const headers = await authHeaders();
      const response = await fetch('/api/sandbox/e2e', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: 'EUR/USD', realized_pnl: 50 }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'E2E verification failed');
      setVerification(body);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'E2E verification failed'); }
    finally { setVerifying(false); }
  }

  useEffect(() => { void load(); }, []);
  const w = data?.wallet;
  const b = data?.bonus;
  const money = (v: unknown) => `$${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <main style={{ minHeight: '100vh', padding: '32px 20px', background: '#07111f', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div><p style={{ margin: 0, opacity: .65, letterSpacing: '.12em', fontSize: 12 }}>ORENZA • SANDBOX TREASURY</p><h1 style={{ margin: '8px 0', fontSize: 'clamp(32px, 6vw, 54px)' }}>Demo / Sandbox</h1><p style={{ margin: 0, opacity: .72 }}>Start with virtual trading. Live trading remains a separate authorization path.</p></div>
          <span style={{ border: '1px solid rgba(255,255,255,.16)', borderRadius: 999, padding: '8px 12px', fontSize: 12 }}>SANDBOX • REAL MONEY DISABLED</span>
        </header>
        <section style={{ marginTop: 28, padding: 28, borderRadius: 24, background: 'linear-gradient(135deg, rgba(31,70,112,.8), rgba(10,24,42,.95))', border: '1px solid rgba(255,255,255,.1)' }}>
          <p style={{ margin: 0, opacity: .7 }}>Current virtual capital</p><strong style={{ display: 'block', marginTop: 8, fontSize: 'clamp(36px, 7vw, 62px)' }}>{loading ? 'Loading…' : w ? money(w.balance) : '$0.00'}</strong>
          <small style={{ opacity: .7 }}>{b ? `Active until ${new Date(b.expires_at).toLocaleDateString()}` : 'No sandbox welcome allocation activated yet.'}</small>
          {!w && <button onClick={activate} style={{ marginTop: 18, border: 0, borderRadius: 12, padding: '12px 18px', fontWeight: 700, cursor: 'pointer' }}>Activate $5,000 sandbox capital</button>}
          <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={verifyE2E} disabled={verifying} style={{ border: 0, borderRadius: 12, padding: '12px 18px', fontWeight: 700, cursor: verifying ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}><PlayCircle size={17}/>{verifying ? 'Running verification…' : 'Run backend E2E verification'}</button>
            <button onClick={() => router.push('/kyc')} style={{ border: '1px solid rgba(255,255,255,.22)', background: 'transparent', color: '#fff', borderRadius: 12, padding: '12px 18px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>Choose Live Trading / KYC <ArrowRight size={17}/></button>
            <button onClick={() => router.push('/mt5')} style={{ border: '1px solid rgba(255,255,255,.22)', background: 'transparent', color: '#fff', borderRadius: 12, padding: '12px 18px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>Continue to MT5 Demo <ArrowRight size={17}/></button>
          </div>
          {error && <p style={{ marginBottom: 0, color: '#fbbf24' }}>{error}</p>}
        </section>
        {verification && <section style={{ marginTop: 18, padding: 22, borderRadius: 18, background: '#0d1b2d', border: '1px solid rgba(255,255,255,.08)' }}><h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle2 size={20}/> Backend E2E result</h2><div style={{ display: 'grid', gap: 8 }}>{Object.entries(verification.steps ?? {}).map(([step, status]) => <div key={step} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}><span>{step.replaceAll('_', ' ')}</span><strong>{String(status)}</strong></div>)}</div><p style={{ marginBottom: 0, opacity: .65, fontSize: 13 }}>This verifier exercises the backend RPC chain. It never submits a real-money order.</p></section>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginTop: 16 }}>
          {[[WalletCards,'SANDBOX CAPITAL',money(w?.balance ?? 0),'Virtual trading capital • never withdrawable'],[LockKeyhole,'IN ACTIVE TRADES',money(w?.reserved_balance ?? 0),'Reserved sandbox capital'],[WalletCards,'AVAILABLE SANDBOX',money(w?.available_balance ?? 0),'Unreserved virtual capital'],[TrendingUp,'REALIZED TRADING PROFIT',money(w?.realized_profit ?? 0),'Verified settlement profit'],[CircleDollarSign,'WITHDRAWABLE PROFIT',money(w?.withdrawable_profit ?? 0),'Eligible realized profit only'],[CircleDollarSign,'WITHDRAWN PROFIT',money(w?.withdrawn_profit ?? 0),'Recorded after sandbox payout completion']].map(([Icon,label,value,note]: any) => <div key={label} style={{ padding: 20, borderRadius: 18, background: '#0d1b2d', border: '1px solid rgba(255,255,255,.08)' }}><Icon size={19}/><small style={{ display: 'block', marginTop: 10, opacity: .6, letterSpacing: '.08em' }}>{label}</small><strong style={{ display: 'block', marginTop: 10, fontSize: 21 }}>{value}</strong><span style={{ display: 'block', marginTop: 6, opacity: .6, fontSize: 13 }}>{note}</span></div>)}
        </div>
        <section style={{ marginTop: 18, padding: 22, borderRadius: 18, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.22)' }}><strong>SANDBOX CAPITAL — VIRTUAL</strong><p style={{ margin: '7px 0 0', opacity: .75 }}>The $5,000 welcome allocation has no cash value and cannot itself be withdrawn. Live trading and real-money payout remain disabled in this test build.</p></section>
        <section style={{ marginTop: 18, padding: 22, borderRadius: 18, background: '#0d1b2d', border: '1px solid rgba(255,255,255,.08)' }}><h2 style={{ marginTop: 0 }}>Next-stage flow</h2>{['Account + email OTP','Dashboard','Demo / Sandbox testing','Choose Live Trading','KYC review','$5,000 sandbox promotional capital','MT5 Demo','Controlled demo trade + reconciliation'].map((step, i) => <div key={step} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}><b style={{ width: 28, opacity: .55 }}>{String(i + 1).padStart(2, '0')}</b><span>{step}</span></div>)}</section>
        <p style={{ marginTop: 24, opacity: .6, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}><ShieldCheck size={16}/> Real-money payments, withdrawals, transfers, trading and profit payouts remain server-disabled.</p>
      </div>
    </main>
  );
}
