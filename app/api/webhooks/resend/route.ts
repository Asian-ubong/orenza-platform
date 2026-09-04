import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function admin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
    : null;
}

function verifyResendWebhook(payload: string, headers: Headers) {
  const secret = process.env.RESEND_WEBHOOK_SIGNING_SECRET;
  const id = headers.get('svix-id');
  const timestamp = headers.get('svix-timestamp');
  const signatureHeader = headers.get('svix-signature');
  if (!secret || !id || !timestamp || !signatureHeader) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const encodedSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  let secretBytes: Buffer;
  try { secretBytes = Buffer.from(encodedSecret, 'base64'); } catch { return false; }
  const signed = `${id}.${timestamp}.${payload}`;
  const expected = crypto.createHmac('sha256', secretBytes).update(signed).digest('base64');

  return signatureHeader.split(' ').some((entry) => {
    const [version, signature] = entry.split(',', 2);
    if (version !== 'v1' || !signature) return false;
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function POST(req: Request) {
  const payload = await req.text();

  if (!verifyResendWebhook(payload, req.headers)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }

  const db = admin();
  if (!db) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });

  let event: any;
  try { event = JSON.parse(payload); } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  if (event?.type !== 'email.received') return NextResponse.json({ ok: true, ignored: true });

  const data = event.data || {};
  const emailId = String(data.email_id || '').trim();
  if (!emailId) return NextResponse.json({ error: 'Missing email_id.' }, { status: 400 });

  const row = {
    resend_email_id: emailId,
    message_id: data.message_id ? String(data.message_id) : null,
    sender: data.from ? String(data.from) : null,
    recipients: Array.isArray(data.to) ? data.to.map(String) : [],
    subject: data.subject ? String(data.subject) : null,
    received_at: data.created_at ? String(data.created_at) : null,
    event_created_at: event.created_at ? String(event.created_at) : null,
    payload_hash: sha256(payload),
    processed_at: new Date().toISOString(),
    processing_status: 'PROCESSED',
    error_message: null,
    metadata: {
      webhook_id: req.headers.get('svix-id'),
      attachment_count: Array.isArray(data.attachments) ? data.attachments.length : 0,
    },
    updated_at: new Date().toISOString(),
  };

  const { error } = await db.from('resend_inbound_events').upsert(row, { onConflict: 'resend_email_id' });
  if (error) {
    return NextResponse.json({ error: 'Inbound event could not be persisted.' }, { status: 500 });
  }

  await db.from('security_events').insert({
    event_type: 'resend.email.received',
    severity: 'INFO',
    metadata: {
      resend_email_id: emailId,
      sender: row.sender,
      recipients: row.recipients,
      subject: row.subject,
      attachment_count: row.metadata.attachment_count,
    },
  });

  return NextResponse.json({ ok: true, received: true, email_id: emailId });
}
