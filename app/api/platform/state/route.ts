import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function adminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVER_CREDENTIALS_NOT_CONFIGURED');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function authenticatedUser() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('SUPABASE_PUBLIC_CREDENTIALS_NOT_CONFIGURED');

  const client = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {},
    },
  });

  const { data, error } = await client.auth.getUser();
  return error || !data.user ? null : data.user;
}

export async function GET() {
  try {
    const user = await authenticatedUser();
    if (!user) return Response.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });

    const admin = adminClient();
    const [{ data: wallet }, { data: orders }, { data: settlements }, { data: allocations }] = await Promise.all([
      admin.from('sandbox_wallets').select('currency,balance,available_balance,withdrawable_profit,withdrawn_profit,payout_reserved_profit,updated_at').eq('user_id', user.id).maybeSingle(),
      admin.from('orenza_sandbox_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      admin.from('orenza_sandbox_settlements').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      admin.from('sandbox_allocations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);

    return Response.json(
      { ok: true, user_id: user.id, wallet: wallet ?? null, orders: orders ?? [], settlements: settlements ?? [], allocations: allocations ?? [] },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    console.error('platform state error', error);
    return Response.json({ ok: false, error: 'PLATFORM_STATE_UNAVAILABLE' }, { status: 500, headers: { 'cache-control': 'no-store' } });
  }
}
