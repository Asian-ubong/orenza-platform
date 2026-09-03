import crypto from 'node:crypto';
import { verifyTestTransaction, verifyWebhookSignature } from '../../../../../lib/paystack/client';
import { getAdminDb } from '../../../../../lib/paystack/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  if (!verifyWebhookSignature(rawBody, signature)) {
    return Response.json({ ok: false, error: 'INVALID_PAYSTACK_SIGNATURE' }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody) as { event?: string; data?: { reference?: string } };
    const reference = event.data?.reference ?? null;
    const eventId = crypto.createHash('sha256').update(rawBody).digest('hex');
    const db = getAdminDb();

    const { error: gateError } = await db.rpc('orenza_assert_paystack_test_only');
    if (gateError) return Response.json({ ok: false, error: 'PAYSTACK_TEST_GATE_BLOCKED' }, { status: 503 });

    const { error: eventError } = await db.from('orenza_paystack_test_events').insert({
      event_id: eventId,
      event_type: String(event.event ?? 'unknown'),
      reference,
      payload: event,
    });
    if (eventError?.code === '23505') return Response.json({ ok: true, duplicate: true });
    if (eventError) throw new Error(`PAYSTACK_EVENT_PERSIST_FAILED:${eventError.message}`);

    if (reference) {
      const { data: intent } = await db.from('orenza_paystack_test_transactions')
        .select('reference,amount_subunit,currency,email').eq('reference', reference).maybeSingle();

      if (intent) {
        const verified = await verifyTestTransaction(reference);
        const data = verified.data;
        if (data.domain !== 'test' || data.reference !== intent.reference || data.amount !== intent.amount_subunit || String(data.currency).toUpperCase() !== String(intent.currency).toUpperCase()) {
          return Response.json({ ok: false, error: 'PAYSTACK_WEBHOOK_TRANSACTION_MISMATCH' }, { status: 422 });
        }
        const status = String(data.status).toUpperCase();
        await db.from('orenza_paystack_test_transactions').update({
          paystack_transaction_id: data.id,
          status,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('reference', reference);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Paystack test webhook error', error);
    return Response.json({ ok: false, error: 'PAYSTACK_WEBHOOK_PROCESSING_FAILED' }, { status: 500 });
  }
}
