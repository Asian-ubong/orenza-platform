import { jsonError } from '../../../../lib/paystack/server';
import { requireTesterAccess } from '../../../../lib/tester-access';

export const dynamic = 'force-dynamic';

/**
 * Controlled sandbox-only verification. It exercises the real backend RPC chain
 * and never submits a Deriv/MT5/real-money order.
 */
export async function POST(request: Request) {
  try {
    const { db, user } = await requireTesterAccess(request);
    const body = await request.json().catch(() => ({}));
    const symbol = typeof body.symbol === 'string' && body.symbol.trim() ? body.symbol.trim() : 'EUR/USD';
    const pnl = typeof body.realized_pnl === 'number' && Number.isFinite(body.realized_pnl) ? body.realized_pnl : 50;
    const requestId = `E2E-${user.id}-${Date.now()}`;
    const orderKey = `${requestId}:ORDER`;

    const allocation = await db.rpc('orenza_issue_sandbox_welcome_bonus', {
      p_user_id: user.id, p_amount: 5000, p_currency: 'USD', p_idempotency_key: `${user.id}:welcome:5000`,
    });
    if (allocation.error) throw new Error(allocation.error.message);

    const order = await db.rpc('create_sandbox_order', {
      p_symbol: symbol, p_side: 'BUY', p_quantity: 1, p_entry_price: 100, p_notional_usd: 100,
      p_stop_loss: null, p_take_profit: null, p_idempotency_key: orderKey,
    });
    if (order.error) throw new Error(order.error.message);
    const orderId = order.data?.order_id;
    if (!orderId) throw new Error('SANDBOX_ORDER_ID_MISSING');

    const settlement = await db.rpc('orenza_sandbox_settle_trade', {
      p_user_id: user.id, p_sandbox_order_id: orderId, p_provider: 'ORENZA_SANDBOX', p_environment: 'SANDBOX',
      p_external_trade_id: requestId, p_realized_pnl: pnl, p_returned_capital: 100,
      p_provider_reconciled: true, p_reconciliation_reference: `RECON-${requestId}`, p_request_id: requestId,
    });
    if (settlement.error) throw new Error(settlement.error.message);
    const settlementId = settlement.data?.id;
    if (!settlementId) throw new Error('SETTLEMENT_ID_MISSING');

    const eligibility = await db.rpc('orenza_check_profit_eligibility', { p_settlement_id: settlementId });
    if (eligibility.error) throw new Error(eligibility.error.message);
    const eligible = eligibility.data?.eligible === true;
    let payout = null;
    if (eligible && pnl > 0) {
      const payoutResult = await db.rpc('orenza_request_profit_payout', {
        p_user_id: user.id, p_amount: pnl, p_currency: 'USD', p_country_code: null,
        p_payout_method: 'PAYSTACK_TEST_SIMULATION', p_provider_adapter: 'PAYSTACK_TEST', p_request_id: `${requestId}:PAYOUT`,
      });
      if (payoutResult.error) throw new Error(payoutResult.error.message);
      payout = payoutResult.data;
    }

    return Response.json({ ok: true, mode: 'SANDBOX', real_money_order_submitted: false, steps: {
      authentication: 'PASS', welcome_allocation: 'PASS', sandbox_trade: 'PASS', settlement: 'PASS', pnl,
      reconciliation: settlement.data?.provider_reconciled ? 'PASS' : 'BLOCKED',
      profit_eligibility: eligible ? 'PASS' : 'BLOCKED',
      sandbox_withdrawal_request: payout ? 'PASS' : 'BLOCKED_BY_ELIGIBILITY',
      ledger_audit: 'RECORDED_BY_BACKEND', paystack_test: payout ? 'REQUEST_RECORDED_AS_PAYSTACK_TEST' : 'NOT_REACHED',
    }, allocation: allocation.data, order: order.data, settlement: settlement.data, eligibility: eligibility.data, payout,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return jsonError(error, 403);
  }
}
