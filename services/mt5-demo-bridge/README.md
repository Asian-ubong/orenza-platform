# ORENZA MT5 Demo Bridge

Separate service boundary for a demo/test MT5 terminal. ORENZA web/API must never contain MT5 terminal credentials.

## Required service configuration

- `MT5_BRIDGE_SERVICE_TOKEN`
- `MT5_ACCOUNT_ID`
- `MT5_SERVER`
- `MT5_LOGIN`
- `MT5_PASSWORD`
- `MT5_TERMINAL_PATH` (when required by the host)
- `MT5_DEMO_ONLY=true`

## Verification contract

`GET /health` — bridge health.

`GET /v1/accounts/:id` — normalized account information.

`GET /v1/accounts/:id/positions` — normalized open positions.

`GET /v1/quotes/:symbol` — normalized quote.

`GET /v1/markets` — available symbols.

The bridge must reject production/live accounts when `MT5_DEMO_ONLY=true`. It exposes read-only account/position operations for the ORENZA demo E2E test; order submission is deliberately absent.

The official MetaTrader5 Python package connects to the installed MT5 terminal and exposes `account_info()` and position APIs, so this service belongs on a host running the terminal rather than inside a Vercel function.
