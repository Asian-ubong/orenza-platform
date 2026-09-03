'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
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
    if (!email.trim()) return setError('Enter your email address.');
    if (!phone.trim()) return setError('Enter your phone number.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');

    try {
      setBusy(true);
      const supabase = getSupabaseBrowser();
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim(), phone: phone.trim() },
        },
      });
      if (authError) throw authError;

      sessionStorage.setItem('orenza_pending_email', email.trim().toLowerCase());
      sessionStorage.setItem('orenza_pending_name', fullName.trim());
      sessionStorage.setItem('orenza_pending_phone', phone.trim());
      sessionStorage.setItem('orenza_auth_flow', 'signup');

      if (data.session) router.replace('/private-access');
      else router.replace('/verify');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="authCanvas">
    <section className="authCard">
      <div className="authBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA" /><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div>
      <p className="eyebrow">ACCOUNT REGISTRATION</p>
      <h1>Create your Orenza account</h1>
      <p className="authSub">Register first. We will send a one-time verification code to your email before opening the account workspace.</p>

      <div className="authNotice"><LockKeyhole size={17}/><span>Your password is handled by Supabase Auth. Orenza never displays or stores it in the application UI.</span></div>

      <form onSubmit={register} className="authForm">
        <label>Full name<input value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name" placeholder="Full name" required /></label>
        <label>Email address<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required /></label>
        <label>Phone number<input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" autoComplete="tel" placeholder="+234 ..." required /></label>
        <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required /></label>
        <button className="btn full authSubmit" disabled={busy}>{busy?'Creating account…':'Register'} <ArrowRight size={17}/></button>
      </form>
      {error && <div className="authError">{error}</div>}
      <div className="authFooter">Already registered? <Link href="/login">Log in</Link></div>
      <div className="splashTrust"><ShieldCheck size={16}/><span>After email verification, your authenticated account can activate approved tester access.</span></div>
    </section>
  </main>;
}
