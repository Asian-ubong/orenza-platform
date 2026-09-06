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
    event.preventDefault();
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@') || !password) {
      setError('Enter your email and password.');
      return;
    }

    try {
      setBusy(true);
      const supabase = getSupabaseBrowser();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (authError) throw authError;
      if (!data.user || !data.session?.access_token) throw new Error('Login could not be verified.');

      sessionStorage.setItem('orenza_pending_email', normalizedEmail);
      sessionStorage.setItem('orenza_auth_flow', 'login');
      sessionStorage.setItem('orenza_pending_user_id', data.user.id);
      localStorage.setItem('orenza_pending_email', normalizedEmail);
      localStorage.setItem('orenza_auth_flow', 'login');
      localStorage.setItem('orenza_pending_user_id', data.user.id);

      router.replace('/promotion');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="authCanvas"><section className="authCard">
    <div className="authBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA" /><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div>
    <p className="eyebrow">SECURE LOGIN</p><h1>Welcome back</h1>
    <p className="authSub">Sign in with your email and password to continue to your ORENZA workspace.</p>
    <div className="authNotice"><LockKeyhole size={17}/><span>Your password authenticates the account. No email OTP or verification-code step is used for login.</span></div>
    <form onSubmit={login} className="authForm">
      <label>Email address<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required /></label>
      <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="Your password" required /></label>
      <button className="btn full authSubmit" disabled={busy}>{busy?'Signing in…':'Sign in and continue'} <ArrowRight size={17}/></button>
    </form>
    {error && <div className="authError" role="alert">{error}</div>}
    <div className="authFooter">New to Orenza? <Link href="/register">Create an account</Link></div>
    <div className="splashTrust"><ShieldCheck size={16}/><span>Authentication, tester authorization, KYC approval and withdrawal authorization remain separate controls.</span></div>
  </section></main>;
}
