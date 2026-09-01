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
    const orderId = String(body?.orderId ?? '');
    const pnlUsd = Number(body?.pnlUsd);
    if (!orderId || !Number.isFinite(pnlUsd)) return NextResponse.json({ error: 'INVALID_SETTLEMENT' }, { status: 400 });

    const { data, error } = await supabase.rpc('simulate_sandbox_settlement', {
      p_order_id: orderId,
      p_pnl_usd: pnlUsd,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, mode: 'SANDBOX', settlement: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'SANDBOX_SETTLEMENT_FAILED' }, { status: 500 });
  }
}
