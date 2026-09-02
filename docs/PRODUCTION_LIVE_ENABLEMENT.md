# Orenza production live enablement

Orenza keeps real-money movement and live-market execution disabled by default. Production execution must be enabled only after the required provider, account, security, reconciliation, compliance, and operational controls are in place.

## Live trading

- Deriv OAuth 2.0 with PKCE.
- Request only required scopes; `trade` is required for trading operations.
- Store provider tokens only on the server; never expose them to browser code.
- Use Deriv's authenticated OTP flow to obtain the account-specific WebSocket URL.
- Use the real WebSocket endpoint only for an explicitly authorized real account.
- Record order intent, provider response, external trade ID, status, and reconciliation state.
- Never let AI place a trade automatically; the user must explicitly confirm the trade ticket.

## Real payout

- Use the generic Orenza payout engine and provider-adapter model.
- Keep provider credentials server-side.
- Require KYC, 2FA, eligibility, duplicate/idempotency, risk, and reconciliation checks before provider submission.
- Keep sandbox capital separate from withdrawable profit and real user funds.
- Record Payout ID, Request ID, amount, currency, country/region, method, adapter, provider reference, status, and audit events.
- Provider completion must reconcile back into the Orenza ledger before a payout is treated as final.

## Current state

The production gate functions are deployed but fail closed while the runtime controls are disabled. They do not submit broker orders or payout transactions in the current configuration.

Required runtime controls before a separately authorized production launch:

- `real_trading_enabled`
- `real_withdrawals_enabled`
- `real_profit_payout_enabled`
- provider/account configuration and reconciliation readiness

This document is an implementation contract, not an authorization to move real funds.
