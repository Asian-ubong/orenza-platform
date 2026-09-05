# ORENZA Mail architecture status

Status: application-side SMTP boundary added.

Not yet production-ready: the repository does not itself provide the public SMTP server, static IP, DNS records, TLS certificate, DKIM signing, or mailbox storage required for independent email delivery.

Production target:

`Next.js -> authenticated SMTP -> mail.orenzatech.com -> recipient`

Recipient requested for operational reports: `Supportdeveloperer@gmail.com`.
