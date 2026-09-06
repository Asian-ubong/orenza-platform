import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function adminDb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
}

async function currentUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://snqfmhvumqpizjhqopoh.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'sb_publishable_mHevxxxy7xzWvcx4JxVp5w_6xgRLhVQ';
  const jar = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (items) => items.forEach(({ name, value, options }) => jar.set(name, value, options)),
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const db = adminDb();
    if (!db) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 });

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    const currency = String(body.currency || 'USD').trim().toUpperCase();
    const payoutMethod = String(body.payout_method || 'MANUAL').trim().toUpperCase();

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Enter a valid profit amount greater than zero.' }, { status: 400 });
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      return NextResponse.json({ error: 'Invalid payout currency.' }, { status: 400 });
    }
    if (!payoutMethod || payoutMethod.length > 40) {
      return NextResponse.json({ error: 'Invalid payout method.' }, { status: 400 });
    }

    // The authenticated user is always taken from the session; client-supplied user_id is ignored.
    // The database function locks the canonical sandbox wallet and reserves profit atomically.
    const { data, error } = await db.rpc('orenza_create_profit_payout', {
      p_user_id: user.id,
      p_amount: amount,
      p_currency: currency,
      p_payout_method: payoutMethod,
      p_provider_adapter: 'SANDBOX_DISABLED',
    });

    if (error) {
      const code = String(error.message || '');
      if (code.includes('WALLET_NOT_FOUND')) return NextResponse.json({ error: 'Profit wallet not found.' }, { status: 404 });
      if (code.includes('INSUFFICIENT_PROFIT')) return NextResponse.json({ error: 'Requested amount is greater than your available withdrawable profit.' }, { status: 400 });
      if (code.includes('INVALID_AMOUNT')) return NextResponse.json({ error: 'Enter a valid profit amount greater than zero.' }, { status: 400 });
      console.error('Profit payout creation error:', error);
      return NextResponse.json({ error: 'Payout request could not be created.' }, { status: 500 });
    }

    const payout = Array.isArray(data) ? data[0] : data;
    if (!payout) return NextResponse.json({ error: 'Payout request could not be created.' }, { status: 500 });

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        payout_id: payout.payout_id,
        request_id: payout.request_id,
        amount: payout.amount,
        currency: payout.currency,
        payout_method: payout.payout_method,
        provider_adapter: payout.provider_adapter,
        status: payout.status,
        created_at: payout.created_at,
      },
      available_profit: payout.available_profit,
      execution: 'DISABLED',
      message: `Profit payout request ${payout.payout_id} submitted for approval. No real-money transfer was initiated.`,
    }, { status: 201 });
  } catch (e) {
    console.error('Profit payout error:', e);
    return NextResponse.json({ error: 'Payout could not be processed.' }, { status: 500 });
  }
}
