import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';

export default function Splash() {
  return <main className="splash"><div className="splashOrb"/><div className="splashCard"><div className="logoMark">O</div><p className="eyebrow">ORENZA PRIVATE PLATFORM</p><h1>Secure Trading &amp;<br/>Investment Environment</h1><p className="splashSub">A private, premium financial workspace for authorized users and connected provider accounts.</p><a className="btn" href="/private-access">Enter private access <ArrowRight size={17}/></a><div className="splashTrust"><ShieldCheck size={17}/><span>Secure mode · Server-side credentials · No public signup</span></div></div></main>;
}
