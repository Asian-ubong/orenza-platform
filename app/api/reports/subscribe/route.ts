import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function db() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
}

function baseUrl(req: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, '');
  return new URL(req.url).origin;
}

async function send(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    return response.ok;
  } catch { return false; }
  finally { clearTimeout(timeout); }
}

export async function POST(req: Request) {
  try {
    const store = db();
    if (!store) return NextResponse.json({ error: 'Report subscription storage is not configured.' }, { status: 503 });
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const unsubscribe = crypto.randomBytes(32).toString('hex');
    const unsubscribeHash = crypto.createHash('sha256').update(unsubscribe).digest('hex');
    const { error } = await store.from('orenza_report_subscriptions').upsert({
      email, email_normalized: email, verified_at: null, enabled: true,
      verification_token_hash: tokenHash, unsubscribe_token_hash: unsubscribeHash,
    }, { onConflict: 'email_normalized' });
    if (error) return NextResponse.json({ error: 'Could not save the report subscription.' }, { status: 500 });

    const confirmUrl = `${baseUrl(req)}/api/reports/confirm?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const sent = await send(email, 'Confirm your ORENZA operational reports', `Hello,\n\nConfirm your ORENZA operational report subscription:\n${confirmUrl}\n\nYou will receive successful and failed GitHub workflow reports plus configured Supabase/system health and release reports.\n\nIf you did not request this, ignore this message. No reports will be sent until confirmation.`);
    if (!sent) return NextResponse.json({ error: 'Subscription was saved, but confirmation email delivery is not configured. Configure RESEND_API_KEY and RESEND_FROM_EMAIL, then subscribe again.' }, { status: 503 });
    return NextResponse.json({ ok: true, message: 'Confirmation email sent. Open it to activate reports.' });
  } catch { return NextResponse.json({ error: 'Unable to create the report subscription.' }, { status: 500 }); }
}
