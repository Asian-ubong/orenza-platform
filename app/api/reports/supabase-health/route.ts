import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { sendOrenzaEmail } from '@/lib/reports/mailer';

export const runtime = 'nodejs';

function validSignature(raw: string, timestamp: string | null, signature: string | null) {
  const secret = process.env.ORENZA_REPORT_WEBHOOK_SECRET;
  if (!secret || !timestamp || !signature) return false;
  const age = Math.abs(Date.now() - Number(timestamp));
  if (!Number.isFinite(age) || age > 5 * 60_000) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature)); } catch { return false; }
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
  let configured = true;
  if (subscribers?.length) {
    const text = ['ORENZA SUPABASE HEALTH REPORT', `Status: ${status}`, `Latency: ${latencyMs} ms`, `Time: ${new Date().toISOString()}`, '', message, '', 'Operational status only; secrets and sensitive user data are excluded.'].join('\n');
    const sentIds: string[] = [];
    for (const subscriber of subscribers) {
      const result = await sendOrenzaEmail({ to: subscriber.email, subject: `[ORENZA] ${status}: Supabase health`, text });
      configured = configured && result.configured;
      if (result.ok) { sent++; sentIds.push(subscriber.id); }
    }
    if (sentIds.length) await db.from('orenza_report_subscriptions').update({ last_report_sent_at: new Date().toISOString() }).in('id', sentIds);
  }
  if (subscribers?.length && !configured) return NextResponse.json({ ok: false, status: 'EMAIL_NOT_CONFIGURED', latency_ms: latencyMs, sent }, { status: 503 });
  return NextResponse.json({ ok: !error, status, latency_ms: latencyMs, sent }, { status: error ? 503 : 200 });
}
