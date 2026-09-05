import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function POST(req: Request) {
  try {
    const db = adminClient();
    if (!db) {
      return NextResponse.json(
        { error: 'Registration is temporarily unavailable because server authentication is not configured.' },
        { status: 503 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const fullName = String(body.full_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const password = String(body.password || '');

    if (fullName.length < 2) return NextResponse.json({ error: 'Enter your full legal name.' }, { status: 400 });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    if (!phone || phone.includes('@')) return NextResponse.json({ error: 'Enter a valid phone number.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    const metadata = { full_name: fullName, phone };
    const created = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: metadata,
    });

    let user = created.data.user;
    if (created.error) {
      const message = created.error.message.toLowerCase();
      const duplicate = message.includes('already registered') || message.includes('already exists') || message.includes('user already registered');
      if (!duplicate) {
        return NextResponse.json({ error: 'Account creation failed. Please try again.' }, { status: 400 });
      }

      // A previous attempt may have created the account but failed before OTP delivery.
      // Reuse only an unconfirmed account; never overwrite an already verified account.
      const existing = await db.auth.admin.getUserByEmail(email);
      const existingUser = existing.data.user;
      if (!existingUser) return NextResponse.json({ error: 'An account with this email already exists. Log in instead.' }, { status: 409 });
      if (existingUser.email_confirmed_at) return NextResponse.json({ error: 'An account with this email already exists. Log in instead.' }, { status: 409 });

      const repaired = await db.auth.admin.updateUserById(existingUser.id, {
        password,
        user_metadata: metadata,
      });
      if (repaired.error || !repaired.data.user) {
        return NextResponse.json({ error: 'The existing registration could not be resumed. Please try again.' }, { status: 400 });
      }
      user = repaired.data.user;
    }

    if (!user) return NextResponse.json({ error: 'Account creation failed.' }, { status: 400 });

    return NextResponse.json({
      user_id: user.id,
      email: user.email,
      authenticated: false,
      otp_required: true,
      status: 'created',
    });
  } catch {
    return NextResponse.json({ error: 'Registration could not be completed.' }, { status: 500 });
  }
}
