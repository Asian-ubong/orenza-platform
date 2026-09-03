# ORENZA Realtime Security Boundary

## Purpose

User and admin planes are separate authorization domains. They are never joined by shared browser state, shared client privileges, or direct client-to-client connections.

```text
USER WEB APP -> ORENZA REALTIME GATEWAY -> USER CHANNELS
ADMIN WEB APP -> ORENZA REALTIME GATEWAY -> ADMIN CHANNELS
                         |
                         +-> CORE SERVICES / SUPABASE / PROVIDER WORKERS
```

The WebSocket/realtime gateway is the only realtime transport boundary between the web clients and server-side state. It is not a trust boundary by itself: every connection and message is authenticated and authorized server-side.

## Channel rules

- `user:{userId}`: only that authenticated user.
- `admin`: only active `OWNER` or `ADMIN` sessions.
- `provider:{provider}:{connectionId}`: server worker only; never exposed as a browser-writable channel.
- `system`: server-originated events only.
- Client messages are commands, never authoritative state updates.
- Admin commands are rejected for user sessions.
- User commands cannot address another user's resources.
- Provider credentials, OAuth tokens, OTPs and payout secrets never cross the realtime boundary.

## Required connection controls

1. Authenticate the session before accepting subscriptions.
2. Resolve the current ORENZA role and private-access status server-side.
3. Bind every user channel to the authenticated user ID.
4. Bind every admin channel to an active OWNER/ADMIN role.
5. Reject unknown channels and unknown commands by default.
6. Enforce request IDs and idempotency for material commands.
7. Rate-limit connections and sensitive commands.
8. Heartbeat and expire stale sessions.
9. Revoke sessions immediately after security-sensitive revocation.
10. Write security/audit events for authorization failures and material actions.

## Financial boundary

Realtime messages may report authoritative snapshots/events, but they cannot manufacture balances. Sandbox, Deriv, MT5, Profit Units, Real Live Wallet and payout-eligible balances remain separate ledgers. Only server-side reconciliation may change authoritative financial state.

## Trading boundary

The realtime gateway cannot bypass live gates. A live order requires provider authorization, environment isolation, risk/security validation and explicit user confirmation. AI signals are advisory and cannot execute trades automatically.

## Payout boundary

The realtime gateway cannot create or authorize payout funds. Payout commands are accepted only by the server-side Payout Engine after eligibility, settlement, reconciliation, authorization, idempotency and provider checks pass.

## Deployment boundary

The persistent provider WebSocket worker is a separate long-running server-side runtime. Vercel remains the web/API deployment surface; it is not used as the durable provider WebSocket process.

## Production readiness gate

This boundary is necessary but does not itself make real-money trading or payout live. Those capabilities remain disabled until actual provider credentials, account authorization, persistent provider connectivity, reconciliation, approved payout adapters and operational approval are present and verified.
