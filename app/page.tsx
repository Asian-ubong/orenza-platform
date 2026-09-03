import { ArrowRight, LogIn, ShieldCheck, UserPlus } from 'lucide-react';

export default function Splash() {
  return <main className="splash authLanding"><div className="splashOrb"/><div className="splashCard">
    <img className="brandHeroLogo" style={{width:'min(360px,100%)',height:'auto',display:'block',marginBottom:25}} src="/brand/orenza-mark.svg" alt="ORENZA"/>
    <p className="eyebrow">ORENZA · SECURE ACCOUNT ACCESS</p>
    <h1>Smart Trading.<br/>Secure Future.</h1>
    <p className="splashSub">Create or access your Orenza account first. Email verification opens the authenticated workspace, where approved testers can then activate their private invitation.</p>
    <div className="landingActions"><a className="btn" href="/register"><UserPlus size={17}/> Register <ArrowRight size={17}/></a><a className="btn secondary" href="/login"><LogIn size={17}/> Login <ArrowRight size={17}/></a></div>
    <div className="splashTrust"><ShieldCheck size={17}/><span>OTP verification · Authenticated access · Tester authorization remains separate</span></div>
  </div></main>;
}
