import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVER_CREDENTIALS_NOT_CONFIGURED');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value ?? cookieStore.get('access_token')?.value;
  if (!accessToken) return Response.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });

  const admin = serverClient();
  const { data: { user }, error: authError } = await admin.auth.getUser(accessToken);
  if (authError || !user) return Response.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });

  const [{ data: wallet }, { data: orders }, { data: settlements }, { data: allocations }] = await Promise.all([
    admin.from('sandbox_wallets').select('currency,balance,available_balance,withdrawable_profit,withdrawn_profit,payout_reserved_profit,updated_at').eq('user_id', user.id).maybeSingle(),
    admin.from('orenza_sandbox_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    admin.from('orenza_sandbox_settlements').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    admin.from('sandbox_allocations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
  ]);

  return Response.json({ ok: true, user_id: user.id, wallet: wallet ?? null, orders: orders ?? [], settlements: settlements ?? [], allocations: allocations ?? [] }, { headers: { 'cache-control': 'no-store' } });
}
