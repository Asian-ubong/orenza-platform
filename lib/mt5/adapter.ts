import { getLiveGateStatus } from '../providers/live-gates';

export type MT5Environment = 'DEMO' | 'REAL';

export type MT5ConnectionStatus = {
  provider: 'MT5';
  environment: MT5Environment;
  connected: boolean;
  tradingEnabled: boolean;
  marketDataEnabled: boolean;
  accountId: string | null;
  bridgeConfigured: boolean;
  healthChecked: boolean;
  message: string;
};

function getEnvironment(): MT5Environment {
  return process.env.MT5_ENVIRONMENT === 'REAL' ? 'REAL' : 'DEMO';
}

/** Server-side MT5 bridge health check. Credentials/tokens never reach the browser. */
export async function getMT5ConnectionStatus(): Promise<MT5ConnectionStatus> {
  const environment = getEnvironment();
  const bridgeConfigured = Boolean(process.env.MT5_BRIDGE_URL && process.env.MT5_BRIDGE_TOKEN);
  const gate = getLiveGateStatus();

  if (!bridgeConfigured) {
    return {
      provider: 'MT5', environment, connected: false,
      tradingEnabled: false, marketDataEnabled: false,
      accountId: process.env.MT5_ACCOUNT_ID ?? null,
      bridgeConfigured: false, healthChecked: false,
      message: 'MT5 bridge is not configured; add server-side bridge settings before connecting an account.',
    };
  }

  let healthy = false;
  try {
    const response = await fetch(`${process.env.MT5_BRIDGE_URL!.replace(/\/$/, '')}/health`, {
      headers: { Authorization: `Bearer ${process.env.MT5_BRIDGE_TOKEN}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    healthy = response.ok;
  } catch {
    healthy = false;
  }

  const realTradingGate = environment === 'REAL' && gate.tradingEnabled && process.env.MT5_TRADING_ENABLED === 'true';
  return {
    provider: 'MT5', environment,
    connected: healthy,
    tradingEnabled: healthy && realTradingGate,
    marketDataEnabled: healthy,
    accountId: process.env.MT5_ACCOUNT_ID ?? null,
    bridgeConfigured: true,
    healthChecked: true,
    message: healthy
      ? environment === 'REAL'
        ? 'MT5 bridge is healthy. Real execution remains independently gated and is not enabled by health status alone.'
        : 'MT5 demo bridge is healthy; real-money execution is unavailable in DEMO mode.'
      : 'MT5 bridge is configured but health check failed.',
  };
}
