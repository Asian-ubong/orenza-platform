import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
}

async function sendEmail(to: string, code: string, purpose: 'signup' | 'login') {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: purpose === 'signup' ? 'Your Orenza verification code' : 'Your Orenza login code',
      text: `Your Orenza one-time verification code is ${code}. It expires in 10 minutes and can only be used once. Do not share this code.`,
    }),
  });
  return response.ok;
}

export async function POST(req: Request) {
  try {
    const db = admin();
    if (!db) return NextResponse.json({ error: 'Server authentication is not configured.' }, { status: 503 });
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const purpose = body.purpose === 'signup' ? 'signup' : 'login';
    const auth = req.headers.get('authorization');

    let userId = '';
    if (auth?.startsWith('Bearer ')) {
      const { data: { user } } = await db.auth.getUser(auth.slice(7));
      if (user?.email?.toLowerCase() === email) userId = user.id;
    }

    if (!userId && purpose === 'signup') {
      userId = String(body.user_id || '');
      if (!userId) return NextResponse.json({ error: 'Registration verification could not be initialized.' }, { status: 400 });
      const { data: userData, error } = await db.auth.admin.getUserById(userId);
      if (error || userData.user?.email?.toLowerCase() !== email) {
        return NextResponse.json({ error: 'Registration verification could not be initialized.' }, { status: 400 });
      }
    }

    if (!userId) return NextResponse.json({ error: 'Password verification is required before a login code can be sent.' }, { status: 401 });

    const { data: recent } = await db.from('auth_email_otp_challenges').select('created_at')
      .eq('user_id', userId).eq('purpose', purpose).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (recent && Date.now() - new Date(recent.created_at).getTime() < 60_000) {
      return NextResponse.json({ error: 'Please wait 60 seconds before requesting another code.' }, { status: 429 });
    }

    await db.from('auth_email_otp_challenges').update({ consumed_at: new Date().toISOString() })
      .eq('user_id', userId).eq('purpose', purpose).is('consumed_at', null);

    const code = String(crypto.randomInt(100000, 1000000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
    const { data: challenge, error: insertError } = await db.from('auth_email_otp_challenges').insert({
      user_id: userId, email, purpose, code_hash: codeHash, expires_at: expiresAt, attempts: 0,
    }).select('id,expires_at').single();
    if (insertError) return NextResponse.json({ error: 'Could not create verification challenge.' }, { status: 500 });

    const sent = await sendEmail(email, code, purpose);
    if (!sent) {
      await db.from('auth_email_otp_challenges').update({ consumed_at: new Date().toISOString() }).eq('id', challenge.id);
      return NextResponse.json({ error: 'Email delivery is not configured. Configure the Orenza transactional email settings and try again.' }, { status: 503 });
    }

    return NextResponse.json({ challenge_id: challenge.id, expires_at: challenge.expires_at, delivery: 'email' });
  } catch {
    return NextResponse.json({ error: 'Unable to send the verification code.' }, { status: 500 });
  }
}
