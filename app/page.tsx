'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Camera, LogIn, QrCode, UserPlus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function extractInvite(raw: string) {
  try {
    const url = new URL(raw);
    return url.searchParams.get('code')?.trim().toUpperCase() || '';
  } catch {
    return raw.trim().toUpperCase();
  }
}

export default function Splash() {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setRevealed(true), 850);
    return () => window.clearTimeout(timer);
  }, []);

  function stopScanner() {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function scanInvitation() {
    setError('');
    const Detector = (window as any).BarcodeDetector;
    if (!Detector) {
      setError('Your browser does not support camera QR scanning. Open the Orenza invitation QR with your phone camera instead.');
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
            const invite = results?.[0]?.rawValue ? extractInvite(results[0].rawValue) : '';
            if (invite) {
              sessionStorage.setItem('orenza_pending_tester_code', invite);
              sessionStorage.setItem('orenza_invite_source', 'scanner');
              stopScanner();
              router.push('/login?from=scanner');
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

  return <main className="splash authLanding">
    <div className="splashOrb" />
    <div className="splashCard" style={{opacity: revealed ? 1 : .08, transform: revealed ? 'translateY(0) scale(1)' : 'translateY(10px) scale(.98)', transition: 'opacity .7s ease, transform .7s ease'}}>
      <img className="brandHeroLogo" style={{width:'min(360px,100%)',height:'auto',display:'block',margin:'0 auto 22px'}} src="/brand/orenza-mark.svg" alt="ORENZA"/>
      <p className="eyebrow">WELCOME TO ORENZA</p>
      <h1>Funding the Future of Trading.</h1>
      <p className="splashSub">A secure trading environment built for ambitious future traders.</p>

      <div style={{marginTop:22,padding:18,border:'1px solid rgba(201,160,99,.45)',borderRadius:16,background:'rgba(201,160,99,.08)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9,fontWeight:800}}><QrCode size={20}/> ORENZA ACCESS SENSOR</div>
        <p style={{opacity:.78,fontSize:12,lineHeight:1.5,margin:'9px 0 13px'}}>Scan your approved Orenza invitation to unlock the private tester terminal after you create or access your account.</p>
        <button type="button" className="btn full" onClick={scanInvitation} disabled={scanning}>{scanning ? <><Camera size={17}/> Scanning…</> : <><Camera size={17}/> Scan Orenza invitation</>}</button>
        {scanning && <div style={{marginTop:12}}><video ref={videoRef} autoPlay playsInline muted style={{width:'100%',maxHeight:280,objectFit:'cover',borderRadius:12,background:'#05080c'}}/><button type="button" className="textButton" onClick={stopScanner}><X size={15}/> Stop scanner</button></div>}
        {error && <p style={{color:'#fbbf24',marginTop:10,fontSize:12}}>{error}</p>}
      </div>

      {revealed && <div className="landingActions" style={{marginTop:18}}>
        <Link className="btn" href="/register"><UserPlus size={17}/> Create account <ArrowRight size={17}/></Link>
        <Link className="btn secondary" href="/login"><LogIn size={17}/> Login <ArrowRight size={17}/></Link>
      </div>}
    </div>
  </main>;
}
