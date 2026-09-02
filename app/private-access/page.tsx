import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';

export default function PrivateAccess() {
  return <main className="gate"><div className="gateCard"><div className="brandHeroMark small">A</div><p className="eyebrow">AURENZA BROKER · PRIVATE ACCESS</p><h1>WELCOME TO AURENZA</h1><p>Private Trading &amp; Investment Platform</p><div className="gateNotice"><LockKeyhole size={18}/><span>Access is restricted to authorized users.</span></div><a className="btn full" href="/provider-login">Continue <ArrowRight size={17}/></a><div className="splashTrust"><ShieldCheck size={16}/><span>Authorized access only</span></div></div></main>;
}
