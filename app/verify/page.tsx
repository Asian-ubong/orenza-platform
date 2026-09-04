'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, MailCheck, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [userId, setUserId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [flow, setFlow] = useState<'signup'|'login'>('signup');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = (params.get('email') || '').trim().toLowerCase();
    const savedSession = (sessionStorage.getItem('orenza_pending_email') || '').trim().toLowerCase();
    const savedLocal = (localStorage.getItem('orenza_pending_email') || '').trim().toLowerCase();
    const resolvedEmail = fromUrl || savedSession || savedLocal;
    const urlFlow = params.get('flow') === 'login' ? 'login' : '';
    const savedFlow = sessionStorage.getItem('orenza_auth_flow') === 'login' || localStorage.getItem('orenza_auth_flow') === 'login' ? 'login' : 'signup';
    const resolvedFlow = urlFlow || savedFlow;
    const resolvedChallenge = params.get('challenge') || sessionStorage.getItem('orenza_auth_challenge_id') || localStorage.getItem('orenza_auth_challenge_id') || '';
    const resolvedUser = sessionStorage.getItem('orenza_pending_user_id') || localStorage.getItem('orenza_pending_user_id') || '';
    setEmail(resolvedEmail); setFlow(resolvedFlow); setChallengeId(resolvedChallenge); setUserId(resolvedUser);
    if (resolvedEmail) {
      sessionStorage.setItem('orenza_pending_email', resolvedEmail);
      sessionStorage.setItem('orenza_auth_flow', resolvedFlow);
      localStorage.setItem('orenza_pending_email', resolvedEmail);
      localStorage.setItem('orenza_auth_flow', resolvedFlow);
    }
    if (resolvedChallenge) {
      sessionStorage.setItem('orenza_auth_challenge_id', resolvedChallenge);
      localStorage.setItem('orenza_auth_challenge_id', resolvedChallenge);
    }
  }, []);

  async function verify(event: FormEvent) {
    event.preventDefault(); setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) return setError('Enter the email address used for registration or login.');
    if (!challengeId) return setError('This verification session is missing. Return to registration and request a new code.');
    if (!/^\d{6}$/.test(otp.trim())) return setError('Enter the current 6-digit code from your Orenza email.');
    try {
      setBusy(true);
      const response = await fetch('/api/auth/email-otp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, code: otp.trim(), challenge_id: challengeId, purpose: flow, user_id: userId || undefined }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'The verification could not be completed.');
      if (!result.action_link) throw new Error('Verification succeeded but the dashboard session could not be created.');
      sessionStorage.removeItem('orenza_pending_email');
      sessionStorage.removeItem('orenza_pending_name');
      sessionStorage.removeItem('orenza_pending_phone');
      sessionStorage.removeItem('orenza_pending_user_id');
      sessionStorage.removeItem('orenza_auth_flow');
      sessionStorage.removeItem('orenza_auth_challenge_id');
      localStorage.removeItem('orenza_pending_email');
      localStorage.removeItem('orenza_auth_flow');
      localStorage.removeItem('orenza_auth_challenge_id');
      localStorage.removeItem('orenza_pending_user_id');
      window.location.assign(result.action_link);
    } catch (e) { setError(e instanceof Error ? e.message : 'The verification could not be completed.'); }
    finally { setBusy(false); }
  }

  async function resend() {
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) return setError('Enter the email address used for registration or login.');
    if (!userId && flow === 'signup') return setError('Registration details are missing. Return to registration and start again.');
    try {
      setBusy(true);
      const response = await fetch('/api/auth/email-otp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, purpose: flow, user_id: userId || undefined }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'A new verification code could not be sent.');
      if (result.challenge_id) {
        setChallengeId(result.challenge_id);
        sessionStorage.setItem('orenza_auth_challenge_id', result.challenge_id);
        localStorage.setItem('orenza_auth_challenge_id', result.challenge_id);
      }
      setSent(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'A new verification code could not be sent.'); }
    finally { setBusy(false); }
  }

  return <main className="authCanvas"><section className="authCard otpCard">
    <div className="authBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA" /><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div>
    <div className="otpIcon"><MailCheck size={26}/></div><p className="eyebrow">AUTOMATED SECURITY VERIFICATION</p><h1>Verify your account</h1>
    <p className="authSub">Orenza sends a unique 6-digit code to your email. After verification, your account opens the dashboard. KYC is only required when you choose live trading.</p>
    <div className="authNotice"><ShieldCheck size={17}/><span>Email verification is automatic. Your phone number is not used for OTP delivery.</span></div>
    <form onSubmit={verify} className="authForm">
      <label>Email address<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required /></label>
      <label>6-digit verification code<input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} required /></label>
      <button className="btn full authSubmit" disabled={busy || otp.length !== 6 || !email.trim()}>{busy?'Verifying…':'Verify and continue to dashboard'} <ArrowRight size={17}/></button>
    </form>
    {error && <div className="authError" role="alert">{error}</div>}{(sent || email) && <div className="verifiedHint"><CheckCircle2 size={15}/> Check your inbox and spam folder for the newest code.</div>}
    <button type="button" className="textButton" onClick={resend} disabled={busy}>Send a new 6-digit code</button>
  </section></main>;
}
