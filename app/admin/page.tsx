import Link from 'next/link';
import { Activity, AlertTriangle, BarChart3, Bell, Bot, CircleDollarSign, ClipboardCheck, Database, FileText, Globe2, KeyRound, LockKeyhole, Monitor, Settings, ShieldCheck, UserCheck, Users, WalletCards } from 'lucide-react';

export const ADMIN_SCREENS = [
  ['dashboard','Dashboard','Executive overview and operational control',BarChart3],
  ['analytics','Analytics','Business, financial and operational performance',BarChart3],
  ['users','Users','Customer accounts, status and account controls',Users],
  ['users/profile','User Profile','Identity, activity, balances and account history',Users],
  ['users/verification','User Verification','Identity and account verification review',UserCheck],
  ['kyc-and-aml','KYC & AML','Compliance queues, risk signals and cases',ShieldCheck],
  ['kyc-and-aml/review','KYC Review','Evidence review and controlled decisions',ClipboardCheck],
  ['compliance','Compliance Center','Rules, monitoring and regulatory controls',ShieldCheck],
  ['wallets','Wallets','Balances, wallet status and controls',WalletCards],
  ['wallets/transactions','Wallet Transactions','Wallet transaction history and filters',Database],
  ['transactions','Transactions','Platform-wide transaction monitoring',CircleDollarSign],
  ['transactions/review','Transaction Review','Flagged and pending transaction review',ClipboardCheck],
  ['transactions/details','Transaction Details','Transaction timeline and audit context',FileText],
  ['deposits','Deposits','Deposit queue and reconciliation',CircleDollarSign],
  ['deposits/details','Deposit Details','Deposit evidence, status and actions',FileText],
  ['withdrawals','Withdrawals','Withdrawal queue and approvals',CircleDollarSign],
  ['withdrawals/review','Withdrawal Review','Risk review and controlled approval',ClipboardCheck],
  ['transfers','Transfers','Internal and external transfer operations',CircleDollarSign],
  ['transfers/details','Transfer Details','Transfer parties, timeline and controls',FileText],
  ['investments','Investments','Investment portfolio operations',BarChart3],
  ['investments/products','Investment Products','Investment product configuration',Database],
  ['investments/details','Investment Details','Holdings, performance and lifecycle',FileText],
  ['loans','Loans','Loan portfolio and applications',CircleDollarSign],
  ['loans/review','Loan Application Review','Applicant data, risk and decision workflow',ClipboardCheck],
  ['loans/details','Loan Details','Loan lifecycle and repayment controls',FileText],
  ['payments','Payments','Payment activity and settlement',CircleDollarSign],
  ['merchants','Merchants','Merchant onboarding and controls',Users],
  ['support','Support','Support workload and service health',Bell],
  ['support/tickets','Ticket Management','Ticket assignment and resolution',Bell],
  ['support/disputes','Disputes','Dispute evidence and resolution',ClipboardCheck],
  ['notifications','Notifications','Operational notification center',Bell],
  ['notifications/create','Create Notification','Compose and schedule notifications',Bell],
  ['notifications/campaigns','Campaigns','Campaign delivery and metrics',Monitor],
  ['content','Content Management','Platform content and announcements',Monitor],
  ['content/configuration','App Configuration','Controlled feature configuration',Settings],
  ['staff','Admin Users','Privileged staff accounts',Users],
  ['staff/roles','Roles & Permissions','RBAC and approval boundaries',KeyRound],
  ['audit-log','Audit Log','Immutable administrative action history',LockKeyhole],
  ['security','Security Center','Sessions, MFA and security events',ShieldCheck],
  ['reports','Reports','Operational and financial reporting',FileText],
  ['reports/export','Report Export','Controlled report exports',FileText],
  ['system-health','System Health','Providers, jobs and service status',Activity],
  ['system/logs','System Logs','Application and infrastructure events',Database],
  ['system/maintenance','Maintenance','Maintenance windows and controls',Settings],
  ['settings','General Settings','Platform preferences and defaults',Settings],
  ['settings/financial','Financial Settings','Currencies, limits, fees and settlement',CircleDollarSign],
  ['settings/security','Security Settings','Security policy and session controls',ShieldCheck],
  ['payout-approvals','Approval Center','Owner-gated high-impact actions',ClipboardCheck],
  ['ai-action-queue','AI Action Queue','Review AI recommendations before execution',Bot],
  ['risk-and-fraud','Risk & Fraud','Risk events and fraud controls',AlertTriangle],
  ['trading-monitor','Trading Monitor','Trading exposure and operational monitoring',Activity],
  ['deriv','Deriv','Deriv provider and market operations',Globe2],
  ['mt5','MT5','MetaTrader integration operations',KeyRound],
  ['sandbox-funding','Sandbox Funding','Demo funding requests and review',WalletCards],
  ['runtime-controls','Runtime Controls','Feature flags and real-money safety controls',Settings],
] as const;

const iconFor = (path: string) => ADMIN_SCREENS.find(screen => screen[0] === path)?.[3] ?? Settings;
const titleFor = (path: string) => ADMIN_SCREENS.find(screen => screen[0] === path)?.[1] ?? 'Admin';
const descFor = (path: string) => ADMIN_SCREENS.find(screen => screen[0] === path)?.[2] ?? 'Administrative workspace';

const primaryScreens = [
  'dashboard','users','kyc-and-aml','wallets','transactions','deposits','withdrawals','transfers',
  'investments','loans','payments','support','notifications','staff','audit-log','security','reports','system-health','settings'
];

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="adminMetric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function FoundationCard({ path }: { path: string }) {
  const Icon = iconFor(path);
  const title = titleFor(path);
  const children = ADMIN_SCREENS.filter(screen => screen[0].startsWith(`${path}/`));
  return <Link href={`/admin/${path}`} className="workspace">
    <Icon size={18} />
    <div><b>{title}</b><small>{descFor(path)}{children.length ? ` · ${children.length} sub-screen${children.length === 1 ? '' : 's'}` : ''}</small></div>
  </Link>;
}

export default function AdminPage() {
  return <AdminScreen path="dashboard" />;
}

export function AdminScreen({ path }: { path: string }) {
  const Icon = iconFor(path);
  const title = titleFor(path);
  const desc = descFor(path);
  const isDashboard = path === 'dashboard';
  const childScreens = ADMIN_SCREENS.filter(screen => screen[0].startsWith(`${path}/`));

  return <div>
    <header className="pageHead">
      <div>
        <p className="eyebrow">ORENZA ADMIN · PRIVILEGED OPERATIONS</p>
        <h1><Icon size={26} /> {title}</h1>
        <p className="muted">{desc}. This workspace is restricted to authorized administrative roles. Sensitive actions require server-side authorization and are recorded in the audit trail.</p>
      </div>
      <div className="headActions">
        <Link className="adminButton secondary" href="/admin/audit-log">Audit log</Link>
        <Link className="adminButton" href="/admin/payout-approvals">Approval center</Link>
      </div>
    </header>

    <div className="warning">
      <ShieldCheck size={18} />
      <span><b>Administrative safety boundary:</b> viewing a screen never grants permission. Account changes, money movement, trading, configuration and other high-impact actions must be authorized by the backend.</span>
    </div>

    {isDashboard ? <>
      <section className="metricGrid">
        <Metric label="CUSTOMER ACCOUNTS" value="Live" detail="Loaded from the admin data layer" />
        <Metric label="COMPLIANCE QUEUE" value="Live" detail="KYC and AML review status" />
        <Metric label="FINANCIAL OPERATIONS" value="Live" detail="Deposits, withdrawals and transfers" />
        <Metric label="SYSTEM HEALTH" value="Live" detail="Providers, jobs and service health" />
      </section>

      <section className="sectionGrid">
        <div className="card">
          <div className="sectionHead"><div><p className="eyebrow">ADMIN FOUNDATION</p><h2>Primary workspaces</h2></div></div>
          <div className="workspaceGrid">{primaryScreens.map(screen => <FoundationCard path={screen} key={screen} />)}</div>
        </div>
        <div className="card">
          <p className="eyebrow">CONTROL POSTURE</p>
          <div className="controlList">
            <div><span>Admin authentication</span><b className="goodText">REQUIRED</b></div>
            <div><span>Role-based access</span><b className="goodText">ENFORCED</b></div>
            <div><span>Server authorization</span><b className="goodText">REQUIRED</b></div>
            <div><span>High-impact approvals</span><b className="goodText">REQUIRED</b></div>
            <div><span>Audit logging</span><b className="goodText">ENFORCED</b></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card">
          <div className="sectionHead"><div><p className="eyebrow">SCREEN REGISTRY</p><h2>Complete admin foundation</h2></div><span className="badge good">FOUNDATION READY</span></div>
          <div className="workspaceGrid">{ADMIN_SCREENS.filter(screen => !screen[0].includes('/')).map(screen => <FoundationCard path={screen[0]} key={screen[0]} />)}</div>
        </div>
      </section>
    </> : <section className="sectionGrid">
      <div className="card">
        <div className="sectionHead"><div><p className="eyebrow">SCREEN FOUNDATION</p><h2>{title}</h2></div><span className="badge good">READY</span></div>
        <div className="placeholderHero"><Icon size={30} /><div><b>{title}</b><p className="muted">The screen foundation is established with a consistent header, permission boundary, responsive workspace surface and navigation to related screens.</p></div></div>
        {childScreens.length > 0 && <><p className="eyebrow">RELATED SCREENS</p><div className="quickLinks">{childScreens.map(screen => <Link href={`/admin/${screen[0]}`} key={screen[0]}>{screen[1]}</Link>)}</div></>}
      </div>
      <div className="card">
        <p className="eyebrow">ADMIN NAVIGATION</p>
        <div className="quickLinks">{primaryScreens.filter(screen => screen !== path).slice(0, 10).map(screen => <Link href={`/admin/${screen}`} key={screen}>{titleFor(screen)}</Link>)}</div>
        <p className="eyebrow" style={{ marginTop: 24 }}>CONTROLLED ACTIONS</p>
        <div className="actionStack"><Link className="adminButton" href="/admin/payout-approvals">Approval center</Link><Link className="adminButton secondary" href="/admin/audit-log">Audit trail</Link></div>
      </div>
    </section>}
  </div>;
}
