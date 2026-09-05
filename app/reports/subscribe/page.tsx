'use client';

import { FormEvent, useState } from 'react';

export default function ReportSubscriptionPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setState('loading');
    setMessage('');
    try {
      const response = await fetch('/api/reports/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'We could not create the subscription.');
      setState('success');
      setMessage(data.message || 'Check your inbox to confirm the subscription.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'We could not create the subscription.');
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FAF9F6', color: '#17251B', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: '100%', maxWidth: 560, background: '#fff', border: '1px solid #DDE6DF', borderRadius: 24, padding: 32, boxShadow: '0 20px 60px rgba(11,31,20,.08)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24, color: '#0B1928', fontWeight: 800, letterSpacing: '.12em' }}>
          <span style={{ width: 38, height: 38, borderRadius: 12, background: '#082B1B', display: 'grid', placeItems: 'center', color: '#D4A83D' }}>R</span>
          ORENZA
        </div>
        <p style={{ color: '#8A6A20', fontWeight: 800, letterSpacing: '.12em', fontSize: 12 }}>OPERATIONAL REPORTS</p>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', lineHeight: 1.08, margin: '8px 0 12px' }}>Know when ORENZA needs you.</h1>
        <p style={{ color: '#647067', lineHeight: 1.6 }}>
          Subscribe to the ORENZA operational report stream. You can receive successful and failed GitHub workflow reports, Supabase/system health reports, and release/build alerts in one inbox.
        </p>

        <form onSubmit={submit} style={{ marginTop: 28 }}>
          <label htmlFor="report-email" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>Your email address</label>
          <input
            id="report-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={state === 'loading'}
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #CBD7CE', borderRadius: 14, padding: '15px 16px', fontSize: 16, outline: 'none' }}
          />
          <button
            type="submit"
            disabled={state === 'loading'}
            style={{ width: '100%', marginTop: 12, border: 0, borderRadius: 14, padding: '15px 18px', background: '#0B6B3A', color: '#fff', fontWeight: 800, fontSize: 15, cursor: state === 'loading' ? 'wait' : 'pointer', opacity: state === 'loading' ? .7 : 1 }}
          >
            {state === 'loading' ? 'SUBSCRIBING…' : 'SUBSCRIBE TO REPORTS'}
          </button>
        </form>

        {message && (
          <div role="status" style={{ marginTop: 18, borderRadius: 14, padding: 14, background: state === 'error' ? '#FFF4F2' : '#EEF8F1', color: state === 'error' ? '#9A2F25' : '#17623A', lineHeight: 1.5 }}>
            {message}
          </div>
        )}

        <p style={{ marginTop: 22, color: '#7B847E', fontSize: 13, lineHeight: 1.5 }}>
          Reports never include passwords, API keys, OTP values, private keys, or full KYC documents. A confirmation email is required before reports are delivered.
        </p>
      </section>
    </main>
  );
}
