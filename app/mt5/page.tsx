import { Activity, CheckCircle2, LockKeyhole, Server, ShieldCheck, TrendingUp, WalletCards } from 'lucide-react';
import { getMT5ConnectionStatus } from '../../lib/mt5/adapter';

export const dynamic = 'force-dynamic';

export default function MT5Page() {
  const status = getMT5ConnectionStatus();
  const demo = status.environment === 'DEMO';

  return (
    <main className="platformShell">
      <header className="pageHead">
        <div>
          <p className="eyebrow">AURENZA BROKER · MT5 PROVIDER</p>
          <h1>MetaTrader 5</h1>
          <p className="muted">Server-controlled MT5 account, market-data and trading bridge for AURENZA BROKER.</p>
        </div>
        <span className={`badge ${status.connected ? 'good' : 'neutral'}`}>
          {status.connected ? 'CONFIGURED' : 'NOT CONNECTED'}
        </span>
      </header>

      <div className="notice">
        <ShieldCheck size={20} />
        <div>
          <strong>MT5 stays isolated from Sandbox and Deriv</strong>
          <span>Credentials belong on the server/bridge only. AURENZA BROKER will never display or store an MT5 password in the browser.</span>
        </div>
      </div>

      <section className="metricGrid">
        <div className="card"><div className="metricIcon"><Server size={18} /></div><span className="label">ENVIRONMENT</span><strong className="metricValue">{status.environment}</strong><small>{demo ? 'Safe demo-first mode' : 'REAL mode requires explicit authorization'}</small></div>
        <div className="card"><div className="metricIcon"><Activity size={18} /></div><span className="label">MARKET DATA</span><strong className="metricValue">{status.marketDataEnabled ? 'READY TO CHECK' : 'OFF'}</strong><small>Requires successful bridge health check</small></div>
        <div className="card"><div className="metricIcon"><TrendingUp size={18} /></div><span className="label">TRADING</span><strong className="metricValue">{status.tradingEnabled ? 'ENABLED' : 'LOCKED'}</strong><small>User confirmation + server validation required</small></div>
        <div className="card"><div className="metricIcon"><WalletCards size={18} /></div><span className="label">ACCOUNT</span><strong className="metricValue">{status.accountId ?? '—'}</strong><small>Provider-reported account only</small></div>
      </section>

      <section className="section">
        <div className="sectionHead"><div><h2>Connection status</h2><p>{status.message}</p></div></div>
        <div className="card">
          <div className="checkList">
            <div><CheckCircle2 size={18} /><span>Server-side MT5 adapter</span><span className="badge good">READY</span></div>
            <div><LockKeyhole size={18} /><span>Browser credential exposure</span><span className="badge good">BLOCKED</span></div>
            <div><Server size={18} /><span>MT5 bridge health</span><span className="badge">CHECK REQUIRED</span></div>
            <div><TrendingUp size={18} /><span>Order execution</span><span className="badge">LOCKED</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHead"><div><h2>MT5 test sequence</h2><p>Demo first. No real-money action is enabled by this page.</p></div></div>
        <div className="steps">
          {['Configure approved demo MT5 bridge','Health-check bridge and account identity','Stream demo ticks/account snapshots','Reconcile positions and orders','Test demo order lifecycle','Verify ledger events before any REAL authorization'].map((step, i) => <div key={step}><span>{String(i + 1).padStart(2, '0')}</span>{step}</div>)}
        </div>
      </section>

      <div className="warning">
        <LockKeyhole size={18} />
        <span>REAL MT5 trading remains locked until a successful demo end-to-end test, explicit authorization, and verified server-side bridge are in place.</span>
      </div>
    </main>
  );
}
