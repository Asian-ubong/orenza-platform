'use client';

import { ShieldCheck, WalletCards, LockKeyhole, TrendingUp, CircleDollarSign } from 'lucide-react';
import type { ComponentType } from 'react';

type IconComponent = ComponentType<{ size?: number }>;
type BalanceRow = readonly [string, string, string, IconComponent];

const balances: BalanceRow[] = [
  ['SANDBOX CAPITAL', 'Awaiting allocation', 'Virtual trading capital • never withdrawable', WalletCards],
  ['IN ACTIVE TRADES', 'Awaiting provider/sandbox data', 'Reserved sandbox capital', LockKeyhole],
  ['AVAILABLE SANDBOX', 'Awaiting allocation', 'Unreserved virtual capital', WalletCards],
  ['REALIZED TRADING PROFIT', 'Awaiting settlement', 'Verified provider-reconciled profit', TrendingUp],
  ['WITHDRAWABLE PROFIT', 'Awaiting eligibility', 'Only eligible realized profit', CircleDollarSign],
  ['WITHDRAWN PROFIT', 'Awaiting completed payouts', 'Recorded only after payout completion', CircleDollarSign],
];

export default function SandboxMoneyPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '32px 20px', background: '#07111f', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, opacity: .65, letterSpacing: '.12em', fontSize: 12 }}>ORENZA • SANDBOX TREASURY</p>
            <h1 style={{ margin: '8px 0', fontSize: 'clamp(32px, 6vw, 54px)' }}>Sandbox Capital</h1>
            <p style={{ margin: 0, opacity: .72 }}>Virtual trading capital remains separate from provider balances, real/user funds and payout accounting.</p>
          </div>
          <span style={{ border: '1px solid rgba(255,255,255,.16)', borderRadius: 999, padding: '8px 12px', fontSize: 12 }}>SANDBOX • REAL MONEY DISABLED</span>
        </header>

        <section style={{ marginTop: 28, padding: 28, borderRadius: 24, background: 'linear-gradient(135deg, rgba(31,70,112,.8), rgba(10,24,42,.95))', border: '1px solid rgba(255,255,255,.1)' }}>
          <p style={{ margin: 0, opacity: .7 }}>Current sandbox treasury state</p>
          <strong style={{ display: 'block', marginTop: 8, fontSize: 'clamp(36px, 7vw, 62px)' }}>Provider-backed data required</strong>
          <small style={{ opacity: .7 }}>No invented balance, price, P/L or payout amount is displayed.</small>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginTop: 16 }}>
          {balances.map(([label, value, note, Icon]) => (
            <div key={label} style={{ padding: 20, borderRadius: 18, background: '#0d1b2d', border: '1px solid rgba(255,255,255,.08)' }}>
              <Icon size={19} />
              <small style={{ display: 'block', marginTop: 10, opacity: .6, letterSpacing: '.08em' }}>{label}</small>
              <strong style={{ display: 'block', marginTop: 10, fontSize: 21 }}>{value}</strong>
              <span style={{ display: 'block', marginTop: 6, opacity: .6, fontSize: 13 }}>{note}</span>
            </div>
          ))}
        </div>

        <section style={{ marginTop: 18, padding: 22, borderRadius: 18, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.22)' }}>
          <strong>SANDBOX CAPITAL — VIRTUAL</strong>
          <p style={{ margin: '7px 0 0', opacity: .75 }}>Sandbox capital itself cannot be withdrawn. When a trade closes, returned capital is separated from realized profit. Only eligible realized profit can enter the withdrawable balance.</p>
        </section>

        <section style={{ marginTop: 18, padding: 22, borderRadius: 18, background: '#0d1b2d', border: '1px solid rgba(255,255,255,.08)' }}>
          <h2 style={{ marginTop: 0 }}>Settlement flow</h2>
          <div style={{ display: 'grid', gap: 10, color: 'rgba(248,250,252,.78)' }}>
            {['Sandbox allocation', 'Capital reserved for trade', 'Deriv / MT5 provider result', 'Provider reconciliation', 'Returned sandbox capital', 'Realized profit / loss', 'Eligibility checks', 'Withdrawable profit', 'Payout engine'].map((step, i) => (
              <div key={step} style={{ display: 'flex', gap: 12, alignItems: 'center' }}><b style={{ width: 28, opacity: .55 }}>{String(i + 1).padStart(2, '0')}</b><span>{step}</span></div>
            ))}
          </div>
        </section>

        <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/markets" style={{ borderRadius: 12, padding: '12px 16px', textDecoration: 'none', color: 'inherit', border: '1px solid rgba(255,255,255,.18)' }}>Explore markets</a>
          <a href="/wallet" style={{ borderRadius: 12, padding: '12px 16px', textDecoration: 'none', color: 'inherit', border: '1px solid rgba(255,255,255,.18)' }}>Open wallet</a>
          <a href="/payout" style={{ borderRadius: 12, padding: '12px 16px', textDecoration: 'none', color: 'inherit', border: '1px solid rgba(255,255,255,.18)' }}>Payout</a>
        </div>

        <p style={{ marginTop: 24, opacity: .6, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}><ShieldCheck size={16} /> AI recommendations remain advisory; provider execution, reconciliation and payout eligibility are server-controlled.</p>
      </div>
    </main>
  );
}
