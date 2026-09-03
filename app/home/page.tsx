'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, Bot, CheckCircle2, ChevronRight, CircleDollarSign, Globe2, LogOut, ShieldCheck, Sparkles, TrendingUp, UserRound, WalletCards } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '../../lib/supabase-browser';

const palette = ['#2A402D','#FAF9F6','#C9A063','#4CAF50','#8B0000'];
const watch = [
  ['EUR/USD','1.17482','+0.42%','positive'],
  ['GBP/USD','1.36550','+0.18%','positive'],
  ['USD/JPY','155.245','-0.21%','negative'],
  ['XAU/USD','2,389.45','+1.23%','positive'],
  ['BTC/USD','67,432.10','+1.21%','positive'],
  ['NAS100','18,542.30','+0.89%','positive'],
];

export default function HomeDashboard() {
  const router = useRouter();
  const [name, setName] = useState('Orenza Tester');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace('/login'); return; }
        setEmail(user.email ?? '');
        setName(String(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Orenza Tester'));
      } finally { setBusy(false); }
    };
    load();
  }, [router]);

  async function logout() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (busy) return <main className="authCanvas"><div className="authCard"><p className="eyebrow">ORENZA</p><h1>Opening your workspace…</h1></div></main>;

  return <main className="dashboardCanvas">
    <header className="dashTop"><div className="dashBrand"><img src="/brand/orenza-mark.svg" alt="ORENZA"/><div><b>ORENZA</b><span>TRADE. GROW. SUCCEED.</span></div></div><div className="dashTopRight"><span className="liveChip"><i/> SANDBOX / TEST MODE</span><button onClick={logout} aria-label="Log out"><LogOut size={16}/></button></div></header>
    <div className="dashBody">
      <section className="welcomePanel"><div className="welcomeBrand"><img src="/brand/orenza-mark.svg" alt=""/><div><p className="eyebrow">WELCOME BACK</p><h2>{name}</h2><p>{email}</p></div></div><span className="welcomePill">ACCOUNT VERIFIED</span></section>

      <div className="dashMetrics"><div><span>Total Equity</span><strong>$5,000.00</strong><small>Sandbox virtual balance</small></div><div><span>Available Balance</span><strong>$5,000.00</strong><small>Virtual buying power</small></div><div><span>Today's P&amp;L</span><strong className="positive">$0.00</strong><small>Demo activity only</small></div><div><span>Account Status</span><strong className="positive">Verified</strong><small>Email + account security</small></div></div>

      <section className="terminalCanvas">
        <div className="terminalHeader"><div><p className="eyebrow">ORENZA TRADING TERMINAL</p><h2>Market Watch &amp; Trade Workspace</h2></div><span>WHITE CANVAS · BRAND PALETTE</span></div>
        <div className="terminalGrid">
          <div className="terminalPanel"><h3>Market Watch</h3>{watch.map(([symbol,price,change,tone])=><div className="watchRow" key={symbol}><b>{symbol}</b><span>{price}</span><span className={tone}>{change}</span></div>)}</div>
          <div className="terminalPanel"><h3>EUR/USD · Live market data when authorized</h3><div className="chartMock"><div className="chartLine"/></div><div className="terminalStatus" style={{marginTop:9}}><i/> Market-data connection status is provider-dependent. No invented execution or P&amp;L is shown.</div></div>
          <div className="terminalPanel"><h3>Order Ticket · Demo First</h3><div className="orderBox"><label>ACCOUNT<select defaultValue="SANDBOX"><option>SANDBOX / DEMO</option><option>MT5 DEMO — provisioned after tester setup</option><option>MT5 REAL — controlled / not enabled</option></select></label><label>VOLUME<input defaultValue="0.10" inputMode="decimal"/></label><label>STOP LOSS<input placeholder="Optional"/></label><label>TAKE PROFIT<input placeholder="Optional"/></label><div className="orderButtons"><button className="orderBuy" type="button">BUY DEMO</button><button className="orderSell" type="button">SELL DEMO</button></div></div></div>
        </div>
        <div className="statusCards"><div className="statusCard"><span>EMAIL</span><strong>VERIFIED</strong><small>Supabase Auth</small></div><div className="statusCard"><span>TESTER ACCESS</span><strong>AUTHENTICATED</strong><small>Promo remains separate</small></div><div className="statusCard"><span>MT5</span><strong>DEMO FIRST</strong><small>Credentials provisioned in setup</small></div><div className="statusCard"><span>AI</span><strong>ADVISORY</strong><small>Analysis + alerts, no auto-execution</small></div></div>
      </section>

      <section className="dashQuick"><Link href="/tester-program"><ShieldCheck size={18}/><div><b>Tester Launchpad</b><span>Demo → MT5 → Markets → AI → KYC</span></div><ChevronRight size={16}/></Link><Link href="/academy"><Bot size={18}/><div><b>Academy</b><span>Start the first-round tutorials</span></div><ChevronRight size={16}/></Link><Link href="/ai-premium"><Sparkles size={18}/><div><b>Orenza AI</b><span>Analyze authorized market data</span></div><ChevronRight size={16}/></Link><Link href="/mt5"><TrendingUp size={18}/><div><b>MT5 Setup</b><span>Connect demo terminal first</span></div><ChevronRight size={16}/></Link></section>

      <section className="dashSecurity"><div><ShieldCheck size={20}/><div><b>Security &amp; verification layer</b><span>Your authenticated session is separate from tester authorization, KYC review and withdrawal authorization. AI can assess evidence and alert an authorized admin; it cannot approve KYC or release real funds.</span></div></div><Link href="/security-check">Open Security Center <ArrowRight size={15}/></Link></section>
      <div className="dashFooter"><span><Globe2 size={13}/> Live market observation</span><span><Activity size={13}/> Demo trading</span><span><CircleDollarSign size={13}/> Payout gates remain controlled</span><span><WalletCards size={13}/> Sandbox separate from real funds</span><span><UserRound size={13}/> {email}</span></div>
    </div>
  </main>;
}
