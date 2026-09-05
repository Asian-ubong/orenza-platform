# Self-hosted ORENZA Mail Server

This directory intentionally keeps the mail-server deployment separate from the Next.js application. The application connects to it over authenticated SMTP.

Recommended production stack on a dedicated Ubuntu/Debian VPS:

- Postfix — SMTP server/submission
- Dovecot — mailbox/authentication
- OpenDKIM — DKIM signing
- Certbot — TLS certificates
- Fail2ban + firewall — abuse protection

Do not run an unauthenticated open relay. Do not put SMTP passwords in GitHub files, `.env.example`, logs, or client bundles.

The server must have a static public IP and matching reverse DNS. DNS for `orenzatech.com` must include MX/SPF/DKIM/DMARC records.

After the server is configured, point the application at it with `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM_EMAIL`.
