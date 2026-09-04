'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react';

export default function LiveTradingGatePage() {
  return <main style={{minHeight:'100vh',background:'#FAF9F6',color:'#0B192B',padding:'32px 20px',fontFamily:'Inter,system-ui,sans-serif'}}>
    <div style={{maxWidth:820,margin:'0 auto'}}>
      <p className="eyebrow">ORENZA · LIVE TRADING</p>
      <h1 style={{color:'#2A402D',fontSize:'clamp(34px,6vw,58px)',margin:'8px 0'}}>Choose Live Trading</h1>
      <p className="muted" style={{fontSize:16,lineHeight:1.7}}>You have completed the account stage. Demo / Sandbox remains available first. Choosing Live Trading starts the KYC gate; it does not place an order or move money.</p>
      <section className="card" style={{marginTop:20}}>
        <div className="notice"><ShieldCheck size={20}/><div><strong>Live trading is controlled</strong><span>Identity verification, provider authorization, security checks and human approval are required. Real-money execution is still disabled in the current sandbox/test build.</span></div></div>
        <div style={{display:'grid',gap:10,marginTop:18}}>
          {['Demo / Sandbox completed first','Choose Live Trading','Complete KYC / identity review','If approved, receive the $5,000 virtual promotional allocation','Connect MT5 Demo and complete controlled testing','Real-money live trading remains separately locked'].map((x,i)=><div key={x} style={{display:'flex',gap:12,alignItems:'center',padding:'12px 0',borderBottom:'1px solid #eee8da'}}><CheckCircle2 size={17} color={i===5?'#8B0000':'#4CAF50'}/><span>{x}</span></div>)}
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:20}}>
          <Link className="btn" href="/kyc">Start KYC <ArrowRight size={16}/></Link>
          <Link className="btn secondary" href="/sandbox">Back to Demo / Sandbox <ArrowRight size={16}/></Link>
          <Link className="btn secondary" href="/mt5"><LockKeyhole size={16}/> MT5 Demo <ArrowRight size={16}/></Link>
        </div>
      </section>
    </div>
  </main>;
}
