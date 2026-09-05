import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function db() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
}

function validSignature(raw: string, timestamp: string | null, signature: string | null) {
  const secret = process.env.ORENZA_REPORT_WEBHOOK_SECRET;
  if (!secret || !timestamp || !signature) return false;
  const age = Math.abs(Date.now() - Number(timestamp));
  if (!Number.isFinite(age) || age > 5 * 60_000) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature)); } catch { return false; }
}

async function send(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  return response.ok;
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get('x-orenza-report-timestamp'), req.headers.get('x-orenza-report-signature'))) {
    return NextResponse.json({ error: 'Unauthorized report dispatch.' }, { status: 401 });
  }
  const body = JSON.parse(raw);
  const source = String(body.source || 'system');
  const status = String(body.status || 'unknown').toUpperCase();
  const store = db();
  if (!store) return NextResponse.json({ error: 'Report storage is unavailable.' }, { status: 503 });
  const { data: subscribers } = await store.from('orenza_report_subscriptions').select('id,email,report_sources').eq('enabled', true).not('verified_at', 'is', null);
  const recipients = (subscribers || []).filter(s => Array.isArray(s.report_sources) && s.report_sources.includes(source));
  const title = String(body.title || `${source} report`);
  const lines = [
    `ORENZA OPERATIONAL REPORT`,
    `Source: ${source}`,
    `Status: ${status}`,
    `Workflow/service: ${String(body.name || 'ORENZA')}`,
    `Branch/environment: ${String(body.branch || body.environment || '—')}`,
    `Commit: ${String(body.commit || '—')}`,
    `Time: ${String(body.time || new Date().toISOString())}`,
    '',
    String(body.message || 'No summary provided.'),
    '',
    body.url ? `Open report: ${String(body.url)}` : '',
    body.details ? `\nDetails:\n${String(body.details).slice(0, 12000)}` : '',
    '',
    'ORENZA reports never intentionally include secrets, passwords, OTP values, private keys, or full KYC documents.',
  ].join('\n');
  let sent = 0;
  for (const subscriber of recipients) {
    if (await send(subscriber.email, `[ORENZA] ${status}: ${title}`, lines)) sent++;
  }
  if (recipients.length) await store.from('orenza_report_subscriptions').update({ last_report_sent_at: new Date().toISOString() }).in('id', recipients.map(r => r.id));
  return NextResponse.json({ ok: true, recipients: recipients.length, sent });
}
