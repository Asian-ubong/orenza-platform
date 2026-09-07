import Link from 'next/link';
import { Activity, AlertTriangle, Bell, Bot, BarChart3, CircleDollarSign, ClipboardCheck, Database, FileText, Globe2, KeyRound, LockKeyhole, Monitor, Settings, ShieldCheck, UserCheck, Users, WalletCards } from 'lucide-react';

export const ADMIN_SCREENS = [
  ['dashboard','Dashboard','Executive overview, KPIs and operational alerts',BarChart3],
  ['analytics','Analytics','Performance, growth, financial and operational analytics',BarChart3],
  ['users','Users','Search, filter and manage platform users',Users],
  ['users/profile','User Profile','Identity, activity, balances, KYC and account controls',Users],
  ['users/verification','User Verification','Review identity and account verification',UserCheck],
  ['kyc-and-aml','KYC & AML','Compliance queue, cases and risk signals',ShieldCheck],
  ['kyc-and-aml/review','KYC Review','Inspect evidence and approve, reject or escalate',ClipboardCheck],
  ['compliance','Compliance Center','Rules, monitoring, cases and regulatory controls',ShieldCheck],
  ['wallets','Wallets','Wallet balances, status and account-level controls',WalletCards],
  ['wallets/transactions','Wallet Transactions','Wallet transaction history and filters',Database],
  ['transactions','Transactions','Global transaction monitoring and search',CircleDollarSign],
  ['transactions/review','Transaction Review','Investigate flagged or pending transactions',ClipboardCheck],
  ['transactions/details','Transaction Details','Full transaction timeline and audit context',FileText],
  ['deposits','Deposits','Deposit queue, status and reconciliation',CircleDollarSign],
  ['deposits/details','Deposit Details','Deposit evidence, status and actions',FileText],
  ['withdrawals','Withdrawals','Withdrawal queue and approval workflow',CircleDollarSign],
  ['withdrawals/review','Withdrawal Review','Risk review and controlled approval',ClipboardCheck],
  ['transfers','Transfers','Internal and external transfer operations',CircleDollarSign],
  ['transfers/details','Transfer Details','Transfer timeline, parties and controls',FileText],
  ['investments','Investments','Investment portfolio and product operations',BarChart3],
  ['investments/products','Investment Products','Create and manage investment products',Database],
  ['investments/details','Investment Details','Product performance, holdings and lifecycle',FileText],
  ['loans','Loans','Loan portfolio, applications and repayment status',CircleDollarSign],
  ['loans/review','Loan Application Review','Review applicant data, risk and decision',ClipboardCheck],
  ['loans/details','Loan Details','Loan lifecycle, repayments and actions',FileText],
  ['payments','Payments','Payment activity and settlement monitoring',CircleDollarSign],
  ['merchants','Merchants','Merchant onboarding, status and controls',Users],
  ['support','Support','Support workload and service health',Bell],
  ['support/tickets','Ticket Management','Search, assign and resolve support tickets',Bell],
  ['support/disputes','Disputes','Dispute intake, evidence and resolution',ClipboardCheck],
  ['notifications','Notifications','Operational and user notification center',Bell],
  ['notifications/create','Create Notification','Compose and schedule controlled notifications',Bell],
  ['notifications/campaigns','Campaigns','Notification campaigns and delivery metrics',Monitor],
  ['content','CMS','Manage platform content and announcements',Monitor],
  ['content/configuration','App Configuration','Controlled product and feature configuration',Settings],
  ['staff','Admin Users','Manage privileged staff accounts',Users],
  ['staff/roles','Roles & Permissions','Role-based access and approval boundaries',KeyRound],
  ['audit-log','Audit Log','Immutable administrative action history',LockKeyhole],
  ['security','Security Center','Sessions, MFA, access controls and security events',ShieldCheck],
  ['reports','Reports','Operational and financial reporting',FileText],
  ['reports/export','Report Export','Generate controlled CSV/PDF data exports',FileText],
  ['system-health','System Health','Providers, jobs, uptime and service status',Activity],
  ['system/logs','System Logs','Application and infrastructure event logs',Database],
  ['system/maintenance','Maintenance','Maintenance windows and operational controls',Settings],
  ['settings','General Settings','Platform preferences and defaults',Settings],
  ['settings/financial','Financial Settings','Currencies, limits, fees and settlement settings',CircleDollarSign],
  ['settings/security','Security Settings','Security policy and session configuration',ShieldCheck],
  ['payout-approvals','Approval Center','Owner-gated high-impact actions',ClipboardCheck],
  ['ai-action-queue','AI Action Queue','Review AI recommendations before execution',Bot],
  ['risk-and-fraud','Risk & Fraud','Risk events, rules and fraud controls',AlertTriangle],
  ['trading-monitor','Trading Monitor','Trading operations and exposure monitoring',Activity],
  ['deriv','Deriv','Deriv provider status and market operations',Globe2],
  ['mt5','MT5','MetaTrader integration status and operations',KeyRound],
  ['sandbox-funding','Sandbox Funding','Review demo funding requests',WalletCards],
  ['runtime-controls','Runtime Controls','Feature flags and real-money safety boundaries',Settings],
] as const;

const iconFor = (path:string) => ADMIN_SCREENS.find(s=>s[0]===path)?.[3] ?? Settings;
const titleFor = (path:string) => ADMIN_SCREENS.find(s=>s[0]===path)?.[1] ?? path.split('/').pop()?.replace(/-/g,' ') ?? 'Admin';
const descFor = (path:string) => ADMIN_SCREENS.find(s=>s[0]===path)?.[2] ?? 'Administrative workspace';

function Metric({label,value,detail}:{label:string;value:string;detail:string}){return <div className="adminMetric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>}
function Table({type}:{type:string}){const rows=[['ORE-10482','Customer account','Pending review','Today'],['ORE-10479','Compliance case','Escalated','Today'],['ORE-10473','Withdrawal request','Awaiting approval','1h ago'],['ORE-10461','Support ticket','Assigned','2h ago'],['ORE-10442','System event','Resolved','3h ago']];return <div className="adminTableWrap"><table><thead><tr><th>ID</th><th>Item</th><th>Status</th><th>Updated</th><th>Action</th></tr></thead><tbody>{rows.map(r=><tr key={r[0]}><td>{r[0]}</td><td>{type} · {r[1]}</td><td><span className="status">{r[2]}</span></td><td>{r[3]}</td><td><Link href={`/admin/${type.toLowerCase().replaceAll(' ','-')}/details`}>View</Link></td></tr>)}</tbody></table></div>}

export default function AdminPage(){return <AdminScreen path="dashboard"/>}

export function AdminScreen({path}:{path:string}){
  const Icon=iconFor(path); const title=titleFor(path); const desc=descFor(path); const isDashboard=path==='dashboard';
  return <div>
    <header className="pageHead"><div><p className="eyebrow">ORENZA ADMIN / PRIVILEGED OPERATIONS</p><h1><Icon size={26}/> {title}</h1><p className="muted">{desc}. Every sensitive action is permission-checked, confirmation-gated and written to the audit trail.</p></div><div className="headActions"><Link className="adminButton secondary" href="/admin/audit-log">Audit log</Link><Link className="adminButton" href="/admin/payout-approvals">Approval center</Link></div></header>
    <div className="warning"><ShieldCheck size={18}/><span><b>Safety boundary:</b> real-money payments, withdrawals, transfers, live trading and other high-impact actions require explicit server-side authorization and approval. UI visibility never grants permission.</span></div>
    {isDashboard ? <>
      <section className="metricGrid"><Metric label="ACTIVE USERS" value="24,891" detail="+8.4% this month"/><Metric label="PENDING KYC" value="128" detail="34 high priority"/><Metric label="PENDING APPROVALS" value="17" detail="6 high risk"/><Metric label="SYSTEM STATUS" value="Healthy" detail="All critical services online"/></section>
      <section className="sectionGrid"><div className="card"><div className="sectionHead"><div><p className="eyebrow">OPERATIONS</p><h2>Work queues</h2></div><Link href="/admin/transactions">Open all</Link></div><Table type="Operations"/></div><div className="card"><div className="sectionHead"><div><p className="eyebrow">SECURITY</p><h2>Live control posture</h2></div></div><div className="controlList"><div><span>Sandbox mode</span><b className="goodText">ON</b></div><div><span>Real payments</span><b className="dangerText">OFF</b></div><div><span>Real trading</span><b className="dangerText">OFF</b></div><div><span>Owner approval</span><b className="goodText">REQUIRED</b></div><div><span>Audit logging</span><b className="goodText">ENFORCED</b></div></div></div></section>
      <section className="section"><div className="card"><div className="sectionHead"><div><p className="eyebrow">ALL ADMIN WORKSPACES</p><h2>Management modules</h2></div></div><div className="workspaceGrid">{ADMIN_SCREENS.filter(s=>!s[0].includes('/')).map(([key,label,d,ItemIcon])=><Link href={`/admin/${key}`} className="workspace" key={key}><ItemIcon size={18}/><div><b>{label}</b><small>{d}</small></div></Link>)}</div></div></section>
    </> : <section className="sectionGrid"><div className="card"><div className="sectionHead"><div><p className="eyebrow">WORKSPACE</p><h2>{title}</h2></div><span className="badge good">READY</span></div><div className="placeholderHero"><Icon size={30}/><div><b>{title} workspace</b><p className="muted">The screen foundation is active with navigation, responsive layout, data-table surfaces, filters/actions and permission-aware operation boundaries ready for live API wiring.</p></div></div><Table type={title}/></div><div className="card"><p className="eyebrow">QUICK NAVIGATION</p><div className="quickLinks">{ADMIN_SCREENS.filter(s=>s[0]!==path && (s[0].startsWith(path.split('/')[0]+'/') || s[0].startsWith(path.split('/')[0]))).slice(0,8).map(([key,label])=><Link href={`/admin/${key}`} key={key}>{label}</Link>)}</div><p className="eyebrow" style={{marginTop:24}}>CONTROLLED ACTIONS</p><div className="actionStack"><Link className="adminButton" href="/admin/payout-approvals">Request approval</Link><Link className="adminButton secondary" href="/admin/audit-log">Inspect audit trail</Link></div></div></section>}
  </div>
}
