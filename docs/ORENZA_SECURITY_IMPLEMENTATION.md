# ORENZA Security Implementation

This document defines the server-side security boundary for private ORENZA provider connections.

## Rules

- No public registration.
- Deriv authentication uses the authorized OAuth 2.0 Authorization Code flow with PKCE.
- ORENZA never collects a Deriv password.
- OAuth authorization codes are exchanged only by the backend and are never logged or persisted as plaintext.
- Provider access/refresh tokens are encrypted before durable storage.
- Encryption keys, OAuth state secrets, provider client secrets, database secrets, and payout-provider secrets stay outside the application repository and outside normal admin views.
- Security tables have RLS enabled and intentionally have no client-facing policies.
- Financial/provider requests use unique request identifiers and idempotency controls.
- Sandbox, Deriv, MT5, Real Live Wallet, Profit Units, and Payout remain separate balance/authorization domains.
- Real trading and real payout remain independently server-gated.

## Server-only configuration

Use the repository `.env.example` as the configuration contract. Production values must be supplied through the deployment/runtime secret manager (for example Vercel/Supabase server-side configuration), never committed to GitHub.

Required Deriv configuration:

- `DERIV_CLIENT_ID`
- `DERIV_APP_ID`
- `DERIV_REDIRECT_URI`
- `DERIV_OAUTH_SCOPES`
- `DERIV_CLIENT_SECRET` only if the registered OAuth client requires it

Required ORENZA security configuration:

- `ORENZA_APP_URL`
- `ORENZA_OAUTH_STATE_SECRET`
- `FIELD_ENCRYPTION_KEY` — 32 bytes, represented as 64 hex characters or base64/base64url

The service-side Supabase credential is also required by the Edge Function and must never be a public `NEXT_PUBLIC_*` variable.

## Deriv OAuth flow

1. An already authenticated ORENZA user requests `action=start`.
2. The backend generates a fresh PKCE verifier/challenge and cryptographically random state.
3. The verifier is encrypted and stored in `oauth_sessions`; only a state value is placed in an HttpOnly/Secure/SameSite cookie.
4. The user is redirected to Deriv's OAuth authorization endpoint.
5. Deriv authenticates the user and returns a single-use authorization code to the exact registered HTTPS redirect URI.
6. The backend validates the cookie state, HMAC state, session expiry, and one-time consumption before exchanging the code.
7. The backend exchanges the code plus the original PKCE verifier at Deriv's token endpoint.
8. The backend retrieves the authorized account list and checks the account reference against `orenza_private_access`.
9. Only an approved account is persisted as an ORENZA Deriv connection.
10. Access/refresh tokens are encrypted with AES-GCM before being written to the server-side broker connection record.
11. The browser receives only a redirect/result status and never receives the token.

Deriv's current documentation requires a registered OAuth client, an exact HTTPS redirect URI, fresh `state` and PKCE values, and server-side token exchange. Request only the scopes required by the enabled functionality. `trade` is required for trading operations; `payment` is required for Deriv wallet/payment-agent operations. See the official Deriv OAuth documentation before enabling additional scopes.

## Credential inventory

| Reference | Credential | Storage boundary |
|---|---|---|
| SEC-001 | `DERIV_APP_ID` | Server config |
| SEC-002 | `DERIV_CLIENT_ID` | Server config |
| SEC-003 | `DERIV_CLIENT_SECRET` | Secret vault/server config only, if required |
| SEC-004 | Deriv access token | Encrypted server-side broker connection |
| SEC-005 | Deriv refresh token, if issued | Encrypted server-side broker connection |
| SEC-006 | Supabase server credential | Server config/secret vault |
| SEC-007 | Field encryption key | Secret vault only |
| SEC-008 | OAuth state secret | Secret vault/server config |
| SEC-009 | Session/signing material | Secret vault/server config |
| SEC-010+ | Payout-provider secrets | Provider-specific server config only |

No credential inventory should contain a real secret value.

## Database security tables

The security migration adds:

- `secret_credentials` — secret references, status, versions, fingerprints and optional encrypted ciphertext; never plaintext secrets.
- `oauth_sessions` — one-time OAuth state hashes and encrypted PKCE verifiers.
- `device_sessions` — server-side session/device tracking metadata.
- `security_events` — security-relevant events without credentials or authorization codes.
- `api_request_logs` — request metadata only; never Authorization headers, cookies, request bodies containing secrets, or tokens.
- `credential_rotations` — rotation history.
- `system_incidents` — operational security incidents.

The security tables are server-only. Do not add broad authenticated-client SELECT policies to them.

## Admin visibility

Admins may see:

- Provider: DERIV / MT5 / payout adapter
- Status: ACTIVE / DISABLED / ERROR
- Credential: CONFIGURED / MISSING / EXPIRED
- Last check time
- Last successful synchronization
- Rotation version/date
- Incident state

Admins must not see raw API keys, OAuth tokens, client secrets, encryption keys, database passwords, cookies, authorization codes, or webhook signing secrets.

## Redaction requirements

Never write these values to logs, telemetry, audit metadata, screenshots, error messages, or API responses:

- `Authorization` header values
- access tokens
- refresh tokens
- client secrets
- database credentials
- encryption keys
- OAuth authorization codes
- PKCE verifiers
- session cookies
- payout provider secrets

Errors should expose stable error codes such as `DERIV_TOKEN_EXCHANGE_FAILED`, not upstream credential material.

## Real-money boundary

The security layer does not enable real-money operations.

```text
SANDBOX != DERIV != MT5 != REAL LIVE WALLET

REAL LIVE WALLET -> PAYOUT ENGINE -> APPROVED PROVIDER ADAPTER
```

Live trading and payout require independent server-side authorization gates, provider authorization, reconciliation, security checks, and applicable operational/compliance controls.
