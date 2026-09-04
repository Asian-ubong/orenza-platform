import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
}

async function sendCodeEmail(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Your Orenza identity verification code',
      text: `Your Orenza verification code is ${code}. It expires in 10 minutes. Do not share this code.`,
    }),
  });
  return response.ok;
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const db = admin();
    if (!db) return NextResponse.json({ error: 'Server authentication is not configured' }, { status: 503 });
    const { data: { user }, error: userError } = await db.auth.getUser(auth.slice(7));
    if (userError || !user?.email) return NextResponse.json({ error: 'A verified email address is required' }, { status: 401 });

    const { data: recent } = await db.from('kyc_face_otp_challenges').select('created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (recent && Date.now() - new Date(recent.created_at).getTime() < 60_000) {
      return NextResponse.json({ error: 'Please wait 60 seconds before requesting another code.' }, { status: 429 });
    }

    await db.from('kyc_face_otp_challenges').update({ consumed_at: new Date().toISOString() })
      .eq('user_id', user.id).is('consumed_at', null);

    const code = String(crypto.randomInt(100000, 1000000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
    const { data: challenge, error: insertError } = await db.from('kyc_face_otp_challenges').insert({
      user_id: user.id, code_hash: codeHash, expires_at: expiresAt, attempts: 0,
    }).select('id,expires_at').single();
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    await db.from('kyc_events').insert({ user_id: user.id, event_type: 'FACE_OTP_ISSUED', metadata: { challenge_id: challenge.id, expires_at: expiresAt } });
    const sent = await sendCodeEmail(user.email, code);
    if (!sent) return NextResponse.json({ error: 'Verification code was generated but email delivery is not configured. Add the transactional email settings and try again.' }, { status: 503 });
    return NextResponse.json({ challenge_id: challenge.id, expires_at: challenge.expires_at, email: user.email, delivery: 'email' });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to create verification challenge' }, { status: 500 });
  }
}
