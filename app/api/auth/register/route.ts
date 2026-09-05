import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Registration must work with the browser-safe Supabase publishable key.
// Never put a service-role/secret key in a client-facing flow.
const FALLBACK_SUPABASE_URL = 'https://snqfmhvumqpizjhqopoh.supabase.co';
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mHevxxxy7xzWvcx4JxVp5w_6xgRLhVQ';

function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || FALLBACK_SUPABASE_URL;
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    FALLBACK_SUPABASE_PUBLISHABLE_KEY
  );
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const fullName = String(body.full_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const password = String(body.password || '');

    if (fullName.length < 2) return NextResponse.json({ error: 'Enter your full legal name.' }, { status: 400 });
    if (!email || !email.includes('@')) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    if (!phone) return NextResponse.json({ error: 'Enter your phone number.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    const { data, error } = await authClient().auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });

    if (error) {
      const message = error.message.toLowerCase();
      const duplicate = message.includes('already registered') || message.includes('already exists') || message.includes('user already registered');
      return NextResponse.json(
        { error: duplicate ? 'An account with this email already exists. Log in instead.' : error.message },
        { status: duplicate ? 409 : 400 },
      );
    }

    if (!data.user) return NextResponse.json({ error: 'Account creation failed.' }, { status: 400 });

    return NextResponse.json({
      user_id: data.user.id,
      authenticated: Boolean(data.session),
      otp_required: !data.session,
    });
  } catch {
    return NextResponse.json({ error: 'Registration could not be completed.' }, { status: 500 });
  }
}
