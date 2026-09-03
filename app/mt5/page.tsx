'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, RefreshCw, Server, ShieldCheck, TrendingUp, WalletCards } from 'lucide-react';

type Status = {
  environment: 'DEMO'|'REAL'; connected: boolean; tradingEnabled: boolean; marketDataEnabled: boolean;
  accountId: string|null; bridgeConfigured: boolean; healthChecked: boolean; message: string;
};

function makeTerminalPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, n => chars[n % chars.length]).join('');
}

export default function MT5Page() {
  const [status, setStatus] = useState<Status|null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try { const response = await fetch('/api/mt5/status', { cache: 'no-store' }); setStatus(await response.json()); }
    finally { setRefreshing(false); }
  }
  useEffect(() => { refresh(); }, []);

  const demo = status?.environment !== 'REAL';
  const terminalLogin = status?.accountId || 'Assigned after demo account provisioning';
  const brokerServer = demo ? 'ORENZA-DEMO / MT5' : 'ORENZA-REAL / MT5';
  const terminalState = status?.connected ? 'CONNECTED' : 'WAITING FOR BRIDGE';
  const generated = useMemo(() => password || '', [password]);

  function createPassword() { setPassword(makeTerminalPassword()); setSaved(false); }
  function savePassword() { if (password) setSaved(true); }

  return <main className="platformShell" style={{background:'#FAF9F6',minHeight:'100vh',color:'#0B192B'}}>
    <header className="pageHead" style={{alignItems:'center'}}>
      <div>
        <p className="eyebrow" style={{color:'#2A402D'}}>ORENZA · MT5 TERMINAL</p>
        <h1 style={{color:'#2A402D'}}>MetaTrader 5 workspace</h1>
        <p className="muted">A web terminal shell for the same demo-first MT5 workflow shown in your reference screens.</p>
      </div>
      <button className="btn" onClick={refresh} disabled={refreshing}>{refreshing?'Checking…':'Refresh terminal'} <RefreshCw size={16}/></button>
    </header>

    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 310px',gap:14,alignItems:'start'}}>
      <section className="card" style={{padding:0,overflow:'hidden',background:'#05070A',color:'#F5F5F5',borderColor:'#222'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'#0D1015',borderBottom:'1px solid #252932',fontSize:11}}>
          <strong style={{color:'#C9A063'}}>ORENZA MT5 · {demo?'DEMO':'REAL'}</strong><span style={{color:status?.connected?'#4CAF50':'#C9A063'}}>● {terminalState}</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'165px 1fr',minHeight:500}}>
          <aside style={{position:'static',width:'auto',padding:10,background:'#080A0D',borderRight:'1px solid #252932',display:'block'}}>
            <div style={{fontSize:9,color:'#8F98A3',marginBottom:8}}>MARKET WATCH</div>
            {['Exponential Growth Index 2','EUR/USD','BTC/USD','XAU/USD','NAS100'].map((symbol,i)=><div key={symbol} style={{padding:'9px 7px',borderBottom:'1px solid #171A1F',fontSize:10}}><b>{symbol}</b><div style={{color:i===0?'#4CAF50':'#AEB6C0',marginTop:3}}>{i===0?'M2 · LIVE DEMO':'Awaiting provider data'}</div></div>)}
            <div style={{marginTop:14,fontSize:9,color:'#8F98A3'}}>ACCOUNT</div>
            <div style={{padding:'9px 7px',fontSize:10}}>Balance<br/><b style={{color:'#FAF9F6'}}>{status?.connected?'Provider reported':'—'}</b></div>
          </aside>
          <div style={{position:'relative',background:'#020304'}}>
            <div style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',borderBottom:'1px solid #252932',fontSize:10}}><span>Exponential Growth Index 2 · M2</span><span style={{color:'#4CAF50'}}>DEMO MARKET</span></div>
            <div style={{height:280,position:'relative',backgroundImage:'linear-gradient(#1A1D22 1px,transparent 1px),linear-gradient(90deg,#1A1D22 1px,transparent 1px)',backgroundSize:'48px 38px'}}>
              <div style={{position:'absolute',left:'7%',right:'7%',top:'55%',height:2,background:'#C9A063',transform:'rotate(-8deg)',boxShadow:'0 0 12px rgba(201,160,99,.5)'}}/>
              <div style={{position:'absolute',left:'7%',right:'8%',top:'57%',height:70,borderTop:'2px solid #4CAF50',borderRadius:'50%',transform:'skewY(-8deg)'}}/>
              <span style={{position:'absolute',right:10,top:'52%',color:'#4CAF50',fontSize:10}}>DEMO TICK</span>
            </div>
            <div style={{height:125,borderTop:'1px solid #252932',padding:10,fontSize:9,color:'#AEB6C0'}}>
              MACD(12,26,9) · RSI(14) · Provider indicators will populate after bridge connection.
              <div style={{marginTop:30,height:1,background:'#2A2E35'}}/>
            </div>
            <div style={{display:'flex',gap:8,padding:10,borderTop:'1px solid #252932'}}><button className="btn" style={{background:'#2A402D'}}>BUY 0.01</button><button className="btn secondary" style={{background:'#8B0000',color:'#fff'}}>SELL 0.01</button></div>
          </div>
        </div>
      </section>

      <div style={{display:'grid',gap:12}}>
        <section className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><strong>Terminal credentials</strong><ShieldCheck size={18} color="#2A402D"/></div>
          <p className="muted" style={{marginTop:5}}>The broker-assigned login is immutable. The terminal password can be regenerated by the user when the connected bridge supports credential rotation.</p>
          <label style={{display:'block',fontSize:10,fontWeight:750,marginTop:14}}>LOGIN</label>
          <div style={{padding:11,marginTop:6,border:'1px solid #dcd4c4',borderRadius:9,background:'#f1eee5',fontSize:11,fontWeight:800}}>{terminalLogin}</div>
          <label style={{display:'block',fontSize:10,fontWeight:750,marginTop:12}}>BROKER / SERVER</label>
          <div style={{padding:11,marginTop:6,border:'1px solid #dcd4c4',borderRadius:9,background:'#fffdf8',fontSize:11}}>{brokerServer}</div>
          <label style={{display:'block',fontSize:10,fontWeight:750,marginTop:12}}>PASSWORD</label>
          <div style={{display:'flex',gap:6,marginTop:6}}><input readOnly value={showPassword?generated:(generated?'••••••••••••••':'Not generated')} style={{flex:1,border:'1px solid #dcd4c4',borderRadius:9,padding:11,background:'#fffdf8'}}/><button type="button" className="btn secondary" onClick={()=>setShowPassword(v=>!v)} aria-label="Toggle password visibility">{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div>
          <div style={{display:'flex',gap:7,marginTop:9}}><button type="button" className="btn secondary" onClick={createPassword}>Create password</button><button type="button" className="btn" onClick={savePassword} disabled={!password}>Save change</button></div>
          {saved&&<div style={{marginTop:9,fontSize:10,color:'#27783a'}}><CheckCircle2 size={14}/> Password change recorded locally; broker-side rotation still requires the authorized MT5 bridge.</div>}
        </section>

        <section className="card">
          <strong>Connection gates</strong>
          <div className="checkList" style={{marginTop:12}}>
            <div><Server size={16}/><span>Bridge</span><span className={`badge ${status?.bridgeConfigured?'good':''}`}>{status?.bridgeConfigured?'CONFIGURED':'NOT CONFIGURED'}</span></div>
            <div><Activity size={16}/><span>Health</span><span className={`badge ${status?.healthChecked&&status?.connected?'good':''}`}>{status?.connected?'HEALTHY':'CHECK REQUIRED'}</span></div>
            <div><TrendingUp size={16}/><span>Trading</span><span className="badge">{status?.tradingEnabled?'ENABLED':'LOCKED'}</span></div>
            <div><WalletCards size={16}/><span>Environment</span><span className="badge good">{demo?'DEMO FIRST':'REAL'}</span></div>
          </div>
        </section>
      </div>
    </div>

    <section className="section" style={{marginTop:14}}><div className="sectionHead"><div><h2>MT5 test sequence</h2><p>Use the terminal like your reference: account → chart → indicators → order ticket. Demo comes before any real authorization.</p></div></div><div className="steps">{['Create/receive immutable demo login','Create a memorable terminal password','Connect Orenza MT5 demo bridge','Stream demo market data','Test BUY / SELL demo lifecycle','Reconcile activity before any real authorization'].map((step,i)=><div key={step}><span>{String(i+1).padStart(2,'0')}</span>{step}</div>)}</div></section>

    <div className="notice" style={{marginTop:14}}><LockKeyhole size={18}/><div><strong>Security boundary</strong><span>Orenza can prepare the terminal experience and credential workflow, but it cannot invent a broker login or claim that a password change reached MT5 without a live authorized bridge. Real-money execution stays independently gated.</span></div></div>
  </main>;
}
