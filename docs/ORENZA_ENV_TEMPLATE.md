# Orenza environment template

This file intentionally contains placeholders only.

```dotenv
# Deriv OAuth
DERIV_CLIENT_ID=<from registered Deriv OAuth application>
DERIV_REDIRECT_URI=<exact HTTPS callback registered with Deriv>
DERIV_OAUTH_SCOPES=trade

# Orenza OAuth/session protection
ORENZA_OAUTH_STATE_SECRET=<generate a high-entropy random secret>
ORENZA_TOKEN_ENCRYPTION_KEY=<generate a 32-byte base64url key>
ORENZA_APP_URL=<approved Orenza HTTPS origin>

# Payment provider — disabled until explicitly approved
PAYPAY_API_KEY=<placeholder>
PAYPAY_API_SECRET=<placeholder>
PAYPAY_WEBHOOK_SIGNING_SECRET=<placeholder>

# Other platform secrets — server only
SESSION_SIGNING_KEY=<placeholder>
WEBHOOK_SIGNING_SECRET=<placeholder>
```

Never commit the populated version. Configure production values using the hosting/provider secret manager. Supabase Edge Functions expose configured secrets to the backend runtime and the secrets must never be shipped to a browser.
