import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://snqfmhvumqpizjhqopoh.supabase.co';
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mHevxxxy7xzWvcx4JxVp5w_6xgRLhVQ';

function serverAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function publicAuthClient() {
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
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    if (!phone || phone.includes('@')) return NextResponse.json({ error: 'Enter a valid phone number.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    const metadata = { full_name: fullName, phone };
    const admin = serverAdminClient();

    // Preferred production path: a server-only Supabase secret creates and
    // confirms the account without sending an email confirmation message.
    if (admin) {
      const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      });

      let user = created.data.user;
      if (created.error) {
        const message = created.error.message.toLowerCase();
        const duplicate = message.includes('already registered') || message.includes('already exists') || message.includes('user already registered');
        if (!duplicate) {
          console.error('[auth/register] admin.createUser failed:', created.error.message);
          return NextResponse.json({ error: 'Account creation failed. Please try again.' }, { status: 400 });
        }

        const existing = await admin.auth.admin.getUserByEmail(email);
        const existingUser = existing.data.user;
        if (!existingUser) return NextResponse.json({ error: 'An account with this email already exists. Log in instead.' }, { status: 409 });
        if (existingUser.email_confirmed_at) return NextResponse.json({ error: 'An account with this email already exists. Log in instead.' }, { status: 409 });

        const repaired = await admin.auth.admin.updateUserById(existingUser.id, {
          password,
          email_confirm: true,
          user_metadata: metadata,
        });
        if (repaired.error || !repaired.data.user) {
          console.error('[auth/register] admin.updateUserById failed:', repaired.error?.message);
          return NextResponse.json({ error: 'The existing registration could not be resumed. Please try again.' }, { status: 400 });
        }
        user = repaired.data.user;
      }

      if (!user) return NextResponse.json({ error: 'Account creation failed.' }, { status: 400 });
      return NextResponse.json({ user_id: user.id, email: user.email, authenticated: false, status: 'created' });
    }

    // Fallback path for the current tester environment. The database trigger
    // auto-confirms email accounts, so Supabase returns a session immediately
    // and no confirmation/OTP email is sent.
    const publicClient = publicAuthClient();
    const { data, error } = await publicClient.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });

    if (error) {
      console.error('[auth/register] public signUp failed:', error.message);
      return NextResponse.json({ error: 'Account creation failed. Please try again.' }, { status: 400 });
    }

    if (!data.user || !data.session) {
      return NextResponse.json({ error: 'Account creation could not start the ORENZA session. Please try again.' }, { status: 503 });
    }

    return NextResponse.json({
      user_id: data.user.id,
      email: data.user.email,
      authenticated: true,
      status: 'created',
    });
  } catch (error) {
    console.error('[auth/register] unexpected error:', error);
    return NextResponse.json({ error: 'Registration could not be completed.' }, { status: 500 });
  }
}
