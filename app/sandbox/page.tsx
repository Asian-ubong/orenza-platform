'use client';

import { useState } from 'react';

const initialBalance = 100000;

export default function SandboxMoneyPage() {
  const [available, setAvailable] = useState(initialBalance);
  const [reserved, setReserved] = useState(0);
  const [activity, setActivity] = useState(0);
  const [message, setMessage] = useState('No sandbox activity yet.');

  const startVirtualActivity = () => {
    const amount = 1000;
    if (available < amount) return;
    setAvailable((v) => v - amount);
    setReserved((v) => v + amount);
    setActivity((v) => v + 1);
    setMessage(`Virtual activity reserved: $${amount.toLocaleString()}. No real funds moved.`);
  };

  const releaseVirtualActivity = () => {
    if (reserved === 0) return;
    setAvailable((v) => v + reserved);
    setReserved(0);
    setMessage('Virtual reservation released back to Sandbox Money.');
  };

  return (
    <main style={{ minHeight: '100vh', padding: '32px 20px', background: '#07111f', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, opacity: .65, letterSpacing: '.12em', fontSize: 12 }}>ORENZA • VIRTUAL ENVIRONMENT</p>
            <h1 style={{ margin: '8px 0', fontSize: 'clamp(32px, 6vw, 54px)' }}>Sandbox Money</h1>
            <p style={{ margin: 0, opacity: .72 }}>A controlled virtual trading balance. It is never treated as real cash.</p>
          </div>
          <span style={{ border: '1px solid rgba(255,255,255,.16)', borderRadius: 999, padding: '8px 12px', fontSize: 12 }}>VIRTUAL • NOT PAYOUT ELIGIBLE</span>
        </div>

        <section style={{ marginTop: 28, padding: 28, borderRadius: 24, background: 'linear-gradient(135deg, rgba(31,70,112,.8), rgba(10,24,42,.95))', border: '1px solid rgba(255,255,255,.1)' }}>
          <p style={{ margin: 0, opacity: .7 }}>Virtual Capital</p>
          <strong style={{ display: 'block', marginTop: 8, fontSize: 'clamp(42px, 8vw, 72px)' }}>${(available + reserved).toLocaleString()}</strong>
          <small style={{ opacity: .7 }}>Original allocation: $100,000 • Sandbox only</small>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginTop: 16 }}>
          {[
            ['AVAILABLE', `$${available.toLocaleString()}`, 'Virtual funds available'],
            ['RESERVED', `$${reserved.toLocaleString()}`, 'Virtual activity reserved'],
            ['IN ACTIVITY', activity.toString(), 'Virtual activity count'],
            ['SANDBOX P/L', '$0.00', 'No simulated profit reported'],
          ].map(([label, value, note]) => (
            <div key={label} style={{ padding: 20, borderRadius: 18, background: '#0d1b2d', border: '1px solid rgba(255,255,255,.08)' }}>
              <small style={{ opacity: .6, letterSpacing: '.08em' }}>{label}</small>
              <strong style={{ display: 'block', marginTop: 10, fontSize: 26 }}>{value}</strong>
              <span style={{ display: 'block', marginTop: 6, opacity: .6, fontSize: 13 }}>{note}</span>
            </div>
          ))}
        </div>

        <section style={{ marginTop: 18, padding: 22, borderRadius: 18, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.22)' }}>
          <strong>SANDBOX CAPITAL — VIRTUAL</strong>
          <p style={{ margin: '7px 0 0', opacity: .75 }}>This balance cannot be withdrawn and is not automatically eligible for payout. Real-money operations remain server-controlled.</p>
        </section>

        <section style={{ marginTop: 18, padding: 22, borderRadius: 18, background: '#0d1b2d', border: '1px solid rgba(255,255,255,.08)' }}>
          <h2 style={{ marginTop: 0 }}>Sandbox controls</h2>
          <p style={{ opacity: .65 }}>{message}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={startVirtualActivity} style={{ border: 0, borderRadius: 12, padding: '12px 16px', cursor: 'pointer' }}>Start virtual activity</button>
            <button onClick={releaseVirtualActivity} style={{ borderRadius: 12, padding: '12px 16px', cursor: 'pointer', background: 'transparent', color: 'inherit', border: '1px solid rgba(255,255,255,.18)' }}>Release reservation</button>
            <a href="/markets" style={{ borderRadius: 12, padding: '12px 16px', textDecoration: 'none', color: 'inherit', border: '1px solid rgba(255,255,255,.18)' }}>Explore markets</a>
          </div>
        </section>
      </div>
    </main>
  );
}
