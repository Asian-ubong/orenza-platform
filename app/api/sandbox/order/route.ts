import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertSandboxOnly } from '@/lib/feature-flags';

export async function POST(request: Request) {
  try {
    assertSandboxOnly();
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

    const body = await request.json();
    const symbol = String(body?.symbol ?? '').trim();
    const side = String(body?.side ?? '').toUpperCase();
    const quantity = Number(body?.quantity);
    const entryPrice = Number(body?.entryPrice);
    const notionalUsd = Number(body?.notionalUsd);
    const idempotencyKey = String(body?.idempotencyKey ?? '');

    if (!symbol || !['BUY', 'SELL'].includes(side) || !Number.isFinite(quantity) || !Number.isFinite(entryPrice) || !Number.isFinite(notionalUsd)) {
      return NextResponse.json({ error: 'INVALID_ORDER' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('create_sandbox_order', {
      p_symbol: symbol,
      p_side: side,
      p_quantity: quantity,
      p_entry_price: entryPrice,
      p_notional_usd: notionalUsd,
      p_stop_loss: body?.stopLoss == null ? null : Number(body.stopLoss),
      p_take_profit: body?.takeProfit == null ? null : Number(body.takeProfit),
      p_idempotency_key: idempotencyKey,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, mode: 'SANDBOX', order: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'SANDBOX_ORDER_FAILED' }, { status: 500 });
  }
}
