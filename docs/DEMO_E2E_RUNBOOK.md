# ORENZA Demo E2E Runbook

## Preconditions

- Deriv OAuth application registered with the exact HTTPS redirect URI.
- Deriv demo account available.
- Server-side Deriv OAuth secrets configured outside source control.
- Supabase service credentials configured server-side.
- MT5 demo terminal/bridge host configured with a demo account.
- `ENABLE_REAL_TRADING=false`
- `ENABLE_REAL_PAYMENTS=false`
- `ENABLE_REAL_WITHDRAWALS=false`
- `ENABLE_REAL_TRANSFERS=false`
- `ENABLE_PROFIT_PAYOUT=false`

## Test sequence

### 1. Deriv OAuth

Open the ORENZA provider connection flow and complete Deriv OAuth. Verify the callback rejects a mismatched `state`, exchanges the authorization code server-side, and creates a DEMO broker connection.

### 2. Authenticated WebSocket

Start the Deriv demo worker for that connection. Verify it obtains a fresh OTP and connects to the returned demo WebSocket URL. Verify no OTP or access token is logged.

### 3. Supabase synchronization

Verify:

- account snapshot event is inserted/updated for balance/equity metadata;
- portfolio events create/update normalized broker positions;
- transaction, profit-table and statement messages are retained as broker events;
- `last_seen_at` advances while the stream is healthy;
- reconnect creates a new session/event without duplicating historical records.

### 4. Reconciliation

Run reconciliation and verify a `MATCHED` result when the normalized provider snapshot agrees with the ORENZA ledger. Introduce a controlled test delta and verify it becomes `MISMATCH` without mutating immutable ledger history.

### 5. MT5 demo bridge

Verify `/health`, account snapshot, positions and a quote using the demo terminal. Confirm `MT5_DEMO_ONLY=true` rejects any non-demo server/account configuration.

### 6. End-to-end result

The demo test passes only when all of these are true:

- Deriv OAuth: PASS
- Deriv authenticated WebSocket: PASS
- Supabase broker events/snapshots: PASS
- Deriv reconciliation: PASS
- MT5 bridge health: PASS
- MT5 demo account snapshot: PASS
- MT5 positions: PASS
- Real trading: DISABLED
- Real payout: DISABLED

Do not label the integration LIVE until the demo sequence passes and real-account authorization is separately approved.
