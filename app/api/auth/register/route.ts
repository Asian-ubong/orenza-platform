import { NextResponse } from 'next/server';
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
    const body = await req.json().catch(() => ({}));
    const fullName = String(body.full_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const password = String(body.password || '');
    if (fullName.length < 2) return NextResponse.json({ error: 'Enter your full legal name.' }, { status: 400 });
    if (!email || !email.includes('@')) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    if (!phone) return NextResponse.json({ error: 'Enter your phone number.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    const { data: existing } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const already = existing.users.find((u) => u.email?.toLowerCase() === email);
    if (already) return NextResponse.json({ error: 'An account with this email already exists. Log in instead.' }, { status: 409 });

    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: fullName, phone },
    });
    if (error || !data.user) return NextResponse.json({ error: error?.message || 'Account creation failed.' }, { status: 400 });

    const response = await fetch(new URL('/api/auth/email-otp/send', req.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose: 'signup', user_id: data.user.id }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      await db.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ error: result.error || 'The verification code could not be sent.' }, { status: response.status });
    }

    return NextResponse.json({ user_id: data.user.id, challenge_id: result.challenge_id, expires_at: result.expires_at });
  } catch {
    return NextResponse.json({ error: 'Registration could not be completed.' }, { status: 500 });
  }
}
