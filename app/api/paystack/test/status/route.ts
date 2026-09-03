import { assertPaystackTestOnly } from '../../../../../lib/paystack/client';
import { getAdminDb, jsonError } from '../../../../../lib/paystack/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    assertPaystackTestOnly();
    const db = getAdminDb();
    const { data, error } = await db.from('platform_runtime_controls')
      .select('sandbox_mode,real_payments_enabled,real_withdrawals_enabled,real_transfers_enabled,real_trading_enabled,real_profit_payout_enabled')
      .eq('id', true).maybeSingle();
    if (error || !data) throw new Error('RUNTIME_CONTROL_LOOKUP_FAILED');
    const hardDisabled = data.sandbox_mode === true && data.real_payments_enabled === false && data.real_withdrawals_enabled === false && data.real_transfers_enabled === false && data.real_trading_enabled === false && data.real_profit_payout_enabled === false;
    return Response.json({
      ok: hardDisabled,
      provider: 'PAYSTACK',
      environment: 'TEST',
      real_money_enabled: false,
      runtime_hard_disabled: hardDisabled,
      configured: true,
    }, { status: hardDisabled ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return jsonError(error, 503);
  }
}
