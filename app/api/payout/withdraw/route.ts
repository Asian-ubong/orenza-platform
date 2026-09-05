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
    if (!db) return NextResponse.json({ error: 'Server not configured.' }, { status: 503 });

    const body = await req.json().catch(() => ({}));
    const userId = String(body.user_id || '').trim();
    const amount = Number(body.amount) || 0;
    const walletType = body.wallet_type === 'REAL' ? 'REAL_TRADING' : 'PROMO_SANDBOX';

    if (!userId || amount <= 0) {
      return NextResponse.json({ error: 'Invalid withdrawal request.' }, { status: 400 });
    }

    // Get wallet
    const { data: wallet, error: walletError } = await db
      .from('orenza_wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('wallet_type', walletType)
      .maybeSingle();

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 });
    }

    // For PROMO_SANDBOX: Only profits can be withdrawn, losses are locked
    if (walletType === 'PROMO_SANDBOX') {
      if (amount > wallet.profit_balance) {
        return NextResponse.json(
          { error: `Only $${wallet.profit_balance} profit available for withdrawal. Losses remain locked in your account.` },
          { status: 400 }
        );
      }
    } else {
      // For REAL_TRADING: Standard withdrawal
      if (amount > wallet.balance) {
        return NextResponse.json({ error: 'Insufficient balance for withdrawal.' }, { status: 400 });
      }
    }

    // Create payout request
    const { data: payout, error: payoutError } = await db
      .from('orenza_payouts')
      .insert({
        user_id: userId,
        wallet_type: walletType,
        amount,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      })
      .select('id, status, created_at')
      .single();

    if (payoutError) {
      return NextResponse.json({ error: 'Payout request could not be created.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        amount,
        wallet_type: walletType,
        status: payout.status,
        created_at: payout.created_at,
      },
      message: `Withdrawal request of $${amount} submitted. Awaiting processing.`,
    });
  } catch (e) {
    console.error('Withdrawal error:', e);
    return NextResponse.json({ error: 'Withdrawal could not be processed.' }, { status: 500 });
  }
}
