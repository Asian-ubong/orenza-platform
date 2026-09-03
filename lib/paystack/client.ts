import crypto from 'node:crypto';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY_NOT_CONFIGURED');
  if (!key.startsWith('sk_test_')) {
    throw new Error('PAYSTACK_TEST_ONLY_REQUIRES_SK_TEST_KEY');
  }
  return key;
}

export function assertPaystackTestOnly(): void {
  const environment = process.env.PAYSTACK_ENVIRONMENT ?? 'TEST';
  if (environment !== 'TEST') throw new Error('PAYSTACK_TEST_INTEGRATION_REQUIRES_TEST_ENVIRONMENT');
  secretKey();
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  assertPaystackTestOnly();
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  const body = (await response.json()) as T & { status?: boolean; message?: string };
  if (!response.ok || body.status === false) {
    throw new Error(`PAYSTACK_API_ERROR:${response.status}:${body.message ?? 'request failed'}`);
  }
  return body;
}

export type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data: { authorization_url: string; access_code: string; reference: string };
};

export type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: 'test' | 'live' | string;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    metadata?: unknown;
    customer?: { email?: string };
  };
};

export async function initializeTestTransaction(input: {
  email: string;
  amountSubunit: number;
  currency: string;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitializeResponse> {
  if (!Number.isSafeInteger(input.amountSubunit) || input.amountSubunit <= 0) {
    throw new Error('INVALID_AMOUNT_SUBUNIT');
  }
  return request<PaystackInitializeResponse>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      amount: String(input.amountSubunit),
      currency: input.currency,
      reference: input.reference,
      ...(input.callbackUrl ? { callback_url: input.callbackUrl } : {}),
      metadata: JSON.stringify({ ...input.metadata, orenza_test_only: true }),
    }),
  });
}

export async function verifyTestTransaction(reference: string): Promise<PaystackVerifyResponse> {
  if (!/^[A-Za-z0-9.=_-]+$/.test(reference)) throw new Error('INVALID_REFERENCE');
  return request<PaystackVerifyResponse>(`/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
  });
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const key = process.env.PAYSTACK_WEBHOOK_SECRET ?? process.env.PAYSTACK_SECRET_KEY;
  if (!key || !key.startsWith('sk_test_')) return false;
  const digest = crypto.createHmac('sha512', key).update(rawBody).digest('hex');
  const expected = Buffer.from(digest, 'utf8');
  const received = Buffer.from(signature, 'utf8');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}
