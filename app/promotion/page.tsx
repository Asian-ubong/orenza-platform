'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { getSupabaseBrowser } from '../../lib/supabase-browser';
import { useRouter } from 'next/navigation';

const TESTER_PROMO_CODE = 'ORENZA-74C74D6DE948744F';

export default function PromotionPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function activate() {
    setError('');
    setMessage('');
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setError('Enter the promotion code to continue.');
      return;
    }

    try {
      setBusy(true);
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.replace('/login');
        return;
      }

      const response = await fetch('/api/tester-access/claim', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: normalized }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || body.error || 'This promotion code is not approved for the test program.');
      }

      sessionStorage.setItem('orenza_tester_access', 'active');
      setMessage(`Tester access approved until ${new Date(body.expires_at).toLocaleDateString()}. Opening your ORENZA workspace…`);
      window.setTimeout(() => router.replace('/home'), 500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Promotion activation failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="authCanvas">
      <section className="authCard otpCard" style={{ maxWidth: 680 }}>
        <div className="authBrand">
          <img src="/brand/orenza-mark.svg" alt="ORENZA" />
          <div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div>
        </div>

        <p className="eyebrow">STEP 3 · PROMOTION ACCESS</p>
        <h1>Enter your ORENZA promo code</h1>
        <p className="authSub">
          Your account is verified. Enter the approved promotion code below to activate your ORENZA test access and continue to your workspace.
        </p>

        <div className="authNotice">
          <LockKeyhole size={17} />
          <span>Promotion access is separate from authentication, KYC and any future real-money authorization. The current test environment uses sandbox/demo activity only.</span>
        </div>

        <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
          <label style={{ fontWeight: 800, fontSize: 12 }}>
            PROMO CODE
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              placeholder="Enter promo code"
              aria-label="Promo code"
              disabled={busy}
              style={{ marginTop: 8, letterSpacing: '0.04em' }}
            />
          </label>

          <div style={{ fontSize: 12, lineHeight: 1.5, color: '#4f5d50' }}>
            Approved test promo code: <strong>{TESTER_PROMO_CODE}</strong>
          </div>

          <button type="button" className="btn full" onClick={activate} disabled={busy || !code.trim()}>
            {busy ? 'Continuing…' : 'Continue'} <ArrowRight size={17} />
          </button>
        </div>

        {message && <div className="verifiedHint"><CheckCircle2 size={15} /> {message}</div>}
        {error && <div className="authError" role="alert">{error}</div>}

        <div className="splashTrust">
          <ShieldCheck size={16} />
          <span>Test access does not grant real-money execution, withdrawals or payout authority.</span>
        </div>
      </section>
    </main>
  );
}
