# ORENZA Platform Architecture

## Phase 1: Derive-first

ORENZA is being built as a secure sandbox-capital and live Derive integration platform. Phase 1 does not enable MT5 or other trading integrations.

### Core flow

Sandbox Money → Derive live integration → Risk/position tracking → Verified profit ledger → Profit Payout Wallet

### Security

- Trading/provider credentials are server-side only.
- Secrets must never be committed to GitHub or exposed to browser bundles.
- Supabase Row Level Security protects user-owned records.
- Live trading, settlement, and profit values must originate from verified Derive events; the UI must not fabricate market results.

### Modules

- Dashboard
- Sandbox Money
- Derive
- Markets
- Portfolio / Positions
- Risk
- Investment Profit
- Profit Payout Wallet
- Transactions
- KYC & Security

### Deferred integrations

MT5 and other trading/payment integrations remain disabled until the required approval, credentials, permissions, and integration contracts are available.

## Build and deployment

The application is deployed through Vercel from the GitHub repository. Supabase provides the database/authentication foundation and server-side secret storage. Environment variables are configured outside source control.

## Live Derive requirements

Before enabling live provider operations, configure only the credentials and scopes approved for the ORENZA environment. Validate account identity, market-data permissions, order permissions, and settlement/payout permissions separately. Never place provider secrets in client code.
