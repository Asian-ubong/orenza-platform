import Link from 'next/link';

const steps = [
  ['01', 'QR / Promo', 'Scan the Orenza invitation and redeem the tester code.'],
  ['02', 'Tester Access', 'Access is bound to the authenticated account and the assigned test window.'],
  ['03', 'App', 'Open the Orenza workspace and complete the Academy first-run lessons.'],
  ['04', 'Demo + MT5', 'Connect the demo account and MT5 terminal; verify account, balance and position synchronization.'],
  ['05', 'Markets + AI', 'Observe live market data and use Orenza AI for analysis, risk context and testing.'],
  ['06', 'Controlled Demo Trade', 'Run the first demo trade and verify the complete event/result path.'],
  ['07', 'KYC Review', 'Submit KYC after testing. AI may flag evidence and recommend a review outcome; an authorized admin makes the approval decision.'],
  ['08', 'Withdrawal', 'Create an authenticated withdrawal request. A separate authorization and all payout safety gates are required.'],
];

export default function TesterProgramPage() {
  return <main style={{maxWidth:1100,margin:'0 auto',padding:'48px 20px'}}>
    <p className="eyebrow">ORENZA · CONTROLLED LIVE PROGRAM</p>
    <h1 style={{fontSize:'clamp(36px,6vw,64px)',margin:'8px 0'}}>Tester Launchpad</h1>
    <p className="muted" style={{maxWidth:800,fontSize:18}}>The first tester path is deliberately staged: live market observation, demo account connectivity, MT5 demo synchronization, AI analysis and controlled demo trading come before KYC and withdrawal readiness.</p>
    <section style={{display:'grid',gap:12,marginTop:32}}>{steps.map(([n,t,d]) => <div key={n} style={{display:'grid',gridTemplateColumns:'56px 180px 1fr',gap:16,alignItems:'center',padding:'18px 20px',border:'1px solid rgba(255,255,255,.12)',borderRadius:16}}><strong>{n}</strong><strong>{t}</strong><span className="muted">{d}</span></div>)}</section>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:30}}>
      <Link className="button" href="/private-access">Redeem tester access</Link>
      <Link className="button" href="/academy">Open Academy</Link>
      <Link className="button" href="/markets">Open Markets</Link>
      <Link className="button" href="/mt5">Open MT5</Link>
      <Link className="button" href="/ai-premium">Open AI</Link>
    </div>
    <div style={{marginTop:28,padding:18,border:'1px solid rgba(255,180,0,.25)',borderRadius:16}}><strong>Financial safety status</strong><p className="muted" style={{margin:'6px 0 0'}}>Tester trading and payout testing remain demo/sandbox controlled. Real-money execution is not enabled by tester access, AI recommendations or KYC approval alone.</p></div>
  </main>;
}
