'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, MailCheck, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '../../lib/supabase-browser';

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
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
    if (flow === 'signup' && password.length < 8) return setError('Enter the password you chose during registration (at least 8 characters).');
    try {
      setBusy(true);
      const supabase = getSupabaseBrowser();
      let { data, error: verifyError } = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: 'email' });
      if (verifyError && flow === 'signup') {
        const retry = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: 'signup' });
        data = retry.data; verifyError = retry.error;
      }
      if (verifyError) throw verifyError;
      if (!data.user) throw new Error('The verification succeeded but no authenticated account was returned.');

      if (flow === 'signup') {
        const name = sessionStorage.getItem('orenza_pending_name') || '';
        const phone = sessionStorage.getItem('orenza_pending_phone') || '';
        const { error: updateError } = await supabase.auth.updateUser({
          password,
          data: { full_name: name, phone },
        });
        if (updateError) throw updateError;
      }

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
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: flow === 'signup' },
      });
      if (resendError) throw resendError;
      setSent(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'A new verification code could not be sent.'); }
    finally { setBusy(false); }
  }

  return <main className="authCanvas"><section className="authCard otpCard">
    <div className="authBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA" /><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div>
    <div className="otpIcon"><MailCheck size={26}/></div><p className="eyebrow">AUTOMATED SECURITY VERIFICATION</p><h1>Verify your account</h1>
    <p className="authSub">Orenza sends a unique one-time code to <strong>{email || 'your email'}</strong>. After verification, your account opens the dashboard. KYC is only required when you choose live trading.</p>
    <div className="authNotice"><ShieldCheck size={17}/><span>Email verification is automatic. Your phone number is not used for OTP delivery.</span></div>
    <form onSubmit={verify} className="authForm">
      <label>6-digit verification code<input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} required /></label>
      {flow === 'signup' && <label>Confirm password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required /></label>}
      <button className="btn full authSubmit" disabled={busy || otp.length !== 6 || (flow === 'signup' && password.length < 8)}>{busy?'Verifying…':'Verify and continue to dashboard'} <ArrowRight size={17}/></button>
    </form>
    {error && <div className="authError" role="alert">{error}</div>}{sent && <div className="verifiedHint"><CheckCircle2 size={15}/> Check your inbox and spam folder for the newest code.</div>}
    <button type="button" className="textButton" onClick={resend} disabled={busy}>Send a new verification code</button>
  </section></main>;
}
