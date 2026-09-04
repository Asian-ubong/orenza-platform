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
    const load = async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) { setSignedIn(true); setEmail(user.email ?? ''); }
        const invited = sessionStorage.getItem('orenza_pending_tester_code') || '';
        const source = sessionStorage.getItem('orenza_invite_source');
        if (source === 'scanner' && invited) setCode(invited.toUpperCase());
        else setError('Private tester access is invitation-only. Return to the Orenza welcome screen and scan an approved invitation.');
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
      setError('QR camera scanning is not supported by this browser. Return to the welcome screen and use the invitation link from your approved QR.');
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
                if (scannedCode) setCode(scannedCode.toUpperCase());
              } catch {}
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
      if (!code || sessionStorage.getItem('orenza_invite_source') !== 'scanner') throw new Error('Scan an approved Orenza invitation first.');
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sign in and verify your email first, then activate the tester invitation.');
      const response = await fetch('/api/tester-access/claim', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? body.error ?? 'Tester access was denied.');
      sessionStorage.removeItem('orenza_pending_tester_code');
      sessionStorage.removeItem('orenza_invite_source');
      setToken(`Access approved until ${new Date(body.expires_at).toLocaleDateString()}`);
      setTimeout(() => { router.replace('/home'); }, 700);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to activate tester access.'); }
    finally { setBusy(false); }
  }

  return <main className="gate testerGate"><div className="gateCard wide">
    <img className="brandHeroLogo small" style={{width:'min(300px,100%)',height:'auto',display:'block',marginBottom:22}} src="/brand/orenza-mark.svg" alt="ORENZA"/>
    <p className="eyebrow">ORENZA · PRIVATE TESTER ACCESS</p><h1>PROMO TERMINAL</h1>
    <p>This terminal is visible only after an approved Orenza invitation has been scanned and your account has been authenticated.</p>
    <div className="gateNotice"><LockKeyhole size={18}/><span>Authentication, tester authorization, KYC approval and withdrawal authorization are separate controls. A promo code never grants real-money execution rights.</span></div>
    {signedIn ? <div className="authNotice" style={{marginTop:18}}><ShieldCheck size={17}/><span>Authenticated as <strong>{email}</strong>. Your invitation is ready for tester authorization.</span></div> : <Link className="btn full" href="/login" style={{marginTop:18}}><ArrowRight size={17}/> Sign in / verify email</Link>}

    {code ? <div style={{marginTop:22,padding:16,border:'1px solid rgba(201,160,99,.4)',borderRadius:14,background:'rgba(201,160,99,.08)'}}>
      <div style={{display:'flex',alignItems:'center',gap:9,fontWeight:800}}><QrCode size={19}/> INVITATION VERIFIED FOR TERMINAL</div>
      <p style={{opacity:.8,fontSize:12,lineHeight:1.5}}>Your scanned invitation is bound to this browser session. It must still be approved by the tester authorization service and does not enable real-money execution.</p>
      <button className="btn full" onClick={claim} disabled={busy || !signedIn} style={{marginTop:10}}>{busy?'Authorizing…':'Activate tester access'} <ArrowRight size={17}/></button>
    </div> : <div style={{marginTop:22,padding:16,border:'1px solid rgba(255,255,255,.12)',borderRadius:14}}>
      <div style={{display:'flex',alignItems:'center',gap:9,fontWeight:800}}><QrCode size={19}/> INVITATION REQUIRED</div>
      <p style={{opacity:.8,fontSize:12,lineHeight:1.5}}>No scanner invitation is attached to this session. Use the Orenza welcome screen to scan an approved invitation.</p>
      <Link className="btn secondary full" href="/" style={{marginTop:8}}>Return to welcome screen</Link>
    </div>}

    {scanning && <div style={{marginTop:12}}><video ref={videoRef} autoPlay playsInline muted style={{width:'100%',maxHeight:280,objectFit:'cover',borderRadius:12,background:'#05080c'}}/><button type="button" className="textButton" onClick={stopScanner}><X size={15}/> Stop scanner</button></div>}
    {error && <p style={{color:'#fbbf24',marginTop:12}}>{error}</p>}
    {token && <p style={{color:'#86efac',marginTop:12}}><CheckCircle2 size={15}/> {token}. Redirecting…</p>}
    <div className="splashTrust"><ShieldCheck size={16}/><span>Tester authorization remains separate from KYC, withdrawal authorization and all real-money execution controls.</span></div>
  </div></main>;
}
