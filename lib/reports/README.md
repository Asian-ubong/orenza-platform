# ORENZA reports mailer

`mailer.ts` is the only application boundary for operational email delivery. Keep report generation independent from the SMTP provider so the reporting system remains testable.

Production delivery requires a reachable authenticated SMTP server. The intended provider is ORENZA's self-hosted mail server, not Resend.
