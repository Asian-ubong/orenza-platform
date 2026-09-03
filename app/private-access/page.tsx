import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';

export default function PrivateAccess() {
  return <main className="gate"><div className="gateCard"><img className="brandHeroLogo small" style={{width:'min(300px,100%)',height:'auto',display:'block',marginBottom:22}} src="/brand/orenza-wordmark.svg" alt="ORENZA BROKER"/><p className="eyebrow">ORENZA · PRIVATE ACCESS</p><h1>WELCOME TO ORENZA</h1><p>Private Trading &amp; Investment Platform</p><div className="gateNotice"><LockKeyhole size={18}/><span>Access is restricted to authorized users.</span></div><a className="btn full" href="/provider-login">Continue <ArrowRight size={17}/></a><div className="splashTrust"><ShieldCheck size={16}/><span>Authorized access only</span></div></div></main>;
}
