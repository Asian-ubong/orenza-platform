# ORENZA PLATFORM — IMPLEMENTATION SCHEMA

## Platform boundary

Orenza is a private trading, investment sandbox, wallet, AI-analysis and payout platform. Orenza is the secure orchestration/control layer; Deriv and MT5 remain external authorized account/trading connections.

### Non-negotiable boundaries

- `PUBLIC_SIGNUP = false`
- `PRIVATE_ALLOWLIST = true`
- `ADMIN_APPROVAL = required`
- `DEVICE_SESSION_TRACKING = true`
- `AUDIT_LOGGING = true`
- Provider passwords are never collected by Orenza.
- Provider secrets never reach browser/mobile code, normal API responses, logs, screenshots or normal admin screens.
- Sandbox capital is virtual and is never automatically payout-eligible.
- `SANDBOX != DERIV != MT5 != REAL_CASH != PAYOUT_BALANCE`
- AI may recommend `BUY`, `SELL` or `WAIT`, but cannot silently trade or guarantee profit.
- All sensitive operations are server-controlled.
- Real-money trading, transfers, withdrawals and payouts remain disabled until provider setup, security, reconciliation and applicable compliance requirements are satisfied.

## Core architecture

```text
USER INTERFACE
      |
      v
ORENZA SECURE BACKEND
      |
      +-------------------+
      |                   |
      v                   v
SANDBOX ENGINE       EXTERNAL CONNECTORS
      |                   |
      |            +------+------+
      |            |             |
      v            v             v
VIRTUAL WALLET   DERIV          MT5
      |            |             |
      +------------+-------------+
                   |
                   v
            TRADE DATA / RESULTS
                   |
                   v
              ORENZA LEDGER
                   |
          +--------+--------+
          |                 |
          v                 v
     PROFIT UNITS      PAYOUT ENGINE
```

## Private Access

Flow:

`Orenza → authorized provider login → provider authentication → backend callback → authorization validation → private allowlist → secure session → dashboard`

No public Orenza registration is required for the private sandbox.

## Sandbox Wallet

Default allocation: `NGN 100,000`.

Required concepts:

- wallet ID
- user ID
- initial allocation
- available balance
- reserved balance
- invested balance
- sandbox P/L
- status
- timestamps

Sandbox money is virtual capital only. It must never be represented as provider-owned money or automatically converted into a real payout balance.

## Deriv Connector

The connector is responsible for authorized market/account/trading data and backend-only requests.

Use Deriv's authorized OAuth 2.0 Authorization Code + PKCE flow. Keep client credentials and provider tokens server-side. Request only the scopes required for the enabled functionality.

Provider balance/account data must remain distinct from sandbox balances.

## MT5 Connector

MT5 is a separate authorized connection. Keep its account, positions, orders, deals and balances isolated from Deriv and Orenza sandbox records.

`DERIV_ACCOUNT != MT5_ACCOUNT`

`DERIV_BALANCE != MT5_BALANCE`

`MT5_BALANCE != SANDBOX_BALANCE`

## AI Premium

Inputs:

- market data
- trend
- momentum
- volatility
- market structure
- technical conditions
- risk conditions

Outputs:

- `BUY`
- `SELL`
- `WAIT`
- confidence category
- risk information
- rationale
- alternative scenario

AI restrictions:

- No guaranteed profit claims.
- No 100% win claims.
- No risk-free claims.
- No silent automatic trading.
- User confirmation is mandatory before any trade request.

Flow:

`Market Data → AI Analysis → Direction → Risk → User Review → User Confirmation → Backend Validation → Authorized Request`

## Profit Unit Engine

Profit Units are an Orenza-calculated accounting unit, not automatically real cash.

The calculation formula must be versioned and configurable server-side. Current foundation rule: positive eligible trading results create gross profit units; losses remain separately recorded rather than silently erasing historical gross profit.

Required concepts:

- profit unit ID
- user ID
- source trade
- source provider
- gross result
- loss amount
- approved profit
- unit quantity
- unit value
- calculation version
- payout eligibility

`PROFIT_UNITS != AUTOMATIC_PAYOUT`

## Payout Engine

PayPal is not a platform concept. Payouts use a provider-adapter architecture.

```text
Eligible Balance
      ↓
Payout Request
      ↓
Security Validation
      ↓
Duplicate / Idempotency Check
      ↓
Payout ID + Request ID
      ↓
Local Provider Adapter
      ↓
Transaction Processing
      ↓
Provider Response
      ↓
Orenza Ledger
      ↓
User/Admin Status
```

Supported adapter categories may include local bank transfer, local payment providers, mobile money where supported, card/bank payout where supported, and other approved local methods. No single provider is hard-coded into the platform architecture.

Payout statuses:

`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `REJECTED`, `CANCELLED`, `REVERSED`, `UNDER_REVIEW`.

Every payout requires:

- unique payout ID
- unique request ID
- user ID
- wallet ID
- amount
- currency
- country/region
- payout method
- provider reference
- status
- timestamps
- audit trail

## Wallet Display

The UI may group these under Orenza Wallet, but each category must remain explicitly labelled:

1. Sandbox Wallet — virtual capital.
2. Deriv Account — provider-reported data.
3. MT5 Account — provider-reported data.
4. Profit Units — Orenza calculation.
5. Payout Eligibility — genuinely eligible balance only.

## Security

Secrets belong in secure backend configuration / secret management, not application data exposed to users.

Never expose secrets in:

- frontend source
- mobile bundles
- browser storage
- public repositories
- normal logs
- API responses
- screenshots
- normal admin screens

Security controls:

- encrypted/managed secrets
- credential references
- rotation/revocation
- short-lived sessions
- secure cookies/tokens
- device tracking
- session expiry
- sensitive-action confirmation
- RBAC
- audit logging
- request IDs
- idempotency
- incident alerts
- health monitoring

## Admin

Admin modules:

- private users and allowlist
- sandbox allocations/transactions
- trading records
- Deriv connection status
- MT5 connection status
- AI signals/performance
- Profit Unit rules
- wallet ledger
- payout requests/local transactions
- security events
- incidents/system health
- announcements/events/videos/short videos/content distribution

Admin views credential status only, for example `CONFIGURED`, `MISSING`, `ROTATING`, `REVOKED`; never raw secret material.

## Identifier convention

Use readable external IDs with cryptographically random suffixes:

`USR-XXXXXXXX`, `ACC-XXXXXXXX`, `SES-XXXXXXXX`, `DEV-XXXXXXXX`, `REQ-XXXXXXXX`, `TRD-XXXXXXXX`, `ORD-XXXXXXXX`, `POS-XXXXXXXX`, `SET-XXXXXXXX`, `INV-XXXXXXXX`, `PRF-XXXXXXXX`, `UNT-XXXXXXXX`, `PAY-XXXXXXXX`, `LED-XXXXXXXX`, `AUD-XXXXXXXX`, `INC-XXXXXXXX`.

Internal database UUIDs remain the primary keys where appropriate.

## Implementation note

The existing Orenza Supabase foundation already contains the major Orenza-specific primitives for sandbox wallets/orders/ledger, Deriv/MT5 broker connections and normalized trading accounts/results, AI signals, Profit Units, private access/security, and generic payout requests/provider adapters. This document is the canonical platform boundary for wiring those modules together.

Provider authentication should follow the current Deriv OAuth 2.0 Authorization Code + PKCE model. Backend secrets must use server-side secret management; Supabase documents that secret keys bypass RLS and must never be exposed in browsers, while RLS should protect exposed application tables.
