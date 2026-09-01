import assert from 'node:assert/strict';
import { featureFlags, assertSandboxOnly } from '../lib/feature-flags';

assert.equal(featureFlags.sandboxMode, true);
assert.equal(featureFlags.realPayments, false);
assert.equal(featureFlags.realWithdrawals, false);
assert.equal(featureFlags.realTransfers, false);
assert.equal(featureFlags.realTrading, false);
assert.equal(featureFlags.realProfitPayout, false);

assert.doesNotThrow(() => assertSandboxOnly());

console.log('SANDBOX SAFETY VERIFICATION: PASS');
console.log('Real trading/payments/withdrawals/transfers/profit payout: DISABLED');
