export type LiveGateStatus = {
  environment: 'DEMO' | 'REAL';
  marketDataEnabled: boolean;
  tradingEnabled: boolean;
  payoutEnabled: boolean;
  authorized: boolean;
  reason: string;
};

/**
 * Server-only feature gates. These intentionally require multiple independent
 * switches so a deploy/configuration mistake cannot silently enable real-money
 * execution or payout.
 */
export function getLiveGateStatus(): LiveGateStatus {
  const environment = process.env.ORENZA_PROVIDER_ENVIRONMENT === 'REAL' ? 'REAL' : 'DEMO';
  const authorized = process.env.ORENZA_LIVE_AUTHORIZED === 'true';
  const marketDataEnabled = process.env.ORENZA_LIVE_MARKET_DATA_ENABLED === 'true';
  const tradingEnabled =
    environment === 'REAL' &&
    authorized &&
    process.env.ORENZA_LIVE_TRADING_ENABLED === 'true';
  const payoutEnabled =
    environment === 'REAL' &&
    authorized &&
    process.env.ORENZA_LIVE_PAYOUT_ENABLED === 'true';

  const reason = environment === 'REAL'
    ? authorized
      ? 'REAL provider mode is configured; execution and payout remain independently gated.'
      : 'REAL provider mode is present but live authorization is not enabled.'
    : 'Provider chain is in DEMO mode. No real-money execution or payout is enabled.';

  return { environment, marketDataEnabled, tradingEnabled, payoutEnabled, authorized, reason };
}

export function assertLiveTradingEnabled(): void {
  const gate = getLiveGateStatus();
  if (!gate.tradingEnabled) {
    throw new Error(`LIVE_TRADING_LOCKED: ${gate.reason}`);
  }
}

export function assertLivePayoutEnabled(): void {
  const gate = getLiveGateStatus();
  if (!gate.payoutEnabled) {
    throw new Error(`LIVE_PAYOUT_LOCKED: ${gate.reason}`);
  }
}
