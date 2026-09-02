# ORENZA MT5 Integration

## Status

MT5 is now part of the ORENZA provider architecture as a **demo-first, server-controlled adapter**.

This adds:

- `/mt5` provider workspace
- `/api/mt5/status` server-side status endpoint
- `lib/mt5/adapter.ts` normalized MT5 connection boundary
- explicit DEMO/REAL environment separation
- trading lock until bridge configuration and validation succeed

## Required bridge

ORENZA should connect to MT5 through an approved server-side bridge or broker integration. The browser must never receive an MT5 password or private bridge token.

Expected server environment variables:

```text
MT5_BRIDGE_URL=
MT5_BRIDGE_TOKEN=
MT5_ENVIRONMENT=DEMO
MT5_ACCOUNT_ID=
MT5_TRADING_ENABLED=false
```

Do not commit these values to GitHub.

## Demo test sequence

1. Configure a demo MT5 account and approved bridge.
2. Configure the bridge URL/token as server-side secrets.
3. Health-check the bridge and verify account identity.
4. Stream demo market ticks and account snapshots.
5. Normalize orders, positions and account events into ORENZA.
6. Reconcile MT5 state with the ORENZA ledger.
7. Run a complete demo order lifecycle test.
8. Only after the demo test passes, separately review REAL-mode authorization.

## Safety boundary

`SANDBOX != DERIV != MT5 != PAYOUT`

Sandbox capital is virtual and cannot be converted into real MT5 funds. REAL MT5 trading must remain explicitly locked until credentials, permissions, bridge connectivity, account identity, reconciliation and user confirmation are verified.
