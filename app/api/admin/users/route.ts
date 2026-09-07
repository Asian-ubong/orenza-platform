import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ADMIN_ROLES = new Set(['OWNER', 'ADMIN']);

function serverAdmin() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
}

async function actor() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;

  const jar = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(items) { items.forEach(({ name, value, options }) => jar.set(name, value, options)); },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: access } = await supabase
    .from('orenza_private_access')
    .select('role,status')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  return access && ADMIN_ROLES.has(String(access.role).toUpperCase())
    ? { id: user.id, role: String(access.role).toUpperCase() }
    : null;
}

export async function GET() {
  const user = await actor();
  if (!user) return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 });

  const db = serverAdmin();
  if (!db) return NextResponse.json({ error: 'Server authentication is not configured.' }, { status: 503 });

  const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (error) {
    console.error('[admin/users] listUsers failed:', error.message);
    return NextResponse.json({ error: 'Could not load users.' }, { status: 500 });
  }

  return NextResponse.json({
    users: (data.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? '',
      full_name: String(u.user_metadata?.full_name ?? '').trim(),
      phone: String(u.user_metadata?.phone ?? '').trim(),
      email_confirmed: Boolean(u.email_confirmed_at),
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      disabled: Boolean(u.banned_until),
    })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const user = await actor();
  if (!user) return NextResponse.json({ error: 'Admin authorization required.' }, { status: 403 });

  const db = serverAdmin();
  if (!db) return NextResponse.json({ error: 'Server authentication is not configured.' }, { status: 503 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'A valid JSON request body is required.' }, { status: 400 });
  }

  const fullName = String(body.full_name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const phone = String(body.phone ?? '').trim();
  const password = String(body.password ?? '');

  if (fullName.length < 2) return NextResponse.json({ error: 'Enter the user’s full name.' }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

  const created = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });

  if (created.error || !created.data.user) {
    const message = String(created.error?.message ?? '').toLowerCase();
    if (message.includes('already registered') || message.includes('already exists') || message.includes('user already registered')) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    console.error('[admin/users] createUser failed:', created.error?.message ?? 'unknown error');
    return NextResponse.json({ error: 'Account creation failed. Please try again.' }, { status: 400 });
  }

  const createdUser = created.data.user;
  const names = fullName.split(/\s+/);
  const firstName = names.shift() ?? '';
  const lastName = names.join(' ');

  const { error: profileError } = await db.from('profiles').upsert({
    user_id: createdUser.id,
    first_name: firstName,
    last_name: lastName,
    phone: phone || null,
    is_active: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  if (profileError) {
    await db.auth.admin.deleteUser(createdUser.id);
    console.error('[admin/users] profile upsert failed:', profileError.message);
    return NextResponse.json({ error: 'Account could not be finalized. No partial account was kept.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: createdUser.id,
      email: createdUser.email,
      full_name: fullName,
      phone,
      email_confirmed: Boolean(createdUser.email_confirmed_at),
      created_at: createdUser.created_at,
    },
  }, { status: 201 });
}
