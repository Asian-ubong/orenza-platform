export const featureFlags = {
  sandboxMode: true,
  realPayments: false,
  realWithdrawals: false,
  realTransfers: false,
  realTrading: false,
  realProfitPayout: false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export function assertSandboxOnly() {
  if (!featureFlags.sandboxMode || featureFlags.realTrading || featureFlags.realPayments || featureFlags.realWithdrawals || featureFlags.realTransfers || featureFlags.realProfitPayout) {
    throw new Error('SANDBOX_ONLY_CONFIGURATION_REQUIRED');
  }
}
