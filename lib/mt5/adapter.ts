export type MT5Environment = 'DEMO' | 'REAL';

export type MT5ConnectionStatus = {
  provider: 'MT5';
  environment: MT5Environment;
  connected: boolean;
  tradingEnabled: boolean;
  marketDataEnabled: boolean;
  accountId: string | null;
  message: string;
};

/**
 * Server-side MT5 adapter boundary.
 *
 * ORENZA deliberately does not put MT5 credentials in the browser. A real
 * implementation should connect this adapter to an approved MT5 bridge or
 * broker gateway (for example, an MT5 Expert Advisor/service or broker API)
 * and normalize account, position, order and tick events here.
 */
export function getMT5ConnectionStatus(): MT5ConnectionStatus {
  const configured = Boolean(
    process.env.MT5_BRIDGE_URL &&
    process.env.MT5_BRIDGE_TOKEN
  );

  return {
    provider: 'MT5',
    environment: process.env.MT5_ENVIRONMENT === 'REAL' ? 'REAL' : 'DEMO',
    connected: configured,
    tradingEnabled: configured && process.env.MT5_TRADING_ENABLED === 'true',
    marketDataEnabled: configured,
    accountId: process.env.MT5_ACCOUNT_ID ?? null,
    message: configured
      ? 'MT5 bridge configuration detected; runtime connectivity still requires a successful bridge health check.'
      : 'MT5 demo bridge is not configured. Add server-side bridge settings before connecting an account.',
  };
}
