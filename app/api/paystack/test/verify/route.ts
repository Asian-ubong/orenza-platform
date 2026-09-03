import { assertPaystackTestOnly, verifyTestTransaction } from '../../../../../lib/paystack/client';
import { jsonError, requireUser } from '../../../../../lib/paystack/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    assertPaystackTestOnly();
    const { db, user } = await requireUser(request);
    const body = await request.json();
    const reference = String(body?.reference ?? '');
    if (!reference) throw new Error('REFERENCE_REQUIRED');

    const { data: intent, error: intentError } = await db.from('orenza_paystack_test_transactions')
      .select('*').eq('reference', reference).eq('user_id', user.id).maybeSingle();
    if (intentError) throw new Error(`PAYSTACK_INTENT_LOOKUP_FAILED:${intentError.message}`);
    if (!intent) throw new Error('PAYSTACK_TEST_TRANSACTION_NOT_FOUND');

    const { error: gateError } = await db.rpc('orenza_assert_paystack_test_only');
    if (gateError) throw new Error(`PAYSTACK_TEST_GATE_BLOCKED:${gateError.message}`);

    const result = await verifyTestTransaction(reference);
    const data = result.data;
    if (data.domain !== 'test') throw new Error('PAYSTACK_TEST_DOMAIN_MISMATCH');
    if (data.reference !== intent.reference) throw new Error('PAYSTACK_REFERENCE_MISMATCH');
    if (data.amount !== intent.amount_subunit) throw new Error('PAYSTACK_AMOUNT_MISMATCH');
    if (String(data.currency).toUpperCase() !== String(intent.currency).toUpperCase()) throw new Error('PAYSTACK_CURRENCY_MISMATCH');
    if (data.customer?.email && data.customer.email.toLowerCase() !== intent.email.toLowerCase()) throw new Error('PAYSTACK_CUSTOMER_MISMATCH');

    const allowed = new Set(['ABANDONED','FAILED','ONGOING','PENDING','PROCESSING','SUCCESS','REVERSED']);
    const status = String(data.status).toUpperCase();
    if (!allowed.has(status)) throw new Error(`PAYSTACK_UNKNOWN_STATUS:${status}`);

    const { error: updateError } = await db.from('orenza_paystack_test_transactions').update({
      paystack_transaction_id: data.id,
      status,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('reference', reference).eq('user_id', user.id);
    if (updateError) throw new Error(`PAYSTACK_VERIFY_PERSIST_FAILED:${updateError.message}`);

    return Response.json({ ok: true, environment: 'TEST', reference, status, amount_subunit: data.amount, currency: data.currency, fulfilled: false, note: 'TEST integration never credits real-money balances.' });
  } catch (error) {
    return jsonError(error, 400);
  }
}
