'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, MailCheck, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '../../lib/supabase-browser';

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(true);
  const [flow, setFlow] = useState<'signup'|'login'>('signup');

  useEffect(() => {
    const saved = sessionStorage.getItem('orenza_pending_email') || '';
    const savedFlow = sessionStorage.getItem('orenza_auth_flow') === 'login' ? 'login' : 'signup';
    setEmail(saved); setFlow(savedFlow);
    if (!saved) setError('No pending verification was found. Start with registration or login.');
  }, []);

  async function verify(event: FormEvent) {
    event.preventDefault(); setError('');
    if (!email || !/^\d{6}$/.test(otp.trim())) return setError('Enter the current 6-digit code from your Orenza email.');
    try {
      setBusy(true);
      const supabase = getSupabaseBrowser();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: 'email' });
      if (verifyError) throw verifyError;
      if (!data.user || !data.session) throw new Error('Verification succeeded but no authenticated session was returned.');
      sessionStorage.removeItem('orenza_pending_email');
      sessionStorage.removeItem('orenza_pending_name');
      sessionStorage.removeItem('orenza_pending_phone');
      sessionStorage.removeItem('orenza_pending_password');
      sessionStorage.removeItem('orenza_auth_flow');
      sessionStorage.removeItem('orenza_auth_challenge_id');
      router.replace('/home');
    } catch (e) { setError(e instanceof Error ? e.message : 'The verification could not be completed.'); }
    finally { setBusy(false); }
  }

  async function resend() {
    setError(''); if (!email) return;
    try {
      setBusy(true);
      const supabase = getSupabaseBrowser();
      const result = flow === 'signup'
        ? await supabase.auth.resend({ type: 'signup', email })
        : await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (result.error) throw result.error;
      setSent(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'A new verification code could not be sent.'); }
    finally { setBusy(false); }
  }

  return <main className="authCanvas"><section className="authCard otpCard">
    <div className="authBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA" /><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div>
    <div className="otpIcon"><MailCheck size={26}/></div><p className="eyebrow">AUTOMATED SECURITY VERIFICATION</p><h1>Verify your account</h1>
    <p className="authSub">Orenza sends a unique 6-digit code to <strong>{email || 'your email'}</strong>. After verification, your account opens the dashboard. KYC is only required when you choose live trading.</p>
    <div className="authNotice"><ShieldCheck size={17}/><span>Email verification is automatic. Your phone number is not used for OTP delivery.</span></div>
    <form onSubmit={verify} className="authForm">
      <label>6-digit verification code<input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} required /></label>
      <button className="btn full authSubmit" disabled={busy || otp.length !== 6}>{busy?'Verifying…':'Verify and continue to dashboard'} <ArrowRight size={17}/></button>
    </form>
    {error && <div className="authError" role="alert">{error}</div>}{sent && <div className="verifiedHint"><CheckCircle2 size={15}/> Check your inbox and spam folder for the newest code.</div>}
    <button type="button" className="textButton" onClick={resend} disabled={busy}>Send a new 6-digit code</button>
  </section></main>;
}
