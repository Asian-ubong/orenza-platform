'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Camera, CheckCircle2, LockKeyhole, QrCode, ShieldCheck, X } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { getSupabaseBrowser } from '../../lib/supabase-browser';
import { useRouter } from 'next/navigation';

function extractCode(raw: string) {
  try {
    const url = new URL(raw);
    return (url.searchParams.get('code') || '').trim().toUpperCase();
  } catch {
    return raw.trim().toUpperCase();
  }
}

export default function PromotionPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
      readerRef.current?.reset();
    };
  }, []);

  function stopScanner() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current?.reset();
    setScanning(false);
  }

  async function startScanner() {
    setError('');
    setMessage('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not available in this browser. Enter the promotion code manually below.');
      return;
    }
    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      setScanning(true);
      setMessage('Allow camera access, then point it at the Orenza promotion QR code.');
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        videoRef.current!,
        (result, scanError) => {
          if (result) {
            const nextCode = extractCode(result.getText());
            if (nextCode) {
              setCode(nextCode);
              setMessage('Promotion code detected.');
              stopScanner();
            }
          } else if (scanError && scanError.name !== 'NotFoundException') {
            // Individual frame misses are expected while scanning.
          }
        },
      );
      controlsRef.current = controls;
    } catch (e) {
      stopScanner();
      setError(e instanceof Error && e.name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access for Orenza in your browser settings and try again.' : 'Unable to start the phone camera. You can enter the promotion code manually.');
    }
  }

  async function activate() {
    setError('');
    setMessage('');
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setError('Scan the promotion QR code or enter its code.');
      return;
    }
    try {
      setBusy(true);
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.replace('/login');
        return;
      }
      const response = await fetch('/api/tester-access/claim', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || body.error || 'This promotion code is not approved for the test program.');
      sessionStorage.setItem('orenza_tester_access', 'active');
      setMessage(`Tester access approved until ${new Date(body.expires_at).toLocaleDateString()}. Opening your Orenza workspace…`);
      window.setTimeout(() => router.replace('/home'), 500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Promotion activation failed.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="authCanvas"><section className="authCard otpCard" style={{maxWidth:680}}>
    <div className="authBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA" /><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div>
    <div className="otpIcon"><QrCode size={26}/></div>
    <p className="eyebrow">STEP 3 · PROMOTION ACCESS</p>
    <h1>Activate your Orenza test access</h1>
    <p className="authSub">Your account is verified. Now scan the approved promotion QR code or enter the promotion code supplied to you. This is the final gate before the test dashboard.</p>
    <div className="authNotice"><LockKeyhole size={17}/><span>Promotion access is separate from authentication, KYC and any future real-money authorization. The current test environment uses sandbox/demo activity only.</span></div>
    <div style={{marginTop:20,padding:14,border:'1px solid #e1d9c9',borderRadius:14,background:'#FAF9F6'}}>
      {scanning ? <><video ref={videoRef} autoPlay playsInline muted aria-label="Promotion QR scanner" style={{width:'100%',maxHeight:360,objectFit:'cover',borderRadius:12,background:'#05080c'}}/><button type="button" className="textButton" onClick={stopScanner}><X size={15}/> Stop scanner</button></> : <div style={{height:150,display:'grid',placeItems:'center',borderRadius:12,background:'#0B192B',color:'#fff'}}><QrCode size={52}/></div>}
    </div>
    <div style={{display:'grid',gap:10,marginTop:16}}>
      <button type="button" className="btn full" onClick={startScanner} disabled={scanning || busy}><Camera size={17}/> {scanning ? 'Scanning…' : 'Scan promotion QR code'}</button>
      <label style={{fontWeight:800,fontSize:12}}>Promotion code<input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} autoComplete="off" inputMode="text" placeholder="Enter code if you cannot scan" /></label>
      <button type="button" className="btn full" onClick={activate} disabled={busy || !code.trim()}>{busy ? 'Activating…' : 'Activate test access'} <ArrowRight size={17}/></button>
    </div>
    {message && <div className="verifiedHint"><CheckCircle2 size={15}/> {message}</div>}
    {error && <div className="authError" role="alert">{error}</div>}
    <div className="splashTrust"><ShieldCheck size={16}/><span>Test access does not grant real-money execution, withdrawals or payout authority.</span></div>
  </section></main>;
}
