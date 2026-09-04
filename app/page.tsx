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
        <div aria-label="Opening registration" role="progressbar" style={{marginTop:20,height:4,borderRadius:999,overflow:'hidden',background:'rgba(255,255,255,.12)'}}>
          <span style={{display:'block',height:'100%',width:'100%',transformOrigin:'left',background:'#C9A063',animation:'orenzaSplashProgress 3s linear forwards'}} />
        </div>
        <p style={{marginTop:10,fontSize:11,opacity:.62}}>Opening secure registration…</p>
        <style>{`@keyframes orenzaSplashProgress{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
        <p style={{ marginTop: 16, fontSize: 11, opacity: .62 }}>Authentication • Tester authorization • KYC • Withdrawal authorization are separate controls.</p>
      </div>
    </main>
  );
}
