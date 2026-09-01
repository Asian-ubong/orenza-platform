'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Activity, ArrowRight, BarChart3, Bell, Bot, BriefcaseBusiness, CheckCircle2,
  ChevronRight, CircleDollarSign, Clock3, CreditCard, FileText, Globe2, LockKeyhole,
  LogOut, Menu, PlayCircle, Settings, ShieldCheck, Sparkles, TrendingUp, UserRound,
  WalletCards, X, Zap,
} from 'lucide-react';

const nav = [
  ['home','HOME',BriefcaseBusiness], ['markets','MARKETS',Globe2], ['ai-premium','AI PREMIUM',Sparkles],
  ['trade','TRADE / INVEST',TrendingUp], ['portfolio','PORTFOLIO',BarChart3], ['wallet','WALLET',WalletCards],
  ['payout','PAYOUT',CircleDollarSign], ['activity','ACTIVITY',Activity], ['announcements','ANNOUNCEMENTS',Bell],
  ['events','EVENTS',Clock3], ['videos','VIDEOS',PlayCircle], ['settings','SETTINGS',Settings],
] as const;

const labels: Record<string,string> = {
  sandbox:'SANDBOX', markets:'MARKETS', 'ai-premium':'AI PREMIUM', trade:'TRADE / INVEST', portfolio:'PORTFOLIO', wallet:'WALLET',
  payout:'PAYOUT', activity:'ACTIVITY / LEDGER', announcements:'ANNOUNCEMENTS', events:'EVENTS', videos:'VIDEOS', settings:'SETTINGS',
  security:'SECURITY CENTER', 'market-detail':'MARKET DETAIL', 'payout-history':'PAYOUT HISTORY', 'profit-units':'PROFIT UNITS',
};

function Badge({children, tone='neutral'}:{children:React.ReactNode;tone?:'neutral'|'good'|'warn'|'danger'}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function Card({children, className='' }:{children:React.ReactNode;className?:string}) { return <div className={`card ${className}`}>{children}</div>; }

function Button({children, href, secondary=false, onClick}:{children:React.ReactNode;href?:string;secondary?:boolean;onClick?:()=>void}) {
  const props = href ? {onClick:()=>{ window.location.href=href; }} : {onClick};
  return <button {...props} className={secondary?'btn secondary':'btn'}>{children}<ArrowRight size={16}/></button>;
}

function ProviderState({name, connected=false}:{name:string;connected?:boolean}) {
  return <div className="provider"><div className="providerIcon"><Globe2 size={18}/></div><div><strong>{name}</strong><small>{connected?'Connected':'Not connected'}</small></div><Badge tone={connected?'good':'neutral'}>{connected?'CONNECTED':'AVAILABLE'}</Badge></div>;
}

function Dashboard() {
  return <>
    <PageHead eyebrow="PRIVATE FINANCIAL PLATFORM" title="Good morning" sub="A clear view of sandbox activity and authorized provider infrastructure." action={<Button href="/markets">Explore markets</Button>} />
    <div className="notice"><ShieldCheck size={20}/><div><strong>Private access is active</strong><span>Provider credentials remain server-side. No live execution is enabled from the interface.</span></div></div>
    <div className="metricGrid">
      <Metric label="SANDBOX" value="$100,000" sub="Virtual Capital" icon={WalletCards}/>
      <Metric label="DERIV" value="Connected" sub="Provider account" icon={Globe2} tone="good"/>
      <Metric label="MT5" value="Not Connected" sub="Optional provider" icon={TrendingUp}/>
      <Metric label="PROFIT UNITS" value="0 Units" sub="Internal records" icon={CircleDollarSign}/>
    </div>
    <Section title="Quick actions" sub="Move through the platform without mixing account sources.">
      <div className="quickGrid">{[['/sandbox','SANDBOX',WalletCards],['/markets','MARKETS',Globe2],['/ai-premium','AI PREMIUM',Sparkles],['/wallet','WALLET',CreditCard]].map(([href,title,Icon])=><a className="quick" href={href as string} key={title as string}><Icon size={19}/><span>{title}</span><ChevronRight size={16}/></a>)}</div>
    </Section>
    <Section title="Account sources" sub="Balances and provider records stay separate by design.">
      <div className="providerGrid"><ProviderState name="Sandbox Money" connected/><ProviderState name="Deriv" connected/><ProviderState name="MT5"/></div>
    </Section>
  </>;
}

function Metric({label,value,sub,icon:Icon,tone}:{label:string;value:string;sub:string;icon:any;tone?:'good'|'neutral'}) {
  return <Card><div className="metricIcon"><Icon size={18}/></div><span className="label">{label}</span><strong className="metricValue">{value}</strong><small className={tone==='good'?'goodText':''}>{sub}</small></Card>;
}

function PageHead({eyebrow,title,sub,action}:{eyebrow:string;title:string;sub:string;action?:React.ReactNode}) {
  return <header className="pageHead"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{sub}</p></div>{action}</header>;
}
function Section({title,sub,children}:{title:string;sub:string;children:React.ReactNode}) { return <section className="section"><div className="sectionHead"><div><h2>{title}</h2><p>{sub}</p></div></div>{children}</section>; }

function Sandbox() { return <><PageHead eyebrow="VIRTUAL ENVIRONMENT" title="Sandbox" sub="Virtual trading capital, kept completely separate from provider accounts." action={<Button href="/markets">Explore markets</Button>}/><div className="heroBalance"><span>Virtual Capital</span><strong>$100,000</strong><small>Sandbox allocation • virtual activity only</small></div><div className="metricGrid three"><Metric label="AVAILABLE" value="$100,000" sub="Virtual" icon={WalletCards}/><Metric label="RESERVED" value="$0" sub="Virtual" icon={LockKeyhole}/><Metric label="SANDBOX P/L" value="$0" sub="No activity" icon={TrendingUp}/></div><div className="warning"><LockKeyhole size={18}/><div><strong>SANDBOX CAPITAL</strong><span>VIRTUAL — NOT AUTOMATICALLY PAYOUT ELIGIBLE</span></div></div><Section title="Sandbox actions" sub="All actions are recorded as virtual activity."><div className="buttonRow"><Button href="/activity">View activity</Button><Button href="/markets" secondary>Explore markets</Button><Button href="/ai-premium" secondary>AI analysis</Button></div></Section></>; }

function Markets() { const markets=['BTC/USD','ETH/USD','EUR/USD','Gold','S&P 500']; return <><PageHead eyebrow="SUPPORTED MARKETS" title="Markets" sub="Market information appears only when an authorized provider connection supplies it."/><div className="tabs"><span className="active">Favorites</span><span>Forex</span><span>Synthetic / Supported</span><span>Indices</span><span>Commodities</span></div><div className="marketGrid">{markets.map((m,i)=><a className="market" href={`/market-detail?market=${encodeURIComponent(m)}`} key={m}><div><strong>{m}</strong><small>{i%2?'Forex / Supported':'Provider market'}</small></div><div className="marketPrice">Awaiting live data<small>—</small></div><Badge>LIVE DATA REQUIRED</Badge><ChevronRight size={17}/></a>)}</div></>; }

function MarketDetail() { return <><PageHead eyebrow="MARKET DETAIL" title="Selected market" sub="Live price, chart and provider data will populate after authorized market-data access."/><Card className="chartCard"><div className="chartPlaceholder"><TrendingUp size={28}/><strong>Live chart awaiting provider data</strong><span>No simulated price or performance is displayed.</span></div></Card><div className="analysisGrid"><Card><span className="label">AI ANALYSIS</span><div className="analysisRows"><div><span>Trend</span><b>Awaiting data</b></div><div><span>Momentum</span><b>Awaiting data</b></div><div><span>Volatility</span><b>Awaiting data</b></div><div><span>Market condition</span><b>Awaiting data</b></div></div></Card><Card><span className="label">AI RESULT</span><div className="aiResult">WAIT</div><p className="muted">Confidence: Not available until current market data is supplied.</p><Button href="/ai-premium">Analyze with AI</Button></Card></div><Section title="Next step" sub="AI analysis is advisory only. Real execution remains user-confirmed and server-controlled."><Button href="/trade">Open trade / investment flow</Button></Section></>; }

function AIPremium() { return <><PageHead eyebrow="INTELLIGENCE LAYER" title="Orenza AI Premium" sub="AI analyzes market information and recommends. It does not automatically execute real trades." action={<Badge tone="good">ADVISORY ONLY</Badge>}/><Card className="premiumHero"><Sparkles size={26}/><div><strong>Market Scanner</strong><span>Trending opportunities will appear from authorized provider data.</span></div></Card><div className="signalGrid">{['Market scanner','Trend monitor','Momentum monitor'].map(x=><Card key={x}><span className="label">{x.toUpperCase()}</span><h3>Awaiting authorized data</h3><p className="muted">No invented signals, confidence scores or profit claims.</p><Button href="/markets" secondary>View markets</Button></Card>)}</div></>; }

function Trade() { const [account,setAccount]=useState('SANDBOX'); return <><PageHead eyebrow="USER-CONFIRMED ACTION" title="Trade / Investment ticket" sub="Review the source, market and risk controls before confirmation."/><Card><div className="formGrid"><label>Selected account<div className="choiceRow">{['SANDBOX','DERIV','MT5'].map(x=><button key={x} onClick={()=>setAccount(x)} className={account===x?'choice selected':'choice'}>{x}{x!=='SANDBOX'&&<small>{x==='DERIV'?'Connected':'Not connected'}</small>}</button>)}</div></label><label>Selected market<input placeholder="Choose from Markets" /></label><label>Direction<div className="choiceRow"><button className="choice">BUY</button><button className="choice">SELL</button></div></label><label>Amount / Volume<input placeholder="$0.00" /></label><label>Stop Loss<input placeholder="Optional" /></label><label>Take Profit<input placeholder="Optional" /></label></div><div className="reviewBox"><strong>SOURCE: {account}</strong><span>AMOUNT: —</span><span>STATUS: {account==='SANDBOX'?'VIRTUAL ACTIVITY':'AUTHORIZED PROVIDER — SERVER VALIDATION REQUIRED'}</span></div><div className="warning"><ShieldCheck size={18}/><span>AI recommendations never execute automatically. Sensitive operations require backend validation and confirmation.</span></div><Button href="/trade/confirm">Review action</Button></Card></>; }

function Confirm() { return <><PageHead eyebrow="CONFIRMATION" title="Review your action" sub="Nothing is submitted until you explicitly confirm."/><Card><div className="reviewList">{['Account','Market','Direction','Amount','Risk controls'].map(x=><div key={x}><span>{x}</span><strong>Not selected</strong></div>)}</div><div className="buttonRow"><Button href="/activity" secondary>Cancel</Button><Button href="/activity">Confirm</Button></div></Card></>; }

function Portfolio() { return <><PageHead eyebrow="SEPARATED RECORDS" title="Portfolio" sub="Provider and sandbox records are never merged into one balance."/>{['SANDBOX ACTIVITY','DERIV ACTIVITY','MT5 ACTIVITY'].map((x,i)=><Section key={x} title={x} sub={i===0?'Virtual records':'Provider-reported records'}><div className="empty"><FileText size={20}/><span>No records available yet.</span><small>Open / closed / result / history will appear here.</small></div></Section>)}</>; }

function Wallet() { return <><PageHead eyebrow="ACCOUNT OVERVIEW" title="Orenza Wallet" sub="Separate source balances, internal units and genuinely eligible payout funds."/><div className="walletGrid">{[['SANDBOX WALLET','$100,000','Virtual Capital'],['DERIV ACCOUNT','Connected','Provider-reported information'],['MT5 ACCOUNT','Not Connected','Provider-reported information'],['PROFIT UNITS','0 Units','Internal Orenza calculation'],['PAYOUT ELIGIBILITY','$0','Only genuinely eligible balance']].map(([a,b,c])=><Card key={a}><span className="label">{a}</span><strong className="metricValue">{b}</strong><small>{c}</small></Card>)}</div><Section title="Wallet navigation" sub="Inspect each category without combining its accounting meaning."><div className="quickGrid"><a className="quick" href="/activity"><Activity size={18}/><span>Transaction history</span><ChevronRight size={16}/></a><a className="quick" href="/profit-units"><CircleDollarSign size={18}/><span>Profit Units</span><ChevronRight size={16}/></a><a className="quick" href="/payout"><CreditCard size={18}/><span>Payout</span><ChevronRight size={16}/></a></div></Section></>; }

function ProfitUnits() { return <><PageHead eyebrow="INTERNAL RECORDS" title="Profit Units" sub="Profit Units are internal records and do not automatically represent cash."/><div className="metricGrid"><Metric label="TOTAL UNITS" value="0" sub="No verified records" icon={CircleDollarSign}/><Metric label="UNIT VALUE" value="Not set" sub="Accounting rule required" icon={CreditCard}/></div><Section title="Activity history" sub="Unit ID • Source • Amount • Date • Status"><div className="empty"><FileText size={20}/><span>No Profit Unit records.</span></div></Section></>; }

function Payout() { return <><PageHead eyebrow="CONTROLLED PAYOUT" title="Payout" sub="Real-money transfer remains disabled until approved provider, reconciliation and security requirements are complete."/><Card><div className="heroBalance"><span>Eligible Balance</span><strong>$0.00</strong><small>Only genuinely eligible funds can be requested.</small></div><div className="formGrid"><label>Payout method<select><option>Approved local method</option></select></label><label>Amount<input placeholder="$0.00" /></label></div><div className="warning"><LockKeyhole size={18}/><span>Payout requests are server-controlled. No transfer is initiated by this interface.</span></div><Button href="/payout/security">Request payout</Button></Card><Section title="Payout status flow" sub="Every request receives a unique PAY-XXXXXXXX identifier."><div className="steps">{['Security check','Eligibility check','Duplicate check','Approved local provider','Processing','Ledger record'].map((x,i)=><div key={x}><span>{String(i+1).padStart(2,'0')}</span>{x}</div>)}</div></Section><Section title="History" sub="Review previous requests."><Button href="/payout-history" secondary>Open payout history</Button></Section></>; }

function PayoutSecurity() { return <><PageHead eyebrow="SECURITY CHECK" title="Verify payout access" sub="This is a protected checkpoint before any payout request could be created."/><Card><div className="checkList">{['Session security','Balance eligibility','Duplicate request check','Provider availability'].map(x=><div key={x}><CheckCircle2 size={18}/><span>{x}</span><Badge>CHECK REQUIRED</Badge></div>)}</div><div className="warning"><ShieldCheck size={18}/><span>Payout remains disabled until backend validation and approved provider integration are active.</span></div><Button href="/payout">Return to payout</Button></Card></>; }

function ActivityPage() { return <><PageHead eyebrow="AUDITABLE HISTORY" title="Activity / Ledger" sub="A complete source-separated history of platform events."/><div className="tabs"><span className="active">All</span><span>Sandbox</span><span>Deriv</span><span>MT5</span><span>Profit Units</span><span>Payout</span></div><Card><div className="empty"><Activity size={20}/><span>No activity records yet.</span><small>Unique ID • type • source • amount • status • date</small></div></Card></>; }

function PayoutHistory() { return <><PageHead eyebrow="PAYOUT RECORDS" title="Payout History" sub="Every payout request is independently tracked."/><Card><div className="empty"><CreditCard size={20}/><span>No payout records.</span><small>Payout ID • Amount • Method • Date • Status</small></div></Card></>; }

function Security() { return <><PageHead eyebrow="PROTECTION" title="Security Center" sub="Review sessions, devices and recent security activity."/><div className="signalGrid"><Card><LockKeyhole size={20}/><h3>Active sessions</h3><p className="muted">Current private session</p><Button href="/settings" secondary>Manage</Button></Card><Card><ShieldCheck size={20}/><h3>Trusted devices</h3><p className="muted">No additional devices shown.</p><Button href="/settings" secondary>Review</Button></Card><Card><Activity size={20}/><h3>Recent security activity</h3><p className="muted">No suspicious activity reported.</p><Button href="/activity" secondary>Review activity</Button></Card></div><div className="buttonRow"><button className="btn secondary">Sign out other devices <LogOut size={16}/></button><button className="btn secondary">Revoke session <X size={16}/></button></div></>; }

function SettingsPage() { return <><PageHead eyebrow="CONTROL CENTER" title="Settings" sub="Manage profile, connections, security, notifications, payout settings and privacy."/><div className="settingsGrid">{['PROFILE','CONNECTED ACCOUNTS','DERIV CONNECTION','MT5 CONNECTION','SECURITY','ACTIVE DEVICES','SESSIONS','NOTIFICATIONS','PAYOUT SETTINGS','PRIVACY'].map((x,i)=><a className="setting" href={x==='SECURITY'?'/security':undefined} key={x}><UserRound size={18}/><div><strong>{x}</strong><small>{i===2?'Connected':i===3?'Not connected':'Manage settings'}</small></div><ChevronRight size={16}/></a>)}</div></>; }

function Content({screen}:{screen:string}) {
  if(screen==='home') return <Dashboard/>; if(screen==='sandbox') return <Sandbox/>; if(screen==='markets') return <Markets/>; if(screen==='market-detail') return <MarketDetail/>;
  if(screen==='ai-premium') return <AIPremium/>; if(screen==='trade') return <Trade/>; if(screen==='trade/confirm') return <Confirm/>; if(screen==='portfolio') return <Portfolio/>;
  if(screen==='wallet') return <Wallet/>; if(screen==='profit-units') return <ProfitUnits/>; if(screen==='payout') return <Payout/>; if(screen==='payout/security') return <PayoutSecurity/>;
  if(screen==='payout-history') return <PayoutHistory/>; if(screen==='activity') return <ActivityPage/>; if(screen==='security') return <Security/>; if(screen==='settings') return <SettingsPage/>;
  if(screen==='announcements') return <Listing title="Announcements" icon={Bell} items={['Private platform update','Security maintenance notice','New market coverage']}/>;
  if(screen==='events') return <Listing title="Events" icon={Clock3} items={['Upcoming Orenza session','Live market briefing','Past platform event']}/>;
  if(screen==='videos') return <Listing title="Videos" icon={PlayCircle} items={['Education','Markets','Platform Updates','Events']}/>;
  return <Dashboard/>;
}

function Listing({title,icon:Icon,items}:{title:string;icon:any;items:string[]}) { return <><PageHead eyebrow="OFFICIAL ORENZA CONTENT" title={title} sub="Content is presented from authorized Orenza sources."/><div className="signalGrid">{items.map(x=><Card key={x}><Icon size={20}/><h3>{x}</h3><p className="muted">Details will appear when published.</p><Button href="/" secondary>View</Button></Card>)}</div></>; }

export default function Platform() {
  const pathname=usePathname(); const [open,setOpen]=useState(false); const screen=pathname.split('/').filter(Boolean).join('/')||'home';
  return <div className="appShell"><aside className={open?'open':''}><div className="brand"><span>O</span><b>ORENZA</b></div><div className="privateTag"><LockKeyhole size={14}/> PRIVATE ACCESS</div><nav>{nav.map(([key,title,Icon])=><a href={`/${key}`} className={screen===key?'active':''} key={key} onClick={()=>setOpen(false)}><Icon size={17}/><span>{title}</span></a>)}</nav><div className="sideSecurity"><ShieldCheck size={18}/><div><b>Secure mode</b><small>Credentials stay server-side</small></div></div></aside><main><div className="mobileBar"><button onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button><div className="brand"><span>O</span><b>ORENZA</b></div></div><div className="topbar"><span>{labels[screen]||'ORENZA'}</span><div><Badge tone="good">PRIVATE</Badge><button className="profile"><UserRound size={16}/></button></div></div><div className="content"><Content screen={screen}/></div></main></div>;
}
