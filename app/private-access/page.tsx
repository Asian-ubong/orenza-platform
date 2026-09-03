'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Camera, CheckCircle2, LockKeyhole, QrCode, ShieldCheck, X } from 'lucide-react';
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
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    return () => stopScanner();
  }, []);

  function stopScanner() {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function scanQr() {
    setError('');
    const Detector = (window as any).BarcodeDetector;
    if (!Detector) {
      setError('QR camera scanning is not supported by this browser. Use the invitation link or enter the promo code manually.');
      return;
    }
    try {
      const detector = new Detector({ formats: ['qr_code'] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      setScanning(true);
      requestAnimationFrame(async function tick() {
        if (!streamRef.current || !videoRef.current) return;
        const video = videoRef.current;
        if (video.readyState >= 2) {
          try {
            const results = await detector.detect(video);
            const raw = results?.[0]?.rawValue;
            if (raw) {
              try {
                const url = new URL(raw);
                const scannedCode = url.searchParams.get('code');
                setCode((scannedCode || raw).toUpperCase());
              } catch {
                setCode(raw.toUpperCase());
              }
              stopScanner();
              return;
            }
          } catch {}
        }
        requestAnimationFrame(tick);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Camera access was denied or unavailable.');
      stopScanner();
    }
  }

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
    <p className="eyebrow">ORENZA · PRIVATE TESTER ACCESS</p><h1>WELCOME TO ORENZA</h1>
    <p>Complete account verification first. Approved testers can then scan or enter their private invitation code to open the Orenza tester workspace.</p>
    <div className="gateNotice"><LockKeyhole size={18}/><span>Authentication, tester authorization, KYC approval and withdrawal authorization are separate controls. A promo code never grants real-money execution rights.</span></div>
    {signedIn ? <div className="authNotice" style={{marginTop:18}}><ShieldCheck size={17}/><span>Authenticated as <strong>{email}</strong>. Your account is ready for the tester authorization step.</span></div> : <Link className="btn full" href="/login" style={{marginTop:18}}><ArrowRight size={17}/> Sign in / verify email</Link>}

    <div style={{marginTop:22,padding:16,border:'1px solid rgba(201,160,99,.4)',borderRadius:14,background:'rgba(201,160,99,.08)'}}>
      <div style={{display:'flex',alignItems:'center',gap:9,fontWeight:800}}><QrCode size={19}/> PRIVATE PROMO / QR TERMINAL</div>
      <p style={{opacity:.8,fontSize:11,lineHeight:1.5}}>Scan the exact Orenza tester QR with your phone camera, or enter the invitation code supplied to you.</p>
      <button type="button" className="btn secondary" onClick={scanQr} disabled={scanning} style={{marginTop:8}}><Camera size={17}/>{scanning?'Scanning…':'Scan QR with camera'}</button>
      {scanning && <div style={{marginTop:12}}><video ref={videoRef} autoPlay playsInline muted style={{width:'100%',maxHeight:280,objectFit:'cover',borderRadius:12,background:'#05080c'}}/><button type="button" className="textButton" onClick={stopScanner}><X size={15}/> Stop scanner</button></div>}
    </div>

    <label style={{display:'block',marginTop:18,fontWeight:700}}>Tester promo code</label>
    <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="ORENZA-XXXXXXXXXXXXXXXX" autoCapitalize="characters" style={{width:'100%',marginTop:8,padding:14,borderRadius:12,border:'1px solid rgba(255,255,255,.16)',background:'rgba(255,255,255,.05)',color:'inherit',fontSize:16,boxSizing:'border-box'}}/>
    <button className="btn full" onClick={claim} disabled={busy || !code.trim() || !signedIn} style={{marginTop:12,cursor:busy?'wait':'pointer'}}>{busy?'Verifying…':'Activate tester access'} <ArrowRight size={17}/></button>
    {error && <p style={{color:'#fbbf24',marginTop:12}}>{error}</p>}
    {token && <p style={{color:'#86efac',marginTop:12}}><CheckCircle2 size={15}/> {token}. Redirecting…</p>}
    <div className="splashTrust"><ShieldCheck size={16}/><span>QR/promo access is bound to the authenticated account and cannot unlock real-money trading.</span></div>
  </div></main>;
}
