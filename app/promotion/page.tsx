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

      const status = await fetch('/api/tester-access/status', {
        method: 'GET',
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      if (!status.ok) {
        const statusBody = await status.json().catch(() => ({}));
        throw new Error(statusBody.message || statusBody.error || 'Promotion was received, but tester access could not be verified. Please try Continue again.');
      }

      sessionStorage.setItem('orenza_tester_access', 'active');
      setMessage(`Tester access approved until ${new Date(body.expires_at).toLocaleDateString()}. Opening your ORENZA workspace…`);
      window.setTimeout(() => router.replace('/home'), 250);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Promotion activation failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="authCanvas promoCanvas">
      <section className="authCard otpCard promoCard" style={{ maxWidth: 680 }}>
        <style>{`
          .promoCanvas { background: var(--or-bg) !important; color: var(--or-text) !important; }
          .promoCard { background: var(--or-surface) !important; color: var(--or-text) !important; border-color: var(--or-border) !important; }
          .promoCard h1 { color: var(--or-text) !important; }
          .promoCard .authSub { color: var(--or-muted) !important; }
          .promoCard label { color: var(--or-text) !important; }
          .promoInput { width:100%; background:var(--or-surface-2) !important; color:var(--or-text) !important; border:1px solid var(--or-border-strong) !important; border-radius:10px; padding:13px 14px; outline:none; font-weight:700; }
          .promoInput::placeholder { color:var(--or-muted-2) !important; opacity:1; }
          .promoInput:focus { border-color:var(--or-gold) !important; box-shadow:0 0 0 3px rgba(201,160,99,.18); }
          .promoCode { color:#4f8b62 !important; font-size:14px; font-weight:900; letter-spacing:.08em; user-select:text; overflow-wrap:anywhere; }
          .promoCodeLabel { color:var(--or-muted) !important; }
          .promoContinue { background:#315f3d !important; color:#fff !important; }
          .promoContinue:hover { background:#3b7049 !important; }
          @media (prefers-color-scheme:dark) {
            .promoCanvas { background:#0d1511 !important; }
            .promoCard { background:#17221c !important; border-color:#3f5245 !important; }
            .promoCard h1,.promoCard label { color:#f4f6f2 !important; }
            .promoCard .authSub { color:#b8c1ba !important; }
            .promoInput { background:#111b16 !important; color:#f4f6f2 !important; border-color:#4a5a4f !important; }
            .promoInput::placeholder { color:#aeb9b0 !important; }
            .promoCode { color:#9be0aa !important; }
          }
        `}</style>

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
              className="promoInput"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              placeholder="Enter promo code"
              aria-label="Promo code"
              disabled={busy}
            />
          </label>

          <div className="promoCodeLabel" style={{ fontSize: 12, lineHeight: 1.5 }}>
            Approved test promo code: <strong className="promoCode">{TESTER_PROMO_CODE}</strong>
          </div>

          <button type="button" className="btn full promoContinue" onClick={activate} disabled={busy || !code.trim()}>
            {busy ? 'Verifying access…' : 'Continue'} <ArrowRight size={17} />
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
