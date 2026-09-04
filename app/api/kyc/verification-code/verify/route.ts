import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const db = admin();
    if (!db) return NextResponse.json({ error: 'Server authentication is not configured' }, { status: 503 });
    const { data: { user }, error: userError } = await db.auth.getUser(auth.slice(7));
    if (userError || !user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const body = await req.json();
    const challengeId = String(body.challenge_id || '');
    const code = String(body.code || '').replace(/\D/g, '');
    if (!challengeId || code.length !== 6) return NextResponse.json({ error: 'Enter the 6-digit verification code.' }, { status: 400 });

    const { data: challenge, error } = await db.from('kyc_face_otp_challenges')
      .select('id,user_id,code_hash,expires_at,consumed_at,attempts')
      .eq('id', challengeId).eq('user_id', user.id).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!challenge) return NextResponse.json({ error: 'Verification code not found. Request a new code.' }, { status: 404 });
    if (challenge.consumed_at) return NextResponse.json({ error: 'This verification code has already been used.' }, { status: 400 });
    if (new Date(challenge.expires_at).getTime() < Date.now()) return NextResponse.json({ error: 'This verification code has expired. Request a new code.' }, { status: 400 });
    if ((challenge.attempts || 0) >= 5) return NextResponse.json({ error: 'Too many attempts. Request a new code.' }, { status: 429 });

    const hash = crypto.createHash('sha256').update(code).digest('hex');
    const valid = crypto.timingSafeEqual(Buffer.from(hash, 'utf8'), Buffer.from(challenge.code_hash, 'utf8'));
    if (!valid) {
      await db.from('kyc_face_otp_challenges').update({ attempts: (challenge.attempts || 0) + 1 }).eq('id', challenge.id);
      return NextResponse.json({ error: 'Incorrect verification code.' }, { status: 400 });
    }

    await db.from('kyc_face_otp_challenges').update({ consumed_at: new Date().toISOString() }).eq('id', challenge.id);
    await db.from('kyc_events').insert({ user_id: user.id, event_type: 'FACE_OTP_VERIFIED', metadata: { challenge_id: challenge.id } });
    return NextResponse.json({ verified: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to verify code' }, { status: 500 });
  }
}
