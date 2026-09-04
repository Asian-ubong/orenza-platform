'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '../../lib/supabase-browser';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function register(event: FormEvent) {
    event.preventDefault(); setError('');
    if (fullName.trim().length < 2) return setError('Enter your full legal name.');
    if (!email.trim() || !email.includes('@')) return setError('Enter a valid email address.');
    if (!phone.trim() || phone.trim().includes('@')) return setError('Enter a valid phone number, not an email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    try {
      setBusy(true);
      const normalizedEmail = email.trim().toLowerCase();
      const supabase = getSupabaseBrowser();
      const { data, error: signupError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { full_name: fullName.trim(), phone: phone.trim() } },
      });
      if (signupError) throw signupError;
      if (!data.user) throw new Error('The account could not be initialized.');

      // Orenza owns the OTP delivery path so the verification flow does not
      // depend on Supabase's restricted default SMTP service.
      const sendResponse = await fetch('/api/auth/email-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, purpose: 'signup', user_id: data.user.id }),
      });
      const sendResult = await sendResponse.json().catch(() => ({}));
      if (!sendResponse.ok) throw new Error(sendResult.error || 'The verification code could not be sent.');
      const challengeId = String(sendResult.challenge_id || '');
      if (!challengeId) throw new Error('The verification challenge was not created.');

      sessionStorage.setItem('orenza_pending_email', normalizedEmail);
      sessionStorage.setItem('orenza_pending_name', fullName.trim());
      sessionStorage.setItem('orenza_pending_phone', phone.trim());
      sessionStorage.setItem('orenza_auth_flow', 'signup');
      sessionStorage.setItem('orenza_auth_challenge_id', challengeId);
      localStorage.setItem('orenza_pending_email', normalizedEmail);
      localStorage.setItem('orenza_auth_flow', 'signup');
      localStorage.setItem('orenza_auth_challenge_id', challengeId);
      localStorage.setItem('orenza_pending_user_id', data.user.id);
      router.replace(`/verify?email=${encodeURIComponent(normalizedEmail)}&flow=signup&challenge=${encodeURIComponent(challengeId)}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Registration could not be started.'); }
    finally { setBusy(false); }
  }

  return <main className="authCanvas"><section className="authCard">
    <div className="authBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA" /><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div>
    <p className="eyebrow">ACCOUNT REGISTRATION</p><h1>Create your Orenza account</h1>
    <p className="authSub">Create your account and receive a unique 6-digit verification code by email. After verification, Orenza opens the dashboard; KYC is only required when you choose live trading.</p>
    <div className="authNotice"><LockKeyhole size={17}/><span>Your password is handled by Supabase Auth. It is never saved in browser storage. Email verification is required before the dashboard opens.</span></div>
    <form onSubmit={register} className="authForm">
      <label>Full name<input value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name" placeholder="Full name" required /></label>
      <label>Email address<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required /></label>
      <label>Phone number<input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" autoComplete="tel" placeholder="+234 ..." required /></label>
      <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required /></label>
      <button className="btn full authSubmit" disabled={busy}>{busy?'Creating account and sending code…':'Register'} <ArrowRight size={17}/></button>
    </form>
    {error && <div className="authError" role="alert">{error}</div>}
    <div className="authFooter">Already registered? <Link href="/login">Log in</Link></div>
    <div className="splashTrust"><ShieldCheck size={16}/><span>Verification is email-only. After verification, you go directly to the dashboard.</span></div>
  </section></main>;
}
