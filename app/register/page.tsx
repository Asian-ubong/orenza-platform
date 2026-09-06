'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '../../lib/supabase-browser';

const PRODUCTION_API_ORIGIN = 'https://orenza-platform.vercel.app';

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
  };
};

function getRegistrationApiUrl(path: string) {
  if (typeof window === 'undefined') return path;
  const native = (window as CapacitorWindow).Capacitor?.isNativePlatform?.() === true;
  if (native || window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:') {
    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
    return `${configuredOrigin || PRODUCTION_API_ORIGIN}${path}`;
  }
  return path;
}

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
      const response = await fetch(getRegistrationApiUrl('/api/auth/register'), {
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
      if (!response.ok) throw new Error(result.error || `Registration failed (${response.status}).`);

      // Registration is intentionally a single-step account-creation flow.
      // No email OTP or verification screen is used here.
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
      const message = e instanceof TypeError && e.message === 'Failed to fetch'
        ? 'ORENZA could not reach the account service. Check your internet connection and try again.'
        : e instanceof Error ? e.message : 'Registration could not be completed.';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return <main className="authCanvas"><section className="authCard">
    <div className="authBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA" /><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div>
    <p className="eyebrow">ACCOUNT REGISTRATION</p><h1>Create your Orenza account</h1>
    <p className="authSub">Enter your details below and your ORENZA account will be created immediately. No email OTP or verification step is required.</p>
    <div className="authNotice"><LockKeyhole size={17}/><span>Submit the form once. Your account is created immediately and you continue directly to the approved promotion-code scanner.</span></div>
    <form onSubmit={register} className="authForm">
      <label>Full name<input value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name" placeholder="Full name" required /></label>
      <label>Email address<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required /></label>
      <label>Phone number<input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" autoComplete="tel" placeholder="+234 ..." required /></label>
      <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required /></label>
      <button className="btn full authSubmit" disabled={busy}>{busy?'Creating account…':'Create account and continue'} <ArrowRight size={17}/></button>
    </form>
    {error && <div className="authError" role="alert">{error}</div>}
    <div className="authFooter">Already registered? <Link href="/login">Log in</Link></div>
    <div className="splashTrust"><ShieldCheck size={16}/><span>Account creation is separate from tester authorization, KYC, real-money trading and withdrawals.</span></div>
  </section></main>;
}
