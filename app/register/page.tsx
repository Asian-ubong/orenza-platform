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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim(), email: normalizedEmail, phone: phone.trim(), password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Registration could not be completed.');

      sessionStorage.setItem('orenza_pending_email', normalizedEmail);
      sessionStorage.setItem('orenza_pending_name', fullName.trim());
      sessionStorage.setItem('orenza_pending_phone', phone.trim());
      sessionStorage.setItem('orenza_auth_flow', 'signup');
      localStorage.setItem('orenza_pending_email', normalizedEmail);
      localStorage.setItem('orenza_auth_flow', 'signup');
      localStorage.setItem('orenza_pending_user_id', String(result.user_id || ''));

      const supabase = getSupabaseBrowser();
      if (result.authenticated) {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (loginError) throw loginError;
        
        // FEATURE FLAG: OTP verification is temporarily disabled
        // TODO: Re-enable OTP verification before production release
        // router.replace(`/verify?email=${encodeURIComponent(normalizedEmail)}&flow=signup`);
        
        // For now, route directly to promo code scanner for new users
        router.replace('/promotion');
        return;
      }

      // FEATURE FLAG: OTP verification is temporarily disabled
      // If Supabase project requires email confirmation, it will be handled server-side
      // TODO: Re-enable the verify screen below before production
      // router.replace(`/verify?email=${encodeURIComponent(normalizedEmail)}&flow=signup`);
      
      // For now, route directly to promo code scanner for new users
      router.replace('/promotion');
    } catch (e) { setError(e instanceof Error ? e.message : 'Registration could not be completed.'); }
    finally { setBusy(false); }
  }

  return <main className="authCanvas"><section className="authCard">
    <div className="authBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA" /><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div>
    <p className="eyebrow">ACCOUNT REGISTRATION</p><h1>Create your Orenza account</h1>
    <p className="authSub">Enter your name, email, phone number and password. Registration takes you directly to the approved promotion QR scanner.</p>
    <div className="authNotice"><LockKeyhole size={17}/><span>Your password is used only for authentication and is never saved in browser storage.</span></div>
    <form onSubmit={register} className="authForm">
      <label>Full name<input value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name" placeholder="Full name" required /></label>
      <label>Email address<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required /></label>
      <label>Phone number<input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" autoComplete="tel" placeholder="+234 ..." required /></label>
      <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required /></label>
      <button className="btn full authSubmit" disabled={busy}>{busy?'Creating account…':'Register'} <ArrowRight size={17}/></button>
    </form>
    {error && <div className="authError" role="alert">{error}</div>}
    <div className="authFooter">Already registered? <Link href="/login">Log in</Link></div>
    <div className="splashTrust"><ShieldCheck size={16}/><span>After registration, you go directly to promotion access. Email verification is deferred until production enablement.</span></div>
  </section></main>;
}
