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
  const [challengeId, setChallengeId] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('orenza_pending_email') || '';
    const savedFlow = sessionStorage.getItem('orenza_auth_flow') === 'login' ? 'login' : 'signup';
    const savedChallenge = sessionStorage.getItem('orenza_auth_challenge_id') || '';
    setEmail(saved); setFlow(savedFlow); setChallengeId(savedChallenge);
    if (!saved) setError('No pending verification was found. Start with registration or login.');
  }, []);

  async function verify(event: FormEvent) {
    event.preventDefault(); setError('');
    if (!email || !challengeId || !/^\d{6}$/.test(otp.trim())) return setError('Enter the current 6-digit code from your Orenza email.');
    if (!password) return setError('Enter your password again to securely open the account after verification.');
    try {
      setBusy(true);
      const response = await fetch('/api/auth/email-otp/verify', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({challenge_id: challengeId, email, code: otp.trim(), purpose: flow}) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'The verification code could not be verified.');
      const supabase = getSupabaseBrowser();
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      const invitedTester = sessionStorage.getItem('orenza_pending_tester_code');
      const inviteSource = sessionStorage.getItem('orenza_invite_source');
      sessionStorage.removeItem('orenza_pending_email'); sessionStorage.removeItem('orenza_auth_flow'); sessionStorage.removeItem('orenza_auth_challenge_id'); sessionStorage.removeItem('orenza_pending_user_id');
      if (invitedTester && inviteSource === 'scanner') {
        router.replace('/private-access?source=scanner');
      } else {
        router.replace('/home');
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'The verification could not be completed.'); }
    finally { setBusy(false); }
  }

  async function resend() {
    setError(''); if (!email) return;
    try {
      setBusy(true);
      const response = await fetch('/api/auth/email-otp/send', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email, purpose: flow, user_id: flow === 'signup' ? sessionStorage.getItem('orenza_pending_user_id') : undefined}) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'A new verification code could not be sent.');
      setChallengeId(result.challenge_id || ''); sessionStorage.setItem('orenza_auth_challenge_id', result.challenge_id || ''); setSent(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'A new verification code could not be sent.'); }
    finally { setBusy(false); }
  }

  return <main className="authCanvas"><section className="authCard otpCard">
    <div className="authBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA" /><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div>
    <div className="otpIcon"><MailCheck size={26}/></div><p className="eyebrow">AUTOMATED SECURITY VERIFICATION</p><h1>Verify your account</h1>
    <p className="authSub">Orenza sends a unique one-time code to <strong>{email || 'your email'}</strong>. It expires after 10 minutes and can only be used once.</p>
    <div className="authNotice"><ShieldCheck size={17}/><span>Orenza now sends this code through its transactional email service. The Supabase Auth email OTP endpoint is no longer used by this verification screen.</span></div>
    <form onSubmit={verify} className="authForm">
      <label>6-digit verification code<input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} required /></label>
      <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="Your password" required /></label>
      <button className="btn full authSubmit" disabled={busy || otp.length !== 6 || !password || !challengeId}>{busy?'Verifying…':'Verify and continue'} <ArrowRight size={17}/></button>
    </form>
    {error && <div className="authError">{error}</div>}{sent && <div className="verifiedHint"><CheckCircle2 size={15}/> Check your inbox and spam folder for the newest code.</div>}
    <button type="button" className="textButton" onClick={resend} disabled={busy}>Send a new verification code</button>
  </section></main>;
}
