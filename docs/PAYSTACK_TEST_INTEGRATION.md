# Paystack TEST integration

Orenza now contains a server-side Paystack TEST integration. It is intentionally incapable of using live Paystack keys and does not credit real-money balances.

## Safety boundary

The adapter rejects any environment other than `PAYSTACK_ENVIRONMENT=TEST` and rejects any Paystack secret that does not start with `sk_test_`. Database requests also call `orenza_assert_paystack_test_only()`, which requires sandbox mode and all real-money/trading controls to remain false.

The existing hard-disable migration remains authoritative: real payments, withdrawals, transfers, trading, and profit payouts stay disabled.

## Required server configuration

```text
PAYSTACK_ENVIRONMENT=TEST
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_WEBHOOK_SECRET=sk_test_...
PAYSTACK_TEST_CALLBACK_URL=https://YOUR_DOMAIN.example/payments/paystack/callback
```

Do not commit the values or expose the secret to browser code.

## API flow

Authenticated user:

`POST /api/paystack/test/initialize`

Body:

```json
{"amount_subunit":50000,"currency":"NGN"}
```

The server creates a unique Orenza reference, initializes Paystack, and returns the Paystack authorization URL/access code.

After checkout:

`POST /api/paystack/test/verify`

Body:

```json
{"reference":"ORZ_TEST_..."}
```

The server verifies the transaction with Paystack and checks domain, reference, amount, currency, and customer email before recording the status.

Webhook:

`POST /api/paystack/test/webhook`

The webhook validates `x-paystack-signature`, deduplicates events by a SHA-256 event ID, and server-verifies matching transactions before recording their status.

Status:

`GET /api/paystack/test/status`

This reports whether Paystack TEST is configured and whether Orenza's real-money gates are still hard-disabled.

## Important limitation

This TEST integration deliberately stops at payment-state recording. It does **not** move, withdraw, settle, or credit real money. A later production adapter must be separately designed, authorized, tested, and gated before any live key can be accepted.
