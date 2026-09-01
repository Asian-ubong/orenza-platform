import { NextResponse } from 'next/server';
import { featureFlags } from '@/lib/feature-flags';

export async function POST() {
  if (!featureFlags.realProfitPayout || !featureFlags.realPayments || !featureFlags.realWithdrawals) {
    return NextResponse.json({
      error: 'REAL_PAYOUT_DISABLED',
      mode: 'SANDBOX',
      message: 'Real-money payout is disabled in Version 1. No customer funds are accepted or transferred.',
    }, { status: 403 });
  }

  return NextResponse.json({ error: 'PAYOUT_PROVIDER_NOT_CONFIGURED' }, { status: 503 });
}
