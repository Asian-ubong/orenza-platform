# Orenza Sandbox + Deriv + MT5 Master Flow

## Platform boundary

Orenza is the user-facing orchestration and recordkeeping platform. It is not the broker. Provider execution and provider balances remain authoritative for connected Deriv and MT5 accounts.

The platform maintains four explicitly separate value domains:

- Sandbox value: virtual Orenza allocation only.
- Provider account value: balance/equity/results reported by Deriv or MT5.
- Portfolio view: normalized view of connected provider activity.
- Profit Units: Orenza-calculated accounting units; not automatically cash or withdrawable funds.

## User flow

`Login -> Orenza Dashboard -> Sandbox / Connect Deriv / Connect MT5`

A user can have one Orenza sandbox account plus separate Deriv and MT5 connections. Provider credentials/tokens are server-side only.

## Sandbox Home

Default sandbox allocation: **NGN 100,000 virtual capital**.

The UI must show:

- Total Sandbox Allocation
- Available to Trade
- Currently Reserved/In Trades
- Sandbox P/L
- Profit Units
- Invest/Trade
- Portfolio

Sandbox funds never become real cash merely because a trade generates a positive result.

## Provider connections

### Deriv

Orenza uses the authorized Deriv connection for account data, market data, open positions/contracts, trade status and settlement results. The current implementation uses OAuth/PKCE and server-side token storage. Deriv's current API supports OAuth 2.0, authenticated WebSockets, balance, portfolio, profit-table, statement and transaction streams. See `https://developers.deriv.com/docs/intro/oauth/` and `https://developers.deriv.com/docs/intro/api-overview/`.

Market data is normalized before it reaches the Orenza market screen.

### MT5

MT5 is a separate provider connection. Account information, orders, positions and deals are normalized into Orenza records. The MT5 bridge must remain a provider adapter; Orenza does not become the trading venue. The official MQL5 Python integration exposes account information, orders, positions, history and deal APIs: `https://www.mql5.com/en/docs/python_metatrader5`.

## Normalized trading records

`orenza_trading_accounts` stores provider account identity and synchronized account state.

`orenza_trading_instruments` stores normalized provider instruments.

`orenza_trading_results` stores immutable normalized result events with provider, environment, external trade ID, symbol, realized P/L and occurrence time.

Provider-specific tables such as `broker_account_snapshots`, `broker_positions`, and `broker_events` remain the source synchronization layer.

## Profit Unit Engine

The first locked implementation uses:

- Unit rate: NGN 1 = 1 Profit Unit by default.
- Positive realized results create gross Profit Units.
- Losses are recorded separately as loss units.
- Losses do **not** silently rewrite or erase the gross-profit history.
- Profit Units are not withdrawable by default.
- `withdrawable_units` remains zero while payout is disabled.
- Every event records the calculation version for auditability.

This implements the example where a positive NGN 1,500 result and a separate NGN 500 sandbox loss remain visible as separate source events. A future business-rule change can introduce netting/offsetting as a versioned calculation rule without rewriting history.

## Balance separation

`Sandbox Value != Provider Balance != Portfolio Value != Profit Units != Withdrawable Balance`.

No calculation may invent a provider cash balance. Provider values must be sourced from provider events/snapshots. Sandbox values are Orenza virtual state. Profit Units are Orenza accounting units.

## Database model

User
- sandbox wallet/allocation/orders/ledger
- Deriv connection/account/markets/trades/results
- MT5 connection/account/orders/positions/deals/results
- profit account/events/calculations
- normalized ledger and audit events

The new Orenza-specific tables are:

- `orenza_trading_accounts`
- `orenza_trading_instruments`
- `orenza_trading_results`
- `orenza_profit_accounts`
- `orenza_profit_events`
- `orenza_balance_snapshots`

Existing provider synchronization tables remain in place.

## Security and operating rules

1. No frontend token exchange.
2. Deriv OAuth state and PKCE verifier are server-side/session-bound.
3. Provider tokens are encrypted at rest and never returned to the browser.
4. Provider balances are read-only records unless an explicitly authorized provider operation is enabled.
5. Sandbox operations are isolated from provider cash.
6. Real payments, withdrawals, transfers, real trading and profit payout remain disabled until separately approved/configured.
7. RLS limits user reads to their own financial records.
8. Reconciliation compares provider snapshots with Orenza records and records mismatches instead of silently correcting them.

## End-to-end target

`Orenza -> Sandbox -> Deriv/MT5 Connection -> Provider Market/Account Data -> Normalizer -> Trading Results -> Profit Unit Engine -> Ledger -> Dashboard`

Vercel is only the hosting/deployment layer. The GitHub repository and Supabase project remain usable independently of Vercel.