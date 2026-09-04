'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, QrCode, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const searchParams = useSearchParams();
  const [revealed, setRevealed] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setRevealed(true), 650);
    const invite = searchParams.get('code')?.trim().toUpperCase();
    if (invite) {
      sessionStorage.setItem('orenza_pending_tester_code', invite);
      sessionStorage.setItem('orenza_invite_source', 'scanner');
      window.setTimeout(() => router.replace('/login?from=scanner'), 900);
    }
    return () => window.clearTimeout(timer);
  }, [router, searchParams]);

  function stopScanner() {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function scanInvitation() {
    setError('');
    const Detector = (window as any).BarcodeDetector;
    if (!Detector) {
      setError('Camera QR scanning is unavailable in this browser. Use your phone camera to open the approved Orenza invitation.');
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

  return (
    <main className="splash authLanding" aria-label="Orenza welcome">
      <div className="splashOrb" />
      <div className="splashCard" style={{ opacity: revealed ? 1 : 0, transform: revealed ? 'translateY(0) scale(1)' : 'translateY(14px) scale(.97)', transition: 'opacity .7s ease, transform .7s ease' }}>
        <img className="brandHeroLogo" style={{ width: 'min(360px,100%)', height: 'auto', display: 'block', margin: '0 auto 22px' }} src="/brand/orenza-mark.svg" alt="ORENZA" />
        <p className="eyebrow">WELCOME TO ORENZA</p>
        <h1>Funding the Future of Trading.</h1>
        <p className="splashSub">Secure access for ambitious future traders.</p>

        <div style={{ marginTop: 24, padding: 18, border: '1px solid rgba(201,160,99,.45)', borderRadius: 16, background: 'rgba(201,160,99,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontWeight: 800 }}><QrCode size={20} /> ORENZA ACCESS SENSOR</div>
          <p style={{ opacity: .78, fontSize: 12, lineHeight: 1.5, margin: '9px 0 13px' }}>Scan an approved Orenza invitation to continue to account login or registration. The private promo terminal is not shown until authenticated tester access is authorized.</p>
          <button type="button" className="btn full" onClick={scanInvitation} disabled={scanning}>{scanning ? <><Camera size={17} /> Scanning…</> : <><Camera size={17} /> Scan Orenza invitation</>}</button>
          {scanning && <div style={{ marginTop: 12 }}><video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 12, background: '#05080c' }} /><button type="button" className="textButton" onClick={stopScanner}><X size={15} /> Stop scanner</button></div>}
          {error && <p style={{ color: '#fbbf24', marginTop: 10, fontSize: 12 }}>{error}</p>}
        </div>
        <p style={{ marginTop: 16, fontSize: 11, opacity: .62 }}>Authentication • Tester authorization • KYC • Withdrawal authorization are separate controls.</p>
      </div>
    </main>
  );
}
