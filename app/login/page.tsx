'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '../../lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function login(event: FormEvent) {
    event.preventDefault(); setError('');
    if (!email.trim() || !password) return setError('Enter your email and password.');
    try {
      setBusy(true);
      const supabase = getSupabaseBrowser();
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (authError) throw authError;
      if (!data.user) throw new Error('Login could not be verified.');
      router.replace('/home');
    } catch (e) { setError(e instanceof Error ? e.message : 'Login could not be completed.'); }
    finally { setBusy(false); }
  }

  return <main className="authCanvas"><section className="authCard">
    <div className="authBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA" /><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div>
    <p className="eyebrow">SECURE LOGIN</p><h1>Welcome back</h1>
    <p className="authSub">Enter your email and password to open your Orenza workspace.</p>
    <div className="authNotice"><LockKeyhole size={17}/><span>Email OTP is disabled for the test flow. Authentication uses your password; tester access, KYC and withdrawals remain separate controls.</span></div>
    <form onSubmit={login} className="authForm">
      <label>Email address<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required /></label>
      <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="Your password" required /></label>
      <button className="btn full authSubmit" disabled={busy}>{busy?'Signing in…':'Log in'} <ArrowRight size={17}/></button>
    </form>
    {error && <div className="authError" role="alert">{error}</div>}
    <div className="authFooter">New to Orenza? <Link href="/register">Create an account</Link></div>
    <div className="splashTrust"><ShieldCheck size={16}/><span>Authentication is separate from tester authorization, KYC approval and withdrawal authorization.</span></div>
  </section></main>;
}
