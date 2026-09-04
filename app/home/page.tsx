'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, ChevronRight, CircleDollarSign, Globe2, LogOut, ShieldCheck, Sparkles, TrendingUp, UserRound, WalletCards } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '../../lib/supabase-browser';

const watch = [
  ['EUR/USD','1.17482','+0.42%','positive'], ['GBP/USD','1.36550','+0.18%','positive'],
  ['USD/JPY','155.245','-0.21%','negative'], ['XAU/USD','2,389.45','+1.23%','positive'],
  ['BTC/USD','67,432.10','+1.21%','positive'], ['NAS100','18,542.30','+0.89%','positive'],
];

export default function HomeDashboard() {
  const router = useRouter();
  const [name, setName] = useState('Orenza Tester');
  const [email, setEmail] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace('/login'); return; }
        setEmail(user.email ?? '');
        setName(String(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Orenza Tester'));
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const response = await fetch('/api/sandbox/welcome-bonus', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' });
          if (response.ok) {
            const data = await response.json();
            const amount = Number(data?.wallet?.available_balance ?? 0);
            setBalance(Number.isFinite(amount) && amount > 0 ? amount : 0);
          } else setBalance(0);
        } else setBalance(0);
      } finally { setBusy(false); }
    };
    load();
  }, [router]);

  async function logout() {
    await getSupabaseBrowser().auth.signOut();
    router.replace('/login');
  }

  if (busy) return <main className="authCanvas"><div className="authCard"><p className="eyebrow">ORENZA</p><h1>Opening your workspace…</h1></div></main>;
  const activated = (balance ?? 0) > 0;
  const money = activated ? `$${(balance ?? 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}` : '$0.00';

  return <main className="dashboardCanvas">
    <style>{`*{box-sizing:border-box}.dashboardCanvas{min-height:100vh;background:#FAF9F6;color:#0B192B;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.dashTop{height:70px;border-bottom:1px solid #e1d9c9;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(16px,4vw,48px);position:sticky;top:0;z-index:5}.dashBrand{display:flex;align-items:center;gap:10px}.dashBrand img{width:42px;height:42px;object-fit:contain}.dashBrand b{display:block;color:#2A402D;font-size:15px;letter-spacing:.17em}.dashBrand span{display:block;color:#9a9285;font-size:7px;letter-spacing:.2em;margin-top:3px}.dashTopRight{display:flex;align-items:center;gap:10px}.liveChip{display:flex;align-items:center;gap:7px;background:#FAF9F6;border:1px solid #d9d0bd;color:#2A402D;border-radius:999px;padding:8px 11px;font-size:8px;font-weight:850;letter-spacing:.06em}.liveChip i{width:7px;height:7px;border-radius:50%;background:#4CAF50}.dashTopRight button{width:34px;height:34px;border:1px solid #e1d9c9;background:#fff;border-radius:9px;color:#2A402D;display:grid;place-items:center;cursor:pointer}.dashBody{max-width:1400px;margin:auto;padding:28px clamp(16px,4vw,48px) 55px}.welcomePanel{background:#fff;border:1px solid #e1d9c9;border-radius:18px;padding:22px;margin-bottom:16px;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;box-shadow:0 10px 32px rgba(42,64,45,.06)}.welcomeBrand{display:flex;align-items:center;gap:14px}.welcomeBrand img{width:62px;height:62px;object-fit:contain}.welcomeBrand h2{margin:0;color:#2A402D;font-size:23px;letter-spacing:-.03em}.welcomeBrand p:not(.eyebrow){margin:5px 0 0;color:#756f63;font-size:11px}.welcomePill{border:1px solid #cce5cf;background:#edf7ee;color:#27783a;border-radius:999px;padding:8px 11px;font-size:9px;font-weight:850;letter-spacing:.06em}.eyebrow{margin:0 0 6px;font-size:9px;letter-spacing:.14em;font-weight:850;color:#C9A063}.dashMetrics{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:16px}.dashMetrics>div{background:#fff;border:1px solid #e1d9c9;border-radius:13px;padding:15px}.dashMetrics span,.dashMetrics small{display:block;color:#817a6e;font-size:9px}.dashMetrics strong{display:block;margin:5px 0;font-size:22px;letter-spacing:-.025em}.dashMetrics small{font-size:8px}.positive{color:#4CAF50;font-weight:800}.negative{color:#8B0000;font-weight:800}.terminalCanvas{background:#fff;border:1px solid #e1d9c9;border-radius:18px;padding:18px;box-shadow:0 12px 38px rgba(42,64,45,.06)}.terminalHeader{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:14px}.terminalHeader h2{margin:0;color:#0B192B;font-size:18px}.terminalHeader>span{font-size:8px;color:#817a6e;letter-spacing:.08em}.terminalGrid{display:grid;grid-template-columns:1.05fr 1.7fr .95fr;gap:12px}.terminalPanel{border:1px solid #e5dece;border-radius:13px;background:#fff;padding:13px}.terminalPanel h3{margin:0 0 10px;font-size:11px;color:#2A402D}.watchRow{display:grid;grid-template-columns:1fr auto auto;gap:9px;padding:9px 0;border-top:1px solid #eee8da;font-size:10px}.watchRow:first-of-type{border-top:0}.chartMock{height:240px;border:1px solid #eee8da;border-radius:10px;position:relative;overflow:hidden;background:linear-gradient(180deg,#fff,#FAF9F6)}.chartMock:before{content:"";position:absolute;inset:20px;background:repeating-linear-gradient(0deg,transparent 0 38px,#eee8da 39px 40px),repeating-linear-gradient(90deg,transparent 0 64px,#eee8da 65px 66px);opacity:.75}.chartLine{position:absolute;left:7%;right:7%;top:50%;height:2px;background:#4CAF50;transform:rotate(-9deg);box-shadow:45px 30px 0 -1px #4CAF50,110px 3px 0 -1px #4CAF50,180px -27px 0 -1px #4CAF50,250px -7px 0 -1px #4CAF50}.terminalStatus{display:flex;gap:7px;align-items:center;background:#FAF9F6;border:1px solid #e1d9c9;border-radius:9px;padding:9px;font-size:9px;color:#756f63;line-height:1.45}.terminalStatus i{width:7px;height:7px;border-radius:50%;background:#4CAF50;flex:0 0 auto}.orderBox{display:grid;gap:9px}.orderBox label{font-size:8px;font-weight:800;color:#817a6e}.orderBox input,.orderBox select{width:100%;margin-top:5px;border:1px solid #dcd4c4;border-radius:8px;padding:9px;background:#fff;color:#0B192B;font-size:9px}.orderButtons{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:4px}.orderButtons button{border:1px solid #2A402D;border-radius:8px;padding:10px;font-size:9px;font-weight:850;cursor:pointer}.orderBuy{background:#4CAF50;color:#fff}.orderSell{background:#fff;color:#8B0000;border-color:#8B0000!important}.dashQuick{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:16px}.dashQuick a{display:flex;align-items:center;gap:9px;padding:13px;background:#fff;border:1px solid #e1d9c9;border-radius:12px;text-decoration:none;color:#2A402D}.dashQuick a svg:last-child{margin-left:auto;color:#9a9285}.dashQuick b,.dashQuick span{display:block}.dashQuick b{font-size:10px}.dashQuick span{font-size:8px;color:#817a6e;margin-top:3px}.dashSecurity{margin-top:16px;padding:14px 16px;border:1px solid #dfcda8;background:#f4ede0;border-radius:13px;display:flex;justify-content:space-between;gap:15px;align-items:center}.dashSecurity>div{display:flex;gap:10px;align-items:flex-start}.dashSecurity svg{color:#2A402D;flex:0 0 auto}.dashSecurity b,.dashSecurity span{display:block}.dashSecurity b{font-size:10px}.dashSecurity span{font-size:9px;color:#6d675c;line-height:1.5;margin-top:3px}.dashSecurity a{white-space:nowrap;color:#2A402D;font-size:9px;font-weight:850;text-decoration:none}.gateBanner{margin-bottom:16px;padding:14px 16px;border:1px solid #d9c8a5;background:#f7f1e5;border-radius:13px;display:flex;justify-content:space-between;gap:14px;align-items:center}.gateBanner b,.gateBanner span{display:block}.gateBanner b{font-size:11px;color:#2A402D}.gateBanner span{font-size:9px;color:#756f63;line-height:1.5;margin-top:3px}.gateBanner a{white-space:nowrap;background:#2A402D;color:#fff;border-radius:8px;padding:10px 12px;text-decoration:none;font-size:9px;font-weight:850}.dashFooter{display:flex;flex-wrap:wrap;gap:15px;margin-top:15px;color:#817a6e;font-size:8px}.dashFooter span{display:flex;align-items:center;gap:5px}.dashFooter svg{color:#2A402D}@media(max-width:1050px){.terminalGrid{grid-template-columns:1fr}.dashMetrics{grid-template-columns:repeat(2,1fr)}.dashQuick{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.dashTop{height:60px}.liveChip{display:none}.dashBody{padding-top:18px}.welcomePanel{grid-template-columns:1fr}.dashMetrics,.dashQuick{grid-template-columns:1fr}.terminalCanvas{padding:12px}.terminalHeader{align-items:flex-start;flex-direction:column}.chartMock{height:190px}.dashSecurity,.gateBanner{align-items:flex-start;flex-direction:column}.dashSecurity a,.gateBanner a{margin-left:30px}}`}</style>
    <header className="dashTop"><div className="dashBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA"/><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div><div className="dashTopRight"><span className="liveChip"><i/> SANDBOX / TEST MODE</span><button onClick={logout} aria-label="Log out"><LogOut size={16}/></button></div></header>
    <div className="dashBody">
      <section className="welcomePanel"><div className="welcomeBrand"><img src="/brand/orenza-mark.svg" alt=""/><div><p className="eyebrow">WELCOME BACK</p><h2>{name}</h2><p>{email}</p></div></div><span className="welcomePill">EMAIL VERIFIED</span></section>
      {!activated && <section className="gateBanner"><div><b>Sandbox capital is not active yet.</b><span>Demo access is available now. Choose Live Trading to start KYC; after KYC approval, the $5,000 virtual promotional capital can be activated.</span></div><Link href="/live-trading">Choose Live Trading <ArrowRight size={13}/></Link></section>}
      <div className="dashMetrics"><div><span>Total Equity</span><strong>{money}</strong><small>{activated ? 'Sandbox virtual balance' : 'No sandbox capital activated'}</small></div><div><span>Available Balance</span><strong>{money}</strong><small>{activated ? 'Virtual buying power' : 'Demo access only'}</small></div><div><span>Today's P&amp;L</span><strong className="positive">$0.00</strong><small>Demo activity only</small></div><div><span>Account Status</span><strong className="positive">Verified</strong><small>Email + account security</small></div></div>
      <section className="terminalCanvas">
        <div className="terminalHeader"><div><p className="eyebrow">ORENZA TRADING TERMINAL</p><h2>Market Watch &amp; Trade Workspace</h2></div><span>DEMO-FIRST · REAL MONEY DISABLED</span></div>
        <div className="terminalGrid">
          <div className="terminalPanel"><h3>Market Watch</h3>{watch.map(([symbol,price,change,tone])=><div className="watchRow" key={symbol}><b>{symbol}</b><span>{price}</span><span className={tone}>{change}</span></div>)}</div>
          <div className="terminalPanel"><h3>EUR/USD · Observation</h3><div className="chartMock"><div className="chartLine"/></div><div className="terminalStatus" style={{marginTop:9}}><i/> Market-data connection is provider-dependent. No invented execution or P&amp;L is shown.</div></div>
          <div className="terminalPanel"><h3>Order Ticket · Demo First</h3><div className="orderBox"><label>ACCOUNT<select defaultValue="SANDBOX"><option>SANDBOX / DEMO</option><option>MT5 DEMO — provisioned after tester setup</option><option>MT5 REAL — controlled / not enabled</option></select></label><label>VOLUME<input defaultValue="0.10" inputMode="decimal"/></label><label>STOP LOSS<input placeholder="Optional"/></label><label>TAKE PROFIT<input placeholder="Optional"/></label><div className="orderButtons"><button className="orderBuy" type="button" disabled={!activated}>BUY DEMO</button><button className="orderSell" type="button" disabled={!activated}>SELL DEMO</button></div></div></div>
        </div>
      </section>
      <section className="dashQuick"><Link href="/tester-program"><ShieldCheck size={18}/><div><b>Tester Launchpad</b><span>Demo → MT5 → Markets → AI → KYC</span></div><ChevronRight size={16}/></Link><Link href="/sandbox"><WalletCards size={18}/><div><b>Demo / Sandbox</b><span>{activated ? 'Manage virtual test capital' : 'Start demo testing'}</span></div><ChevronRight size={16}/></Link><Link href="/ai-premium"><Sparkles size={18}/><div><b>Orenza AI</b><span>Analysis and alerts only</span></div><ChevronRight size={16}/></Link><Link href="/mt5"><TrendingUp size={18}/><div><b>MT5 Setup</b><span>Connect demo terminal first</span></div><ChevronRight size={16}/></Link></section>
      <section className="dashSecurity"><div><ShieldCheck size={20}/><div><b>Security &amp; verification layer</b><span>Authentication is separate from tester access, KYC review and withdrawal authorization. AI can analyze evidence and alert an authorized reviewer; it cannot approve KYC or release real funds.</span></div></div><Link href="/security-check">Open Security Center <ArrowRight size={15}/></Link></section>
      <div className="dashFooter"><span><Globe2 size={13}/> Market observation</span><span><UserRound size={13}/> {email}</span><span><ActivityIcon/> Demo trading</span><span><CircleDollarSign size={13}/> Payout gates controlled</span><span><WalletCards size={13}/> Sandbox separate from real funds</span></div>
    </div>
  </main>;
}

function ActivityIcon(){ return <span style={{display:'inline-flex'}}><CircleDollarSign size={13}/></span>; }
