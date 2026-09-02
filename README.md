# ORENZA BROKER

ORENZA BROKER is a private, sandbox-first trading and investment workspace with live provider market-data architecture, risk tracking, portfolio records, and controlled payout workflows.

## Current build scope

- ORENZA BROKER dashboard and private-access experience
- ORENZA brand system: forest green, cream, gold, green and controlled red accents
- Sandbox Money kept separate from provider accounts
- Live Deriv market discovery through the public `active_symbols` feed
- Real-world Deriv markets separated from Derived/Synthetic markets
- Real-time Deriv tick streaming for selected instruments
- Deriv authenticated integration foundation
- MT5 server-side adapter and demo-first bridge foundation
- Portfolio, risk, activity/ledger and payout foundations
- KYC and security foundation
- Installable PWA with service-worker update handling

## Market-data rule

ORENZA does not hardcode or invent market availability or prices. The Markets screen reads active instruments from Deriv and displays the provider-reported state. Deriv's API exposes active symbols, and ORENZA normalizes them for display.

## Security and release boundary

Provider/API credentials remain server-side. No secrets belong in the browser or Git history. REAL trading and real-money payout remain locked until the required provider credentials, permissions, compliance, and independent security verification are complete.

The application is being tested privately and is not being published to Google Play at this stage. The preferred phone/tablet installation path is the installable PWA so devices can receive new versions automatically.

## Documentation

See `docs/ARCHITECTURE.md`, `docs/MT5_INTEGRATION.md`, and the other files in `docs/` for the implementation boundaries and verification requirements.

## Development

Install dependencies and run the Next.js development server with the scripts in `package.json`. Production builds are validated through the Vercel deployment pipeline.
