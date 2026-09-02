# Orenza Security — Credentials & OAuth

## Non-negotiable rules

- No provider passwords in Orenza.
- No provider access tokens, client secrets, database passwords, encryption keys, or payment secrets in browser code, screenshots, logs, API responses, GitHub, or ordinary admin screens.
- Deriv OAuth 2.0 Authorization Code + PKCE is the preferred web connection flow.
- OAuth callback processing is server-side.
- Private allowlist is checked after Deriv authentication and before sandbox access.
- Sandbox capital is never represented as provider cash.
- Request only the Deriv scopes required by the enabled feature.

## Server-side secret configuration

Use the Supabase Edge Function secret store for runtime secrets. Do not commit real values.

```text
DERIV_CLIENT_ID=<registered Deriv OAuth client id>
DERIV_REDIRECT_URI=https://<approved-https-host>/functions/v1/orenza-deriv-oauth?action=callback
DERIV_OAUTH_SCOPES=trade
ORENZA_OAUTH_STATE_SECRET=<random high-entropy secret>
ORENZA_APP_URL=https://<approved-https-host>
ORENZA_TOKEN_ENCRYPTION_KEY=<32-byte base64url key>
```

If wallet operations are later enabled, request the `payment` scope only then. Deriv documents wallet endpoints as requiring that scope.

## Credential registry

`orenza_secret_credentials` is metadata-only. It stores names, status, fingerprints and vault references, never raw secret material.

`orenza_oauth_sessions` stores short-lived OAuth transaction metadata. It deliberately does not store authorization codes or provider tokens.

## OAuth flow

1. Authenticated Orenza user requests Deriv connection.
2. Backend creates fresh PKCE verifier/challenge and state.
3. Browser is redirected to Deriv.
4. Deriv authenticates the user and returns an authorization code.
5. Backend validates state and exchanges the code using the original verifier.
6. Backend obtains provider account references and checks Orenza's private allowlist.
7. Only an allowed account can proceed to Orenza sandbox access.
8. Provider tokens remain server-side and are never returned to the client.

## Incident handling

Credential exposure, unexpected OAuth errors, allowlist bypass attempts, duplicate financial requests, or provider authorization failures must create an auditable security event/incident and fail closed for sensitive operations.

## Current status

The database security schema and the `orenza-deriv-oauth` Edge Function foundation are deployed with placeholder configuration. No real Deriv credential has been inserted into source control or the database.