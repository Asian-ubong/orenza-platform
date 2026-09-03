import Link from 'next/link';

const lessons = [
  ['01', 'Welcome to Orenza', 'Tester access, account security, and the 40-day test window.'],
  ['02', 'Connect your Demo account', 'Connect the authorized demo provider account before testing execution.'],
  ['03', 'Connect MT5 Demo', 'Confirm the MT5 demo bridge, account identity, positions and synchronization.'],
  ['04', 'Read the Markets', 'Use live provider market data and understand open, closed and suspended instruments.'],
  ['05', 'Orenza AI Analysis', 'Use AI for market analysis, risk context and test observations. AI recommendations do not execute trades automatically.'],
  ['06', 'Place a Demo Trade', 'Run controlled demo trades and verify the resulting account/position synchronization.'],
  ['07', 'KYC & Withdrawal Readiness', 'Submit KYC only after the trading test. Admin approval remains a human-controlled decision.'],
  ['08', 'Withdrawal Authorization', 'Understand the separate, authenticated authorization step and payout safety gates.'],
];

export default function AcademyPage() {
  return <main style={{maxWidth:1100,margin:'0 auto',padding:'48px 20px'}}>
    <p className="eyebrow">ORENZA ACADEMY · TESTER PROGRAM</p>
    <h1 style={{fontSize:'clamp(36px,6vw,64px)',margin:'8px 0'}}>Learn Orenza by testing it.</h1>
    <p className="muted" style={{maxWidth:760,fontSize:18}}>A guided first-run curriculum for approved testers. Start with demo connectivity and market observation, then move through AI analysis, controlled demo trading, KYC review and withdrawal readiness.</p>
    <div style={{display:'grid',gap:14,marginTop:32}}>
      {lessons.map(([n,title,desc]) => <article key={n} style={{display:'grid',gridTemplateColumns:'64px 1fr',gap:18,padding:20,border:'1px solid rgba(255,255,255,.12)',borderRadius:18}}>
        <strong style={{fontSize:20,opacity:.65}}>{n}</strong><div><h2 style={{margin:'0 0 6px'}}>{title}</h2><p className="muted" style={{margin:0}}>{desc}</p></div>
      </article>)}
    </div>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:30}}>
      <Link className="button" href="/private-access">Tester access</Link>
      <Link className="button" href="/markets">Live markets</Link>
      <Link className="button" href="/mt5">MT5</Link>
      <Link className="button" href="/ai-premium">AI analysis</Link>
    </div>
    <p className="muted" style={{marginTop:28}}>Safety boundary: sandbox/demo balances are separate from real user funds. AI can analyze and alert; it does not independently approve KYC or execute real-money withdrawals.</p>
  </main>;
}
