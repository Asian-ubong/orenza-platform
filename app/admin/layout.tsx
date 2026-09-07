'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, AlertTriangle, BarChart3, Bell, Bot, CircleDollarSign, ClipboardCheck, Database, FileText, Globe2, KeyRound, LockKeyhole, Monitor, Settings, ShieldCheck, UserCheck, Users, WalletCards, Wrench } from 'lucide-react';
import './admin.css';

const groups = [
  { label: 'Overview', items: [['dashboard','Dashboard',BarChart3],['analytics','Analytics',BarChart3]] },
  { label: 'Customers', items: [['users','Users',Users],['users/verification','User Verification',UserCheck],['kyc-and-aml','KYC & AML',ShieldCheck],['compliance','Compliance Center',ShieldCheck]] },
  { label: 'Financial Operations', items: [['wallets','Wallets',WalletCards],['transactions','Transactions',CircleDollarSign],['deposits','Deposits',CircleDollarSign],['withdrawals','Withdrawals',CircleDollarSign],['transfers','Transfers',CircleDollarSign],['payments','Payments',CircleDollarSign],['investments','Investments',BarChart3],['loans','Loans',CircleDollarSign],['payout-approvals','Approval Center',ClipboardCheck]] },
  { label: 'Platform Operations', items: [['merchants','Merchants',Users],['support','Support',Bell],['notifications','Notifications',Bell],['content','Content Management',Monitor],['ai-action-queue','AI Action Queue',Bot],['risk-and-fraud','Risk & Fraud',AlertTriangle],['trading-monitor','Trading Monitor',Activity],['deriv','Deriv',Globe2],['mt5','MT5',KeyRound],['sandbox-funding','Sandbox Funding',WalletCards]] },
  { label: 'Governance', items: [['staff','Admin Users',Users],['staff/roles','Roles & Permissions',KeyRound],['audit-log','Audit Log',ClipboardCheck],['security','Security Center',ShieldCheck],['reports','Reports',FileText]] },
  { label: 'System', items: [['system-health','System Health',Activity],['system/logs','System Logs',Database],['system/maintenance','Maintenance',Settings],['runtime-controls','Runtime Controls',Settings],['settings','General Settings',Settings],['settings/financial','Financial Settings',CircleDollarSign],['settings/security','Security Settings',ShieldCheck],['build-tracker','Build Tracker',Wrench]] },
] as const;

const allItems = groups.flatMap(group => group.items);

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname.split('/')[2] || 'dashboard';

  return <div className="adminShell">
    <aside>
      <Link href="/admin" className="brand"><span>O</span><b>ORENZA ADMIN</b></Link>
      <div className="privateTag"><LockKeyhole size={14} /><span>PRIVILEGED CONTROL CENTER</span></div>
      <nav>
        {groups.map(group => <div key={group.label} className="navGroup">
          <p className="navGroupLabel">{group.label}</p>
          {group.items.map(([key, label, Icon]) => <Link className={active === key ? 'active' : ''} href={`/admin/${key}`} key={key}><Icon size={15} /><span>{label}</span></Link>)}
        </div>)}
      </nav>
      <div className="sideSecurity"><ShieldCheck size={18} /><div><b>Privileged workspace</b><small>Secrets are never rendered</small></div></div>
    </aside>
    <main>
      <div className="topbar">
        <span>ORENZA ADMIN / {allItems.find(item => item[0] === active)?.[1] || 'DASHBOARD'}</span>
        <div><span className="badge danger">PRIVILEGED</span><span className="badge good">OWNER CONTROL</span></div>
      </div>
      <div className="content">{children}</div>
    </main>
  </div>;
}
