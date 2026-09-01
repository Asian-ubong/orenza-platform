import { ArrowUpRight, BarChart3, ShieldCheck, WalletCards, Activity, CircleDollarSign } from 'lucide-react';

const stats = [
  ['Sandbox Capital', '$25,000.00', 'Trading capital'],
  ['Open Positions', '0', 'Awaiting Derive connection'],
  ['Profit Wallet', '$0.00', 'Settled profit'],
  ['Risk Status', 'Protected', 'Limits enforced'],
];

export default function Home() {
  return <main className="shell">
    <aside><div className="brand"><span>O</span> ORENZA</div><nav>
      {['Overview','Sandbox Money','Derive Trading','MT5','Portfolio','Profit Payout','Transactions','KYC & Security'].map((x,i)=><a className={i===0?'active':''} key={x} href={'#'+x.toLowerCase().replaceAll(' ','-')}>{x}</a>)}
    </nav><div className="secure"><ShieldCheck size={18}/><div><b>Secure mode</b><small>Server-side credentials</small></div></div></aside>
    <section className="content"><header><div><p className="eyebrow">TRADING PLATFORM</p><h1>Good morning</h1><p className="muted">Your sandbox capital and real-market trading infrastructure in one place.</p></div><button className="primary">Connect Derive <ArrowUpRight size={17}/></button></header>
      <div className="notice"><Activity size={20}/><div><b>Derive connection required</b><span>Market prices, execution, settlement and account data will come from the authorized Derive integration. No simulated market results.</span></div></div>
      <div className="grid">{stats.map(([label,value,sub],i)=><div className="card" key={label}><div className="icon">{[WalletCards,BarChart3,CircleDollarSign,ShieldCheck][i]({size:18})}</div><p>{label}</p><strong>{value}</strong><small>{sub}</small></div>)}</div>
      <div className="section"><div className="sectionHead"><div><h2>Investment Profit</h2><p>Projection and realized-profit tracking.</p></div><button className="ghost">Open module <ArrowUpRight size={16}/></button></div><div className="profit"><div><span>Projected / realized profit</span><b>$0.00</b><small>Profit is credited only from verified trading/settlement events.</small></div><div className="bars"><i/><i/><i/><i/><i/><i/><i/></div></div></div>
      <div className="section"><div className="sectionHead"><div><h2>Platform foundation</h2><p>Core modules ready for secure integration.</p></div></div><div className="modules">{['Sandbox Money','Derive','MT5','Profit Payout','KYC','Payments'].map(x=><div className="module" key={x}><span>{x}</span><small>Foundation</small></div>)}</div></div>
    </section></main>
}
