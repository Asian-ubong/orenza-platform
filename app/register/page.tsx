'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '../../lib/supabase-browser';

const PRODUCTION_API_ORIGIN = 'https://orenza-platform.vercel.app';
type CapacitorWindow = Window & { Capacitor?: { isNativePlatform?: () => boolean } };

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function register(event: FormEvent) {
    event.preventDefault();
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (fullName.trim().length < 2) return setError('Enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return setError('Enter a valid email address.');
    if (!phone.trim() || phone.trim().includes('@')) return setError('Enter a valid phone number.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    try {
      setBusy(true);
      const response = await fetch(getRegistrationApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim(), email: normalizedEmail, phone: phone.trim(), password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Registration failed (${response.status}).`);
      if (!result.user_id || !result.session?.access_token || !result.session?.refresh_token) {
        throw new Error('Your account was created, but ORENZA could not start your secure session. Please try again.');
      }

      const supabase = getSupabaseBrowser();
      const { error: sessionError } = await supabase.auth.setSession({ access_token: result.session.access_token, refresh_token: result.session.refresh_token });
      if (sessionError) throw new Error(`Account created, but secure session setup failed: ${sessionError.message}`);

      sessionStorage.setItem('orenza_pending_email', normalizedEmail);
      sessionStorage.setItem('orenza_pending_name', fullName.trim());
      sessionStorage.setItem('orenza_pending_phone', phone.trim());
      sessionStorage.setItem('orenza_auth_flow', 'signup');
      sessionStorage.setItem('orenza_pending_user_id', result.user_id);
      localStorage.setItem('orenza_pending_email', normalizedEmail);
      localStorage.setItem('orenza_auth_flow', 'signup');
      localStorage.setItem('orenza_pending_user_id', result.user_id);
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

  return (
    <main className="authCanvas">
      <section className="authCard" style={{ maxWidth: 620 }}>
        <div className="authBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA" /><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div>
        <p className="eyebrow">CREATE ACCOUNT</p>
        <h1>Join ORENZA</h1>
        <p className="authSub">Create your account in one step. After registration, enter your one-time promotion code by scanning its QR code or typing it manually.</p>
        <div className="authNotice"><LockKeyhole size={17}/><span>No email OTP or verification screen. Register once, receive your secure ORENZA session, then continue to promotion access.</span></div>

        <form onSubmit={register} className="authForm">
          <label>Full name<input value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" placeholder="Enter your full name" required /></label>
          <label>Email address<input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required /></label>
          <label>Phone number<input value={phone} onChange={e => setPhone(e.target.value)} type="tel" autoComplete="tel" placeholder="+234 800 000 0000" required /></label>
          <label>Password
            <div style={{ position: 'relative' }}><input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Create a password (8+ characters)" minLength={8} required style={{ paddingRight: 46 }} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'transparent', cursor: 'pointer' }}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
          </label>
          <label>Confirm password
            <div style={{ position: 'relative' }}><input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type={showConfirm ? 'text' : 'password'} autoComplete="new-password" placeholder="Re-enter your password" required style={{ paddingRight: 46 }} /><button type="button" aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'} onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'transparent', cursor: 'pointer' }}>{showConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
          </label>
          <div style={{ display: 'grid', gap: 6, fontSize: 12, color: '#5d655f', marginTop: 2 }}>
            <span style={{ display: 'flex', gap: 7, alignItems: 'center' }}><Check size={14}/> Minimum 8 characters</span>
            <span style={{ display: 'flex', gap: 7, alignItems: 'center' }}><Check size={14}/> Passwords must match</span>
            <span style={{ display: 'flex', gap: 7, alignItems: 'center' }}><Check size={14}/> Continue directly to the one-time promotion code</span>
          </div>
          <button className="btn full authSubmit" disabled={busy}>{busy ? 'Registering your account…' : 'Register and continue'} <ArrowRight size={17}/></button>
        </form>

        {error && <div className="authError" role="alert">{error}</div>}
        <div className="authFooter">Already have an account? <Link href="/login">Log in</Link></div>
        <div className="splashTrust"><ShieldCheck size={16}/><span>Your account is authenticated first. Promotion access is a separate one-time gate before the ORENZA dashboard.</span></div>
      </section>
    </main>
  );
}
