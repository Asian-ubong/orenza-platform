import Link from 'next/link';

const steps = [
  ['01', 'QR / Promo', 'Scan the Orenza invitation and redeem the tester code.'],
  ['02', 'Tester Access', 'Access is bound to the authenticated account and the assigned test window.'],
  ['03', 'App', 'Open the Orenza workspace and use the unified tester launchpad.'],
  ['04', 'Demo + MT5', 'Connect the demo account and MT5 terminal; actual broker credentials are provisioned only by the authorized server-side bridge.'],
  ['05', 'Markets + AI', 'Observe real-life market data from Deriv and use Orenza AI for analysis and risk context.'],
  ['06', 'Controlled Demo Trade', 'Run and close the first demo trade only after the MT5 demo bridge is healthy.'],
  ['07', 'KYC Review', 'Submit KYC after testing. AI may flag evidence and recommend a review outcome; an authorized admin makes the approval decision.'],
  ['08', 'Real Account + Promo', 'Real-account opening and the 5,000 promo remain separate server-side authorization gates.'],
];

export default function TesterProgramPage() {
  return <main style={{maxWidth:1100,margin:'0 auto',padding:'48px 20px'}}>
    <p className="eyebrow">ORENZA · CONTROLLED TESTER PROGRAM</p>
    <h1 style={{fontSize:'clamp(36px,6vw,64px)',margin:'8px 0'}}>Tester Launchpad</h1>
    <p className="muted" style={{maxWidth:800,fontSize:18}}>One staged path: account + OTP → private tester access → demo → MT5 → real-life market observation → controlled demo trade → KYC → separately authorized real-account/promo gates.</p>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:24}}><Link className="button" href="/launchpad">Open Unified Launchpad</Link><Link className="button" href="/private-access">Redeem tester access</Link></div>
    <section style={{display:'grid',gap:12,marginTop:32}}>{steps.map(([n,t,d]) => <div key={n} style={{display:'grid',gridTemplateColumns:'56px 180px 1fr',gap:16,alignItems:'center',padding:'18px 20px',border:'1px solid rgba(255,255,255,.12)',borderRadius:16}}><strong>{n}</strong><strong>{t}</strong><span className="muted">{d}</span></div>)}</section>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:30}}><Link className="button" href="/academy">Academy</Link><Link className="button" href="/markets">Markets</Link><Link className="button" href="/mt5">MT5</Link><Link className="button" href="/ai-premium">AI</Link><Link className="button" href="/kyc">KYC</Link></div>
    <div style={{marginTop:28,padding:18,border:'1px solid rgba(255,180,0,.25)',borderRadius:16}}><strong>Financial safety status</strong><p className="muted" style={{margin:'6px 0 0'}}>Tester access does not unlock real-money trading or payout. The production provider chain is currently DEMO, MT5 bridge is not configured, and real-money trading/payout are disabled.</p></div>
  </main>;
}
