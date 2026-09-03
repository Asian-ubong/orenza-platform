'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck, QrCode, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '../../lib/supabase-browser';

export default function PrivateAccess() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invited = params.get('code');
    if (invited) setCode(invited.toUpperCase());
    const load = async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) { setSignedIn(true); setEmail(user.email ?? ''); }
      } catch (e) { setError(e instanceof Error ? e.message : 'Authentication configuration is unavailable.'); }
    };
    load();
  }, []);

  async function claim() {
    try {
      setBusy(true); setError('');
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sign in and verify your email first, then activate the tester code.');
      const response = await fetch('/api/tester-access/claim', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? body.error ?? 'Tester access was denied.');
      setToken(`Access approved until ${new Date(body.expires_at).toLocaleDateString()}`);
      setTimeout(() => { router.replace('/home'); }, 700);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to activate tester access.'); }
    finally { setBusy(false); }
  }

  return <main className="gate testerGate"><div className="gateCard wide">
    <img className="brandHeroLogo small" style={{width:'min(300px,100%)',height:'auto',display:'block',marginBottom:22}} src="/brand/orenza-mark.svg" alt="ORENZA"/>
    <p className="eyebrow">ORENZA · PRIVATE TESTER ACCESS</p><h1>APPROVED TESTERS ONLY</h1>
    <p>Authentication comes first. After email verification, the private tester invitation can be redeemed against your authenticated Orenza account.</p>
    <div className="gateNotice"><LockKeyhole size={18}/><span>Tester authorization is separate from registration, KYC approval and withdrawal authorization. The invitation cannot grant real-money execution rights.</span></div>
    {signedIn ? <div className="authNotice" style={{marginTop:18}}><ShieldCheck size={17}/><span>Authenticated as <strong>{email}</strong>. Enter your approved invitation code below.</span></div> : <Link className="btn full" href="/login" style={{marginTop:18}}><LogIn size={17}/> Sign in / verify email <ArrowRight size={17}/></Link>}
    <div style={{display:'flex',gap:18,alignItems:'center',flexWrap:'wrap',marginTop:18}}>
      <div style={{display:'flex',alignItems:'center',gap:8,fontWeight:700}}><QrCode size={18}/> Private tester QR</div>
      <span style={{opacity:.75}}>Scan the invitation link supplied by ORENZA, then redeem the code shown in your invitation.</span>
    </div>
    <label style={{display:'block',marginTop:18,fontWeight:700}}>Tester promo code</label>
    <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="ORENZA-XXXXXXXXXXXXXXXX" autoCapitalize="characters" style={{width:'100%',marginTop:8,padding:14,borderRadius:12,border:'1px solid rgba(255,255,255,.16)',background:'rgba(255,255,255,.05)',color:'inherit',fontSize:16,boxSizing:'border-box'}}/>
    <button className="btn full" onClick={claim} disabled={busy || !code.trim() || !signedIn} style={{marginTop:12,cursor:busy?'wait':'pointer'}}>{busy?'Verifying…':'Redeem tester access'} <ArrowRight size={17}/></button>
    {error && <p style={{color:'#fbbf24',marginTop:12}}>{error}</p>}
    {token && <p style={{color:'#86efac',marginTop:12}}>{token}. Redirecting…</p>}
    <div className="splashTrust"><ShieldCheck size={16}/><span>Unauthorized downloads cannot activate the tester environment.</span></div>
  </div></main>;
}
