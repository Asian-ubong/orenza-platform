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
  if (error) return NextResponse.json({ ok: false, status: 'FAILURE', latency_ms: latencyMs, message: 'Supabase connectivity/table health check failed.' }, { status: 503 });
  return NextResponse.json({ ok: true, status: 'SUCCESS', latency_ms: latencyMs, message: `Supabase operational health check passed. Report subscription records: ${count ?? 0}.` });
}
