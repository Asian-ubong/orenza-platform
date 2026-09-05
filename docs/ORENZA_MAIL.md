# ORENZA Mail — self-hosted SMTP delivery

ORENZA does not require Resend. Application emails use the ORENZA SMTP transport in `lib/reports/mailer.ts`.

## Architecture

```text
ORENZA app (Vercel/Node)
        |
        | authenticated SMTP
        v
ORENZA Mail Server (self-hosted VPS)
        |
        +--> Postfix SMTP
        +--> Dovecot mailbox/authentication
        +--> TLS certificates
        +--> SPF / DKIM / DMARC
        +--> DNS MX
        v
Supportdeveloperer@gmail.com / other subscribed recipients
```

The SMTP server is the mail infrastructure. Vercel runs the application/API but should not be expected to act as a public SMTP daemon.

## Application environment

Set these production variables in the ORENZA deployment:

- `SMTP_HOST` — hostname of the ORENZA SMTP server, e.g. `mail.orenzatech.com`
- `SMTP_PORT` — normally `587` for STARTTLS or `465` for implicit TLS
- `SMTP_USER` — dedicated ORENZA SMTP account
- `SMTP_PASSWORD` — SMTP credential; never commit it
- `SMTP_FROM_EMAIL` — a verified ORENZA mailbox, e.g. `ORENZA Reports <reports@orenzatech.com>`

No `RESEND_API_KEY` is required by the ORENZA mail transport.

## Self-hosted server requirements

Use a dedicated Linux VPS with a static public IP. Install and harden a mail stack such as Postfix + Dovecot (or a self-hosted mail-suite that exposes authenticated SMTP). Configure:

1. DNS `A/AAAA` for `mail.orenzatech.com`.
2. DNS `MX` for `orenzatech.com` pointing to the mail host.
3. SPF authorizing the server IP.
4. DKIM signing and its DNS public key.
5. DMARC policy and reporting address.
6. PTR/rDNS for the VPS IP pointing to the mail hostname.
7. TLS certificate for the mail hostname.
8. Authenticated SMTP submission on port 587; do not expose unauthenticated relay.
9. Firewall rules allowing SMTP submission and required mail-server traffic.
10. Rate limits, abuse controls, queue monitoring, and backups.

## Important limitation

The code can be built now, but a truly independent mail system cannot be made production-deliverable from the GitHub repository alone. It requires control of the `orenzatech.com` DNS zone and a public server/IP. Until those are configured, ORENZA should report that SMTP is not configured rather than silently pretending that emails were delivered.

## First mailbox

The requested report recipient is `Supportdeveloperer@gmail.com`. That address can subscribe through `/reports/subscribe` after the SMTP transport and subscription database are configured.
