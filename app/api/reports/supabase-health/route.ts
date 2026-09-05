import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

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
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    return response.ok;
  } catch { return false; }
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get('x-orenza-report-timestamp'), req.headers.get('x-orenza-report-signature'))) {
    return NextResponse.json({ error: 'Unauthorized health check.' }, { status: 401 });
  }
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: false, status: 'NOT_CONFIGURED', message: 'Supabase server configuration is missing.' }, { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const started = Date.now();
  const { count, error } = await db.from('orenza_report_subscriptions').select('id', { count: 'exact', head: true });
  const latencyMs = Date.now() - started;
  const status = error ? 'FAILURE' : 'SUCCESS';
  const message = error ? 'Supabase connectivity/table health check failed.' : `Supabase operational health check passed. Report subscription records: ${count ?? 0}.`;
  const { data: subscribers } = await db.from('orenza_report_subscriptions').select('id,email').eq('enabled', true).not('verified_at', 'is', null);
  let sent = 0;
  if (subscribers?.length) {
    const text = [`ORENZA SUPABASE HEALTH REPORT`, `Status: ${status}`, `Latency: ${latencyMs} ms`, `Time: ${new Date().toISOString()}`, '', message, '', 'Operational status only; secrets and sensitive user data are excluded.'].join('\n');
    for (const subscriber of subscribers) if (await send(subscriber.email, `[ORENZA] ${status}: Supabase health`, text)) sent++;
    await db.from('orenza_report_subscriptions').update({ last_report_sent_at: new Date().toISOString() }).in('id', subscribers.map(s => s.id));
  }
  return NextResponse.json({ ok: !error, status, latency_ms: latencyMs, sent }, { status: error ? 503 : 200 });
}
