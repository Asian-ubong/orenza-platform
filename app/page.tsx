'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => router.replace('/register'), 3000);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <main className="splash authLanding" aria-label="Orenza welcome">
      <div className="splashOrb" />
      <div className="splashCard" style={{ opacity: 1, transform: 'translateY(0) scale(1)' }}>
        <img className="brandHeroLogo" style={{ width: 'min(360px,100%)', height: 'auto', display: 'block', margin: '0 auto 22px' }} src="/brand/orenza-mark.svg" alt="ORENZA" />
        <p className="eyebrow">WELCOME TO ORENZA</p>
        <h1>Funding the Future of Trading.</h1>
        <p className="splashSub">Secure access for ambitious future traders.</p>
        <div className="splashProgress" aria-label="Opening registration"><span /></div>
        <p className="splashHint">Opening secure registration…</p>
        <p style={{ marginTop: 16, fontSize: 11, opacity: .62 }}>Authentication • Tester authorization • KYC • Withdrawal authorization are separate controls.</p>
      </div>
    </main>
  );
}
