import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
}

export async function POST(req: Request) {
  try {
    const db = admin();
    if (!db) return NextResponse.json({ error: 'Server authentication is not configured.' }, { status: 503 });

    const body = await req.json().catch(() => ({}));
    const userId = String(body.user_id || '').trim();
    const promoCode = String(body.promo_code || '').trim().toUpperCase();
    const auth = req.headers.get('authorization');

    // Verify user is authenticated
    if (!userId && !auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Check if user already has an active promo code
    const { data: existing, error: checkError } = await db
      .from('orenza_promo_codes')
      .select('id, code, activated_at')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Could not verify promo eligibility.' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json(
        { error: 'You already have an active promo code. Only one promo per account.' },
        { status: 409 }
      );
    }

    // Validate promo code exists and is available
    const { data: codeRecord, error: codeError } = await db
      .from('orenza_promo_code_registry')
      .select('id, value, created_at, is_redeemed')
      .eq('code', promoCode)
      .maybeSingle();

    if (codeError || !codeRecord) {
      return NextResponse.json({ error: 'Invalid promo code.' }, { status: 400 });
    }

    if (codeRecord.is_redeemed) {
      return NextResponse.json({ error: 'This promo code has already been used.' }, { status: 400 });
    }

    // Check if code is within validity window (not older than 40 days from creation)
    const codeAge = Date.now() - new Date(codeRecord.created_at).getTime();
    const maxAge = 40 * 24 * 60 * 60 * 1000; // 40 days in milliseconds

    if (codeAge > maxAge) {
      return NextResponse.json({ error: 'This promo code has expired.' }, { status: 400 });
    }

    // Mark code as redeemed
    const { error: redeemError } = await db
      .from('orenza_promo_code_registry')
      .update({ is_redeemed: true, redeemed_by: userId, redeemed_at: new Date().toISOString() })
      .eq('id', codeRecord.id);

    if (redeemError) {
      return NextResponse.json({ error: 'Could not redeem promo code.' }, { status: 500 });
    }

    // Create promo activation record for user
    const expiresAt = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString();
    const { data: promoRecord, error: activateError } = await db
      .from('orenza_promo_codes')
      .insert({
        user_id: userId,
        code: promoCode,
        value: codeRecord.value,
        status: 'ACTIVE',
        activated_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .select('id, value, expires_at')
      .single();

    if (activateError) {
      return NextResponse.json({ error: 'Could not activate promo code for your account.' }, { status: 500 });
    }

    // Initialize promo wallet for user
    const { data: wallet, error: walletError } = await db
      .from('orenza_wallets')
      .upsert({
        user_id: userId,
        wallet_type: 'PROMO_SANDBOX',
        balance: codeRecord.value,
        locked_balance: 0,
        profit_balance: 0,
        loss_balance: 0,
        updated_at: new Date().toISOString(),
      })
      .select('balance, locked_balance, profit_balance, loss_balance')
      .single();

    if (walletError) {
      return NextResponse.json({ error: 'Wallet could not be initialized.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      promo: {
        code: promoCode,
        value: codeRecord.value,
        expires_at: expiresAt,
        wallet: wallet,
      },
      message: `Promo code activated! $${codeRecord.value} added to your sandbox wallet. Valid for 40 days.`,
    });
  } catch (e) {
    console.error('Promo validation error:', e);
    return NextResponse.json({ error: 'Could not validate promo code.' }, { status: 500 });
  }
}
