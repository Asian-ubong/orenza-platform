import { randomUUID } from 'node:crypto';
import { assertPaystackTestOnly, initializeTestTransaction } from '../../../../../lib/paystack/client';
import { getAdminDb, jsonError, requireUser } from '../../../../../lib/paystack/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    assertPaystackTestOnly();
    const { db, user } = await requireUser(request);
    const body = await request.json();
    const amountSubunit = body?.amount_subunit;
    const currency = String(body?.currency ?? 'NGN').toUpperCase();

    if (!Number.isSafeInteger(amountSubunit) || amountSubunit <= 0) throw new Error('INVALID_AMOUNT_SUBUNIT');
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error('INVALID_CURRENCY');

    const { error: gateError } = await db.rpc('orenza_assert_paystack_test_only');
    if (gateError) throw new Error(`PAYSTACK_TEST_GATE_BLOCKED:${gateError.message}`);

    const reference = `ORZ_TEST_${Date.now()}_${randomUUID().replaceAll('-', '')}`;
    const email = user.email;
    if (!email) throw new Error('USER_EMAIL_REQUIRED');

    const callbackUrl = process.env.PAYSTACK_TEST_CALLBACK_URL;
    const { error: insertError } = await db.from('orenza_paystack_test_transactions').insert({
      user_id: user.id,
      reference,
      amount_subunit,
      currency,
      email,
      status: 'INITIALIZED',
      metadata: { source: 'orenza', environment: 'TEST', user_id: user.id },
    });
    if (insertError) throw new Error(`PAYSTACK_INTENT_CREATE_FAILED:${insertError.message}`);

    try {
      const result = await initializeTestTransaction({
        email,
        amountSubunit,
        currency,
        reference,
        callbackUrl,
        metadata: { user_id: user.id, reference },
      });
      const { error: updateError } = await db.from('orenza_paystack_test_transactions')
        .update({ authorization_url: result.data.authorization_url, access_code: result.data.access_code, updated_at: new Date().toISOString() })
        .eq('reference', reference).eq('user_id', user.id);
      if (updateError) throw new Error(`PAYSTACK_INTENT_UPDATE_FAILED:${updateError.message}`);
      return Response.json({ ok: true, environment: 'TEST', reference, authorization_url: result.data.authorization_url, access_code: result.data.access_code });
    } catch (error) {
      await db.from('orenza_paystack_test_transactions').update({ status: 'FAILED', updated_at: new Date().toISOString() }).eq('reference', reference);
      throw error;
    }
  } catch (error) {
    return jsonError(error, 400);
  }
}
