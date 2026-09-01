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
    const amount = Number(body?.amount);
    const idempotencyKey = String(body?.idempotencyKey ?? '');

    if (!Number.isFinite(amount) || amount < 50 || amount > 200) {
      return NextResponse.json({ error: 'SANDBOX_ALLOCATION_LIMIT' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('request_sandbox_allocation', {
      p_amount: amount,
      p_idempotency_key: idempotencyKey,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, mode: 'SANDBOX', allocation: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'SANDBOX_ALLOCATION_FAILED' }, { status: 500 });
  }
}
