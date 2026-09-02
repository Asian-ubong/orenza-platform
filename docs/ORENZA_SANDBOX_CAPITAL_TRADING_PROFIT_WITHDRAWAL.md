# Orenza — Sandbox Capital Trading & Profit Withdrawal System

## Purpose

Orenza provides a sandbox-capital trading workflow for connected Deriv and MT5 environments. Sandbox capital is platform-provided virtual trading capital and is never itself a withdrawable balance.

Actual provider balances and user-owned funds remain separate from the Orenza sandbox ledger.

## Wallet model

- **Sandbox Capital** — allocated virtual trading capital; not withdrawable.
- **In Active Trades** — sandbox capital reserved against open trades.
- **Available Sandbox** — unreserved sandbox capital.
- **Realized Trading Profit** — verified positive P/L from completed eligible trades.
- **Withdrawable Profit** — realized profit that has passed eligibility checks.
- **Payout Reserved Profit** — withdrawable profit reserved for a pending payout.
- **Withdrawn Profit** — profit recorded only after a payout reaches `COMPLETED`.
- **Real/User Funds** — separate from all sandbox balances.

Example display:

```text
Sandbox Capital       $200.00
In Active Trades       $50.00
Available Sandbox     $150.00
Trading Profit         +$30.00
Withdrawable Profit    $30.00
```

## Treasury rules

1. Sandbox capital has configurable allocation limits.
2. Minimum and maximum allocation amounts are enforced.
3. Daily allocation limits are enforced.
4. Sandbox capital cannot be withdrawn.
5. Every trade is attributed to `SANDBOX_CAPITAL` when funded by the sandbox treasury.
6. On settlement, returned capital is separated from realized P/L.
7. Positive realized P/L is tracked separately from losses.
8. Only provider-reconciled, rule-compliant profit can become withdrawable.
9. Failed, rejected, cancelled, or reversed payouts return reserved withdrawable profit to the withdrawable balance.
10. `WITHDRAWN` accounting is only increased after a payout is confirmed `COMPLETED`.

## Eligibility gates

A profit settlement must pass:

- provider reconciliation;
- minimum-profit rule;
- verified KYC;
- enabled two-factor authentication;
- no unresolved high/critical risk event;
- platform eligibility rules.

Eligibility does not imply that a real payout provider is enabled. Real-money payout remains controlled by the platform payout configuration and provider/compliance readiness.

## Provider architecture

```text
ORENZA
  |
  +-- Sandbox Treasury
  |     +-- Allocation
  |     +-- Available Capital
  |     +-- Reserved Capital
  |     +-- Settlement
  |
  +-- Deriv Connector
  |
  +-- MT5 Connector
  |
  +-- Reconciliation
  |
  +-- Profit Eligibility
  |
  +-- Payout Engine
        +-- Provider Adapter
        +-- Local payout method
```

Deriv authentication must use the approved OAuth flow with PKCE and backend token exchange. Provider secrets and tokens must never be exposed to the browser.

## Server-side operations

The Supabase backend now contains protected operations for:

- `orenza_sandbox_allocate`
- `orenza_sandbox_settle_trade`
- `orenza_check_profit_eligibility`
- `orenza_request_profit_payout`
- `orenza_finalize_profit_payout`
- `orenza_sandbox_append_audit`

These operations are not callable by anonymous or normal authenticated database clients; execution is reserved for the controlled backend/service layer.

## Audit trail

`orenza_sandbox_audit_events` records allocation, settlement, eligibility, and payout events with a chained SHA-256 event hash. Updates and deletes are blocked by database triggers.

## Safety boundary

```text
SANDBOX CAPITAL != PROVIDER BALANCE
SANDBOX CAPITAL != REAL USER FUNDS
SANDBOX CAPITAL != WITHDRAWABLE PROFIT
WITHDRAWABLE PROFIT != COMPLETED PAYOUT
```

The product must never promise that sandbox trading automatically produces or guarantees real-world profit. Provider results, contractual terms, legal/regulatory requirements, reconciliation, eligibility, and payout-provider availability determine whether any profit can actually be disbursed.

## Current implementation status

- Sandbox treasury configuration: implemented.
- Separate sandbox profit balances: implemented.
- Trade settlement record: implemented.
- Profit eligibility checks: implemented.
- Payout reservation/finalization accounting: implemented.
- Immutable sandbox audit chain: implemented.
- Deriv/MT5 live provider synchronization: separate integration layer; not claimed complete here.
- Real-money payout provider: not connected; payout remains controlled and disabled until provider/compliance setup is completed.
