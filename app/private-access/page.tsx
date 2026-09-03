'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';

export default function PrivateAccess() {
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invited = params.get('code');
    if (invited) setCode(invited.toUpperCase());
  }, []);

  async function claim() {
    try {
      setBusy(true); setError('');
      const accessToken = localStorage.getItem('orenza_access_token');
      if (!accessToken) throw new Error('Sign in first, then return here to activate your approved tester code.');
      const response = await fetch('/api/tester-access/claim', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? body.error ?? 'Tester access was denied.');
      setToken(`Access approved until ${new Date(body.expires_at).toLocaleDateString()}`);
      setTimeout(() => { window.location.href = '/home'; }, 700);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to activate tester access.'); }
    finally { setBusy(false); }
  }

  return <main className="gate"><div className="gateCard wide">
    <img className="brandHeroLogo small" style={{width:'min(300px,100%)',height:'auto',display:'block',marginBottom:22}} src="/brand/orenza-wordmark.svg" alt="ORENZA BROKER"/>
    <p className="eyebrow">ORENZA · PRIVATE TESTER ACCESS</p><h1>APPROVED TESTERS ONLY</h1>
    <p>Downloading ORENZA does not grant access. An approved tester must sign in and redeem a private invitation code.</p>
    <div className="gateNotice"><LockKeyhole size={18}/><span>Access is bound to your authenticated account and expires after the assigned 14-day test window.</span></div>
    <label style={{display:'block',marginTop:18,fontWeight:700}}>Tester code</label>
    <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="ORENZA-XXXXXXXXXXXXXXXX" autoCapitalize="characters" style={{width:'100%',marginTop:8,padding:14,borderRadius:12,border:'1px solid rgba(255,255,255,.16)',background:'rgba(255,255,255,.05)',color:'inherit',fontSize:16,boxSizing:'border-box'}}/>
    <button className="btn full" onClick={claim} disabled={busy || !code.trim()} style={{marginTop:12,cursor:busy?'wait':'pointer'}}>{busy?'Verifying…':'Redeem tester access'} <ArrowRight size={17}/></button>
    {error && <p style={{color:'#fbbf24',marginTop:12}}>{error}</p>}
    {token && <p style={{color:'#86efac',marginTop:12}}>{token}. Redirecting…</p>}
    <div className="splashTrust"><ShieldCheck size={16}/><span>Unauthorized downloads cannot activate the tester environment.</span></div>
  </div></main>;
}
