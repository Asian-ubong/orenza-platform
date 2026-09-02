# Orenza Payout Architecture

## Principle

Orenza uses **Payout**, not a hard-coded payment provider. Payout is the internal transaction/disbursement architecture and selects an approved provider adapter based on country, currency, method, availability, and compliance configuration.

## Flow

ORENZA WALLET → PAYOUT ENGINE → PROVIDER ADAPTER → TRANSACTION PROCESSING → STATUS UPDATE → ORENZA LEDGER → USER / ADMIN

Supported adapter categories include local bank transfer, approved local payment providers, mobile money where supported, card/bank payout where supported, and other approved local transaction methods.

No provider is hard-coded into the core payout engine.

## Required payout record

Every payout has:

- unique Payout ID
- unique Request ID
- user ID
- wallet ID
- amount
- currency
- country/region
- payout method
- provider adapter
- provider reference when supplied
- status
- timestamps
- audit events

Statuses:
`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `REJECTED`, `CANCELLED`, `REVERSED`, `UNDER_REVIEW`.

## Balance isolation

`SANDBOX BALANCE != DERIV BALANCE != MT5 BALANCE != PAYOUT-ELIGIBLE BALANCE`

Sandbox capital is virtual and never becomes payout-eligible automatically. Provider balances remain provider-reported. Profit Units are Orenza-calculated. Payout eligibility is a separate server-controlled state.

## Security

Provider credentials never enter the browser, mobile bundle, local storage, ordinary database responses, API responses, screenshots, or normal admin screens. Provider secrets belong in backend-controlled secret configuration. Supabase documents Edge Function secrets as server-side environment variables and warns that secret keys must never be exposed to browsers. See: https://supabase.com/docs/guides/functions/secrets.

Financial operations are server-controlled, idempotent, audited, and disabled until the relevant provider adapter is configured, security checks pass, reconciliation is operational, and applicable compliance requirements are satisfied.

## Admin

Administrators see provider adapter status, configuration status, payout requests, transaction states, reconciliation results, and audit history—not raw credentials.
