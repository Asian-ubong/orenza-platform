import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export async function POST(req: Request) {
  try {
    const db = admin();
    if (!db) return NextResponse.json({ error: 'Server authentication is not configured.' }, { status: 503 });
    const auth = req.headers.get('authorization');
    const body = await req.json().catch(() => ({}));
    const challengeId = String(body.challenge_id || '');
    const code = String(body.code || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const purpose = body.purpose === 'signup' ? 'signup' : 'login';
    if (!challengeId || !/^\d{6}$/.test(code) || !email) return NextResponse.json({ error: 'Enter the 6-digit verification code.' }, { status: 400 });

    const { data: challenge, error } = await db.from('auth_email_otp_challenges').select('*')
      .eq('id', challengeId).eq('email', email).eq('purpose', purpose).maybeSingle();
    if (error || !challenge) return NextResponse.json({ error: 'This verification code is invalid or has expired.' }, { status: 400 });
    if (challenge.consumed_at) return NextResponse.json({ error: 'This verification code has already been used.' }, { status: 400 });
    if (new Date(challenge.expires_at).getTime() <= Date.now()) return NextResponse.json({ error: 'This verification code has expired. Request a new one.' }, { status: 400 });
    if ((challenge.attempts ?? 0) >= 5) return NextResponse.json({ error: 'Too many incorrect attempts. Request a new code.' }, { status: 429 });

    const expected = Buffer.from(challenge.code_hash, 'hex');
    const actual = crypto.createHash('sha256').update(code).digest();
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      await db.from('auth_email_otp_challenges').update({ attempts: (challenge.attempts ?? 0) + 1 }).eq('id', challenge.id);
      return NextResponse.json({ error: 'Incorrect verification code.' }, { status: 400 });
    }

    await db.from('auth_email_otp_challenges').update({ consumed_at: new Date().toISOString() }).eq('id', challenge.id);

    if (purpose === 'signup') {
      const { error: confirmError } = await db.auth.admin.updateUserById(challenge.user_id, { email_confirm: true });
      if (confirmError) return NextResponse.json({ error: 'Email verified, but the account could not be activated yet.' }, { status: 500 });
    } else if (auth?.startsWith('Bearer ')) {
      const { data: { user } } = await db.auth.getUser(auth.slice(7));
      if (!user || user.id !== challenge.user_id) return NextResponse.json({ error: 'Authentication session mismatch.' }, { status: 401 });
    }

    return NextResponse.json({ verified: true, purpose });
  } catch {
    return NextResponse.json({ error: 'Unable to verify the code.' }, { status: 500 });
  }
}
