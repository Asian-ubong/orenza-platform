import { getAdminDb, jsonError, requireUser } from '../../../../lib/paystack/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { db, user } = await requireUser(request);
    const body = await request.json().catch(() => ({}));
    const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : `welcome:${user.id}`;
    const { data, error } = await db.rpc('orenza_issue_sandbox_welcome_bonus', {
      p_user_id: user.id,
      p_amount: 5000,
      p_currency: 'USD',
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw new Error(error.message);
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return jsonError(error, 401);
  }
}

export async function GET(request: Request) {
  try {
    const { db, user } = await requireUser(request);
    const { data: wallet, error: walletError } = await db
      .from('sandbox_wallets')
      .select('id,currency,balance,allocated,available_balance,reserved_balance,realized_profit,withdrawable_profit,withdrawn_profit,lifetime_profit,lifetime_loss,payout_reserved_profit,updated_at')
      .eq('user_id', user.id)
      .eq('currency', 'USD')
      .maybeSingle();
    if (walletError) throw new Error(walletError.message);
    const { data: bonus, error: bonusError } = await db
      .from('orenza_sandbox_welcome_bonuses')
      .select('amount,currency,issued_at,expires_at,status,reference_id')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (bonusError) throw new Error(bonusError.message);
    return Response.json({ ok: true, wallet, bonus }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return jsonError(error, 401);
  }
}
