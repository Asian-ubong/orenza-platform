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
    if (!email.trim() || !password) return setError('Enter your email and password.');
    try {
      setBusy(true);
      const supabase = getSupabaseBrowser();
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (authError) throw authError;
      if (!data.user?.email_confirmed_at) {
        sessionStorage.setItem('orenza_pending_email', normalizedEmail);
        sessionStorage.setItem('orenza_auth_flow', 'signup');
        await supabase.auth.signOut();
        router.replace('/verify');
        return;
      }

      // Password is the first factor; email OTP is the second factor before the workspace opens.
      await supabase.auth.signOut();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: false },
      });
      if (otpError) throw otpError;
      sessionStorage.setItem('orenza_pending_email', normalizedEmail);
      sessionStorage.setItem('orenza_auth_flow', 'login');
      router.replace('/verify');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  async function sendLoginOtp() {
    setError('');
    if (!email.trim()) return setError('Enter your email first.');
    try {
      setBusy(true);
      const supabase = getSupabaseBrowser();
      const normalizedEmail = email.trim().toLowerCase();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: false },
      });
      if (otpError) throw otpError;
      sessionStorage.setItem('orenza_pending_email', normalizedEmail);
      sessionStorage.setItem('orenza_auth_flow', 'login');
      router.replace('/verify');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The login OTP could not be sent.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="authCanvas">
    <section className="authCard">
      <div className="authBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA" /><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div>
      <p className="eyebrow">SECURE LOGIN</p>
      <h1>Welcome back</h1>
      <p className="authSub">Enter your password first. Orenza then sends a one-time email OTP as the verification step before the account workspace opens.</p>
      <div className="authNotice"><LockKeyhole size={17}/><span>Password verification and email OTP are separate steps. Tester authorization, KYC approval and withdrawal authorization remain separate controls.</span></div>
      <form onSubmit={login} className="authForm">
        <label>Email address<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required /></label>
        <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="Your password" required /></label>
        <button className="btn full authSubmit" disabled={busy}>{busy?'Checking…':'Continue to email OTP'} <ArrowRight size={17}/></button>
      </form>
      <button type="button" className="btn secondary full" onClick={sendLoginOtp} disabled={busy || !email.trim()} style={{marginTop:9}}>Send email OTP instead</button>
      {error && <div className="authError">{error}</div>}
      <div className="authFooter">New to Orenza? <Link href="/register">Create an account</Link></div>
      <div className="splashTrust"><ShieldCheck size={16}/><span>Authentication is separate from tester authorization, KYC approval and withdrawal authorization.</span></div>
    </section>
  </main>;
}
