# ORENZA Platform

Secure Derive-first trading platform foundation with sandbox capital, live provider integration architecture, risk tracking, investment-profit ledgering, and payout-wallet workflows.

## Phase 1 scope

- ORENZA dashboard foundation
- Sandbox Money
- Derive live integration foundation
- Markets / positions / risk foundation
- Investment Profit ledger
- Profit Payout Wallet foundation
- KYC and security foundation

MT5 and other trading integrations remain deferred until the required approvals, credentials, permissions, and integration contracts are available.

## Security

Provider/API credentials are server-side only. Do not commit secrets to GitHub or expose them to the browser. Use Supabase/Vercel server-side environment or secret storage. Live balances, market data, execution, settlement, and profit must be sourced from verified provider events rather than simulated values.

## Documentation

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the Phase 1 architecture and live Derive requirements.

## Development

Install dependencies and run the Next.js development server with the scripts in `package.json`. Production builds are validated through the Vercel deployment pipeline.
