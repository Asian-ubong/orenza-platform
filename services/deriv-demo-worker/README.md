# ORENZA Deriv Demo Worker

Server-side demo verification worker for the Deriv OAuth -> authenticated WebSocket -> Supabase pipeline.

## Flow

1. User completes Deriv OAuth 2.0 + PKCE.
2. Backend stores the encrypted access token and account/environment metadata.
3. Worker requests a one-use OTP for the selected DEMO account.
4. Worker opens the returned authenticated WebSocket immediately.
5. Worker subscribes to balance, portfolio, transaction, profit-table and statement streams.
6. Events are normalized and persisted to `broker_account_snapshots`, `broker_positions`, and `broker_events`.
7. Reconciliation compares the provider snapshot with the ORENZA ledger.

## Safety

This worker is DEMO-only. It rejects REAL account environments and never submits trading orders or payout requests.

Required environment variables:

- `DERIV_APP_ID`
- `DERIV_OAUTH_CLIENT_ID`
- `DERIV_OAUTH_CLIENT_SECRET`
- `DERIV_OAUTH_REDIRECT_URI`
- `DERIV_TOKEN_ENCRYPTION_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

No credentials belong in browser code or source control.
