# ORENZA Operational Email Reports

## Purpose

The ORENZA report portal provides one inbox for operational visibility across the repository CI/CD pipeline and Supabase health checks.

Portal: `/reports/subscribe`

The subscriber must confirm the email before delivery starts.

## What is reported

- GitHub Actions workflow completion for the ORENZA CI, Vercel deployment, and Android release pipelines.
- Successful, failed, cancelled, and other completed workflow conclusions.
- Scheduled Supabase operational health checks every six hours, plus manual dispatch.
- Release/build URLs and commit/branch context where available.

Reports are operational summaries, not a replacement for opening the underlying failure log. A failure email means the owner should inspect the linked workflow/run and fix the underlying issue.

## Required configuration

Server/Vercel:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `ORENZA_REPORT_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL` (recommended for confirmation redirects)

GitHub Actions secret:

- `ORENZA_REPORT_WEBHOOK_SECRET`

The GitHub secret must exactly match the server-side webhook secret. Never commit either value.

## Database migration

Apply `supabase/migrations/20260905100000_orenza_report_subscriptions.sql` before using the portal in production. The subscription table has RLS enabled and has no public read/write policy; server-side service-key access is required.

## Security

- Email ownership is confirmed by a one-time token.
- Webhook calls are authenticated with an HMAC-SHA256 signature and a five-minute timestamp window.
- The dispatcher only sends to enabled, verified subscribers.
- Secrets, OTP values, authentication tokens, private keys, passwords, and full KYC documents must not be placed in report payloads.
- The report endpoint is not an authorization mechanism for financial operations.

## Current limitation

Email delivery cannot be truthfully marked active until a real Resend account/domain configuration is present in server environment variables. The repository contains the complete delivery boundary, but credentials are intentionally not invented or committed.
