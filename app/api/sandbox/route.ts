import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

  const [wallet, orders, allocations, ledger] = await Promise.all([
    supabase.from('sandbox_wallets').select('id,currency,balance,allocated,available_balance,reserved_balance,lifetime_allocated,daily_allocated,daily_allocation_date,status,updated_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('sandbox_orders').select('id,symbol,side,quantity,entry_price,notional_usd,status,simulated_pnl_usd,reference_id,created_at,settled_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('sandbox_allocations').select('id,amount,status,reference_id,requested_at,allocated_at').eq('user_id', user.id).order('requested_at', { ascending: false }).limit(50),
    supabase.from('sandbox_ledger_entries').select('id,entry_type,direction,amount,currency,reference_id,created_at,order_id,allocation_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
  ]);

  const firstError = [wallet.error, orders.error, allocations.error, ledger.error].find(Boolean);
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

  return NextResponse.json({ mode: 'SANDBOX', wallet: wallet.data, orders: orders.data ?? [], allocations: allocations.data ?? [], ledger: ledger.data ?? [] });
}
