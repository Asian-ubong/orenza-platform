# ORENZA Mail — SMTP2GO delivery

ORENZA application and operational-report emails are provider-neutral at the application boundary and currently delivered through **SMTP2GO SMTP**. The transport lives in `lib/reports/mailer.ts`, so the provider can be changed later without rewriting every email route.

## Architecture

```text
ORENZA app (Vercel/Node)
        |
        | authenticated SMTP / STARTTLS
        v
SMTP2GO
        |
        +--> verified sender domain
        +--> SPF / DKIM alignment
        +--> outbound delivery
        v
Recipients (users / report subscribers)
```

SMTP2GO provides outbound SMTP only. ORENZA does not use SMTP2GO as an incoming mailbox provider.

## Application environment

Set these production variables in Vercel/server configuration:

- `SMTP_HOST=mail.smtp2go.com`
- `SMTP_PORT=2525` (STARTTLS; 587 is also supported)
- `SMTP_USER` — SMTP2GO SMTP User username
- `SMTP_PASSWORD` — SMTP2GO SMTP User password; never commit it
- `SMTP_FROM_EMAIL` — a sender approved by SMTP2GO, e.g. `ORENZA <no-reply@orenzatech.com>`

SMTP2GO's documented SMTP host is `mail.smtp2go.com`; STARTTLS is supported on port 2525 and 587, while implicit TLS is supported on 465, 8465, and 443. Verify the sender domain in SMTP2GO before production sending.

## SMTP2GO setup

1. Create/sign in to the SMTP2GO account.
2. Go to **Sending → Verified Senders → Sender Domains**.
3. Add `orenzatech.com` and publish the DNS records SMTP2GO provides.
4. Wait until the sender domain is verified.
5. Go to **Sending → SMTP Users** and create a dedicated ORENZA SMTP user.
6. Store the SMTP username/password only in Vercel/server environment variables.
7. Set `SMTP_FROM_EMAIL` to a verified address at `orenzatech.com`.
8. Test OTP and operational-report delivery before enabling production email-dependent flows.

## Security

- SMTP credentials are server-only and must never be exposed to the browser.
- Do not commit SMTP passwords or API keys.
- OTPs are generated server-side with a cryptographically secure RNG.
- Operational reports must not contain passwords, secrets, OTP values, private keys, or full KYC documents.
- The existing Supabase Auth email OTP fallback remains available if ORENZA's SMTP transport is unavailable.

## Cost-conscious operation

SMTP2GO currently offers a free plan with up to 1,000 emails/month and 200/day. The application does not assume a paid plan; it simply reports delivery/configuration failures. If ORENZA outgrows the free allowance, the same SMTP transport can use a paid SMTP2GO plan without application code changes.

## Future provider migration

Because application routes call `sendOrenzaEmail()` rather than a provider SDK directly, ORENZA can later move to another SMTP service or a self-hosted ORENZA mail server by changing the transport configuration/implementation instead of rewriting OTP, KYC, and report routes.

## First report recipient

The requested report recipient is `Supportdeveloperer@gmail.com`. That address can subscribe through `/reports/subscribe` after the SMTP2GO sender domain, SMTP user, and subscription database are configured.
