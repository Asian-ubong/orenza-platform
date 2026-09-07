import Link from 'next/link';
import { Activity, CheckCircle2, Circle, GitCommit, ShieldCheck, Smartphone, TestTube2, Wrench, XCircle } from 'lucide-react';

const stages = [
  ['Foundation','Separate Admin Android identity, Capacitor config and build pipeline','verified'],
  ['Navigation','Admin shell, sidebar, responsive routes and workspace navigation','verified'],
  ['Authentication','Admin session, private access and server-side role enforcement','verified'],
  ['Dashboard','Admin dashboard, operational cards, alerts and quick navigation','verified'],
  ['Android build','Dedicated android-admin project generation, APK/AAB compilation and artifact checks','in_progress'],
  ['E2E verification','Web smoke + Android emulator launch + final gate','pending'],
] as const;

const checks = [
  ['Source / TypeScript','Run typecheck before Android generation'],
  ['Next.js production build','Build the exact web application used by Admin APK'],
  ['Navigation smoke','Open dashboard and registered admin routes'],
  ['Authentication boundary','Reject unauthenticated/non-admin access server-side'],
  ['Android identity','Package must be com.orenzatech.orenza.admin'],
  ['APK integrity','Debug and release APKs must exist and be non-empty'],
  ['AAB integrity','Release AAB must exist and be non-empty'],
  ['Emulator smoke','Install Admin APK, launch package and inspect focused activity'],
] as const;

export default function BuildTrackerPage(){
  return <div>
    <header className="pageHead"><div><p className="eyebrow">ORENZA ADMIN / VERIFICATION</p><h1><Activity size={26}/> Build & Verification Tracker</h1><p className="muted">One controlled gate at a time. A module is not considered complete until its checks pass and the build pipeline is green.</p></div><div className="headActions"><Link className="adminButton secondary" href="/admin">Dashboard</Link></div></header>
    <div className="warning"><ShieldCheck size={18}/><span><b>Zero-known-error rule:</b> failed checks are fixed and rerun before the next build stage is accepted. This tracker records the verification contract; GitHub Actions remains the source of truth for CI results.</span></div>
    <section className="sectionGrid">
      <div className="card"><div className="sectionHead"><div><p className="eyebrow">PIPELINE</p><h2>Foundation → APK</h2></div><span className="badge good">CONTROLLED</span></div><div className="trackerList">{stages.map(([name,desc,status],i)=><div className="trackerRow" key={name}><div className={`trackerIcon ${status}`} >{status==='verified'?<CheckCircle2 size={18}/>:status==='in_progress'?<Wrench size={18}/>:<Circle size={18}/>}</div><div className="trackerCopy"><b>{String(i+1).padStart(2,'0')} · {name}</b><small>{desc}</small></div><span className={`badge ${status==='verified'?'good':status==='in_progress'?'warningBadge':'pendingBadge'}`}>{status.replace('_',' ').toUpperCase()}</span></div>)}</div></div>
      <div className="card"><p className="eyebrow">RELEASE TARGET</p><div className="targetCard"><Smartphone size={22}/><div><b>ORENZA Admin</b><small>com.orenzatech.orenza.admin</small><small>Separate Admin APK / AAB</small></div></div><div className="controlList"><div><span>User Android project</span><b className="goodText">ISOLATED</b></div><div><span>Admin Android project</span><b className="goodText">DEDICATED</b></div><div><span>Real-money actions</span><b className="dangerText">SERVER-GATED</b></div><div><span>Audit logging</span><b className="goodText">REQUIRED</b></div></div></div>
    </section>
    <section className="section"><div className="card"><div className="sectionHead"><div><p className="eyebrow">VERIFICATION MATRIX</p><h2>Checks we must pass</h2></div><TestTube2 size={20}/></div><div className="checkGrid">{checks.map(([name,desc])=><div className="checkItem" key={name}><CheckCircle2 size={17}/><div><b>{name}</b><small>{desc}</small></div></div>)}</div></div></section>
    <section className="sectionGrid"><div className="card"><p className="eyebrow">ERROR TRACKING</p><h2>Fix ledger</h2><div className="emptyTracker"><XCircle size={20}/><div><b>No manual errors recorded in this tracker yet.</b><small>CI failures will be diagnosed from the exact failing step, corrected, committed and rerun. Do not mark a stage green by assumption.</small></div></div></div><div className="card"><p className="eyebrow">SOURCE OF TRUTH</p><h2>Commit & CI</h2><div className="commitBox"><GitCommit size={18}/><div><b>Every fix is committed</b><small>Each verified change has a commit SHA and a corresponding CI/build result.</small></div></div><Link className="adminButton" href="/admin/system-health" style={{marginTop:12}}>Open System Health</Link></div></section>
  </div>
}
