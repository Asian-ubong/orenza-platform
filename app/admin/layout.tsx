'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, AlertTriangle, BarChart3, Bell, Bot, CircleDollarSign, ClipboardCheck, Database, Globe2, KeyRound, LockKeyhole, Monitor, Settings, ShieldCheck, UserCheck, Users, WalletCards } from 'lucide-react';
import './admin.css';

const items = [
  ['dashboard','DASHBOARD',BarChart3],['users','USERS',Users],['allowlist','ALLOWLIST',ShieldCheck],['kyc-and-aml','KYC & AML',UserCheck],['sandbox-funding','SANDBOX FUNDING',WalletCards],['trading-monitor','TRADING MONITOR',Activity],['deriv','DERIV',Globe2],['mt5','MT5',KeyRound],['wallets','WALLETS',WalletCards],['ledger','LEDGER',Database],['profit-units','PROFIT UNITS',CircleDollarSign],['payout-approvals','PAYOUT APPROVALS',ClipboardCheck],['local-transactions','LOCAL TRANSACTIONS',CircleDollarSign],['ai-action-queue','AI ACTION QUEUE',Bot],['risk-and-fraud','RISK & FRAUD',AlertTriangle],['notifications','NOTIFICATIONS',Bell],['content','CONTENT',Monitor],['security','SECURITY',ShieldCheck],['incidents','INCIDENTS',AlertTriangle],['system-health','SYSTEM HEALTH',Settings],['runtime-controls','RUNTIME CONTROLS',Settings],['audit-log','AUDIT LOG',ClipboardCheck],
] as const;

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname.split('/')[2] || 'dashboard';
  return <div className="adminShell"><aside><Link href="/admin" className="brand"><span>O</span><b>ORENZA</b></Link><div className="privateTag"><LockKeyhole size={14}/> OWNER CONTROL CENTER</div><nav>{items.map(([key,label,Icon])=><Link className={active===key?'active':''} href={`/admin/${key}`} key={key}><Icon size={15}/><span>{label}</span></Link>)}</nav><div className="sideSecurity"><ShieldCheck size={18}/><div><b>Privileged workspace</b><small>Secrets are never rendered</small></div></div></aside><main><div className="topbar"><span>ORENZA ADMIN / {items.find(x=>x[0]===active)?.[1] || 'DASHBOARD'}</span><div><span className="badge danger">PRIVILEGED</span><span className="badge good">OWNER CONTROL</span></div></div><div className="content">{children}</div></main></div>;
}
