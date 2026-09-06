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
    event.preventDefault();
    setError('');
    if (fullName.trim().length < 2) return setError('Enter your full legal name.');
    if (!email.trim() || !email.includes('@')) return setError('Enter a valid email address.');
    if (!phone.trim() || phone.trim().includes('@')) return setError('Enter a valid phone number, not an email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');

    try {
      setBusy(true);
      const normalizedEmail = email.trim().toLowerCase();
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          password,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Registration could not be completed.');

      // The signup path intentionally skips email OTP. Establish the Supabase
      // session immediately, then take the new account to the promo scanner.
      const supabase = getSupabaseBrowser();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (authError) throw authError;
      if (!data.user || !data.session?.access_token) {
        throw new Error('Account was created, but the ORENZA session could not be started.');
      }

      sessionStorage.setItem('orenza_pending_email', normalizedEmail);
      sessionStorage.setItem('orenza_pending_name', fullName.trim());
      sessionStorage.setItem('orenza_pending_phone', phone.trim());
      sessionStorage.setItem('orenza_auth_flow', 'signup');
      sessionStorage.setItem('orenza_pending_user_id', data.user.id);
      localStorage.setItem('orenza_pending_email', normalizedEmail);
      localStorage.setItem('orenza_auth_flow', 'signup');
      localStorage.setItem('orenza_pending_user_id', data.user.id);

      router.replace('/promotion');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="authCanvas"><section className="authCard">
    <div className="authBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA" /><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div>
    <p className="eyebrow">ACCOUNT REGISTRATION</p><h1>Create your Orenza account</h1>
    <p className="authSub">Create your account and continue directly to the ORENZA promotion-code scanner. Email OTP is not required for this tester onboarding path.</p>
    <div className="authNotice"><LockKeyhole size={17}/><span>Your account is created immediately. The next step is the approved promotion-code scanner for tester access.</span></div>
    <form onSubmit={register} className="authForm">
      <label>Full name<input value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name" placeholder="Full name" required /></label>
      <label>Email address<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required /></label>
      <label>Phone number<input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" autoComplete="tel" placeholder="+234 ..." required /></label>
      <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required /></label>
      <button className="btn full authSubmit" disabled={busy}>{busy?'Creating account…':'Register and continue'} <ArrowRight size={17}/></button>
    </form>
    {error && <div className="authError" role="alert">{error}</div>}
    <div className="authFooter">Already registered? <Link href="/login">Log in</Link></div>
    <div className="splashTrust"><ShieldCheck size={16}/><span>Tester promotion access remains separate from KYC, real-money trading and withdrawals.</span></div>
  </section></main>;
}
