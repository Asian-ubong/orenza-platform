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
    setEmail(saved);
    setFlow(savedFlow);
    if (!saved) setError('No pending verification was found. Start with registration or login.');
  }, []);

  async function verify(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!email || !/^\d{6}$/.test(otp.trim())) return setError('Enter the 6-digit OTP sent to your email.');
    try {
      setBusy(true);
      const supabase = getSupabaseBrowser();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp.trim(),
        type: flow === 'login' ? 'email' : 'signup',
      });
      if (verifyError) throw verifyError;
      sessionStorage.removeItem('orenza_pending_email');
      sessionStorage.removeItem('orenza_auth_flow');
      router.replace('/private-access');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The OTP could not be verified.');
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError('');
    if (!email) return;
    try {
      setBusy(true);
      const supabase = getSupabaseBrowser();
      const { error: resendError } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (resendError) throw resendError;
      setFlow('login');
      sessionStorage.setItem('orenza_auth_flow', 'login');
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'A new OTP could not be sent.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="authCanvas">
    <section className="authCard otpCard">
      <div className="authBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA" /><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div>
      <div className="otpIcon"><MailCheck size={26}/></div>
      <p className="eyebrow">AUTOMATED SECURITY VERIFICATION</p>
      <h1>Verify your account</h1>
      <p className="authSub">A unique one-time verification code was sent to <strong>{email || 'your email'}</strong>. Enter the current code to continue.</p>
      <div className="authNotice"><ShieldCheck size={17}/><span>Codes are generated and validated by the authentication service, expire, and cannot be reused. The verification result then opens the next Orenza security chamber.</span></div>
      <form onSubmit={verify} className="authForm">
        <label>6-digit verification code<input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} required /></label>
        <button className="btn full authSubmit" disabled={busy || otp.length !== 6}>{busy?'Verifying…':'Verify and continue'} <ArrowRight size={17}/></button>
      </form>
      {error && <div className="authError">{error}</div>}
      {sent && <div className="verifiedHint"><CheckCircle2 size={15}/> Check your inbox and spam folder for the newest code.</div>}
      <button type="button" className="textButton" onClick={resend} disabled={busy}>Send a new verification code</button>
    </section>
  </main>;
}
