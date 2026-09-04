import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
}

function publicAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
}

async function sendEmail(to: string, code: string, purpose: 'signup' | 'login', fullName?: string, phone?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;
  const greeting = fullName ? `Hello ${fullName},` : 'Hello,';
  const phoneLine = phone ? `\nRegistered phone: ${phone}` : '';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject: purpose === 'signup' ? 'Your Orenza verification code' : 'Your Orenza login code',
        text: `${greeting}\n\nYour Orenza one-time verification code is ${code}.${phoneLine}\n\nIt expires in 10 minutes and can only be used once. Do not share this code. This code is sent by email only; Orenza does not send this verification code to your phone number.`,
      }),
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
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
    let fullName = '';
    let phone = '';
    if (auth?.startsWith('Bearer ')) {
      const { data: { user } } = await db.auth.getUser(auth.slice(7));
      if (user?.email?.toLowerCase() === email) {
        userId = user.id;
        fullName = String(user.user_metadata?.full_name || '');
        phone = String(user.user_metadata?.phone || '');
      }
    }

    if (!userId && purpose === 'signup') {
      userId = String(body.user_id || '');
      if (!userId) return NextResponse.json({ error: 'Registration verification could not be initialized.' }, { status: 400 });
      const { data: userData, error } = await db.auth.admin.getUserById(userId);
      if (error || userData.user?.email?.toLowerCase() !== email) {
        return NextResponse.json({ error: 'Registration verification could not be initialized.' }, { status: 400 });
      }
      fullName = String(userData.user.user_metadata?.full_name || '');
      phone = String(userData.user.user_metadata?.phone || '');
    }

    if (!userId) return NextResponse.json({ error: 'Password verification is required before a login code can be sent.' }, { status: 401 });

    const { data: recent } = await db.from('auth_email_otp_challenges').select('created_at')
      .eq('user_id', userId).eq('purpose', purpose).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (recent && Date.now() - new Date(recent.created_at).getTime() < 60_000) {
      return NextResponse.json({ error: 'Please wait 60 seconds before requesting another code.' }, { status: 429 });
    }

    await db.from('auth_email_otp_challenges').update({ consumed_at: new Date().toISOString() })
      .eq('user_id', userId).eq('purpose', purpose).is('consumed_at', null);

    // Security rule: OTPs are generated with the operating system's cryptographically secure RNG.
    // AI is never used as the entropy source for authentication codes.
    const code = String(crypto.randomInt(100000, 1000000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
    const { data: challenge, error: insertError } = await db.from('auth_email_otp_challenges').insert({
      user_id: userId, email, purpose, code_hash: codeHash, expires_at: expiresAt, attempts: 0,
    }).select('id,expires_at').single();
    if (insertError) return NextResponse.json({ error: 'Could not create verification challenge.' }, { status: 500 });

    const sent = await sendEmail(email, code, purpose, fullName, phone);
    if (sent) {
      return NextResponse.json({ challenge_id: challenge.id, expires_at: challenge.expires_at, delivery: 'email' });
    }

    // Fallback: use Supabase Auth's email OTP service. No SMS/phone delivery is used.
    await db.from('auth_email_otp_challenges').update({ consumed_at: new Date().toISOString() }).eq('id', challenge.id);
    const authClient = publicAuth();
    if (!authClient) {
      return NextResponse.json({ error: 'Email delivery is not configured. Configure Orenza email delivery or Supabase email OTP, then try again.' }, { status: 503 });
    }
    const { error: otpError } = await authClient.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (otpError) {
      return NextResponse.json({ error: `Email OTP could not be sent: ${otpError.message}` }, { status: 503 });
    }

    // The fallback challenge carries the authenticated user id so verification can
    // explicitly confirm the newly created signup account before password login.
    return NextResponse.json({ challenge_id: `supabase:${encodeURIComponent(email)}:${purpose}:${userId}`, expires_at: new Date(Date.now() + 60 * 60_000).toISOString(), delivery: 'email' });
  } catch {
    return NextResponse.json({ error: 'Unable to send the verification code by email.' }, { status: 500 });
  }
}
