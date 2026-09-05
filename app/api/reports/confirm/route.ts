import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function db() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = String(url.searchParams.get('email') || '').trim().toLowerCase();
  const token = String(url.searchParams.get('token') || '');
  if (!email || !token) return NextResponse.json({ error: 'Invalid confirmation link.' }, { status: 400 });
  const store = db();
  if (!store) return NextResponse.json({ error: 'Report subscription storage is not configured.' }, { status: 503 });
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const { data, error } = await store.from('orenza_report_subscriptions').select('id,verification_token_hash').eq('email_normalized', email).maybeSingle();
  if (error || !data || data.verification_token_hash !== hash) return NextResponse.json({ error: 'This confirmation link is invalid or has already been replaced.' }, { status: 400 });
  await store.from('orenza_report_subscriptions').update({ verified_at: new Date().toISOString(), verification_token_hash: null, enabled: true }).eq('id', data.id);
  const destination = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (destination) {
    return NextResponse.redirect(`${destination.replace(/\/$/, '')}/reports/subscribe?confirmed=1`);
  }
  return new NextResponse('<h1>ORENZA reports confirmed</h1><p>Your operational email subscription is active.</p>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
