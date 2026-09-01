# ORENZA Sandbox-First Broker Architecture

## Version 1 operating mode

ORENZA Broker Version 1 is sandbox-only.

- `sandboxMode = true`
- `realPayments = false`
- `realWithdrawals = false`
- `realTransfers = false`
- `realTrading = false`
- `realProfitPayout = false`

No production payment credentials are required or accepted by the application.

## Sandbox capital

Sandbox capital is internal test capital and is not a bank deposit, customer cash, or automatically withdrawable money.

Backend policy:

- minimum allocation: $50
- maximum allocation per request: $200
- daily allocation limit: $200 per user
- allocation and order limits are enforced in Postgres, not only in the browser

## State model

Allocation:

`REQUESTED -> PENDING_REVIEW -> APPROVED -> ALLOCATED -> RESERVED -> RELEASED / SETTLED`

Order:

`PENDING -> EXECUTED -> SETTLED` or `CANCELLED / REJECTED`

## Financial integrity

Sandbox balance mutations are performed through authenticated, atomic database functions. The browser never directly updates balances.

Sandbox ledger entries are append-only from the user-facing API. Every allocation and order reservation receives a unique reference and idempotency key.

## Future broker adapters

The service boundary is intended to normalize:

- Deriv demo/test integration
- MT5 demo/test integration
- future broker adapters

The frontend must call ORENZA services, not privileged broker credentials.

## Future real-money controls

Real payments, withdrawals, transfers, trading, and profit payouts require independent legal, compliance, licensing, banking/broker, security, reconciliation, and operational approval before any feature flag can be changed.

The AI layer is advisory only and cannot move money, alter immutable ledger history, bypass KYC/2FA, or execute privileged production actions.
