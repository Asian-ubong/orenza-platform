# ORENZA Platform Architecture

## Current audited baseline — 2026-09-05

This document records the implementation actually present in `main` before the master product specification is applied. The repository remains the source of truth; missing integrations are not represented as complete.

## Runtime architecture

- **Web:** Next.js App Router + React + TypeScript.
- **Shared UI/application shell:** `app/platform.tsx`, global styles in `app/globals.css`, route pages under `app/`.
- **Backend/API:** Next.js Route Handlers under `app/api/**`.
- **Database/auth:** Supabase client/server foundations with SQL migrations under `supabase/migrations`.
- **Mobile:** Capacitor 7 Android packaging; Android project is generated in CI with `npx cap add android` and synchronized with `npx cap sync android`.
- **PWA:** manifest, service worker, and install/update assets under `public/`.
- **Deployment:** Vercel verification workflow plus GitHub Actions CI.

## Existing product surfaces

The audited repository contains routes/surfaces for private access, login, registration/verification, home/dashboard, sandbox, markets, market detail, AI Premium, trading and trade confirmation, portfolio, wallet, payout, activity, announcements, events, videos, settings, KYC, MT5/terminal, and a distinct admin application.

The main application shell already separates sandbox/provider records and exposes navigation for the core financial workspace. The trading ticket explicitly keeps the currently executable demo path in SANDBOX and records virtual activity locally rather than submitting a real-money order.

## Provider/integration boundaries

### Deriv

The repository contains provider API surfaces and market/connection architecture for Deriv. README and user-flow documentation specify provider-sourced market data and server-side credentials. Live execution remains controlled by server-side runtime flags and provider authorization.

### MT5

The repository contains `lib/mt5`, an `/mt5` UI, and `/api/mt5/status`. The `.env.example` exposes server-only bridge configuration. The audited production posture is **not connected** until a real MT5 bridge/account is configured.

### Paystack / payout

The repository contains Paystack test integration routes, payout routes, provider abstractions, and database migrations. Real-money payout remains disabled/gated.

### Email / OTP

The repository contains email OTP send/verify API routes and an `auth_email_otp_challenges` database flow. Email delivery is provider-backed through Resend when configured, with a Supabase Auth fallback. The current login UI explicitly keeps email OTP disabled for its test flow; therefore the full login→OTP UX is not yet the canonical active login journey.

## AI architecture

The repository contains `lib/ai-premium/signal-engine.ts` and AI Premium product documentation. The current UI is an advisory market-analysis surface and does not expose autonomous trading. No Agents SDK dependency is present in `package.json`; therefore the current baseline is not an Agents SDK implementation. Any future Responses API/Agents SDK work must preserve backend authorization and explicit user confirmation boundaries.

## Security posture

The repository has a server-only environment configuration template, private tester-access logic, security migrations, payout controls, and explicit hard-disable migrations for real-money/live trading. Secrets are not intended to be committed. High-impact actions remain approval-gated.

## Branding and assets

ORENZA brand assets already exist under `public/brand/`, including `or​​enza-mark.svg`, `or​​enza-wordmark.svg`, and brand override CSS. PWA icons and manifest assets also exist. The ORENZA identity must be preserved.

## Android / iOS

- **Android:** Capacitor application ID is `com.orenzatech.orenza`; app name is `ORENZA`. CI successfully generated, synced, built, installed, and launched an Android 35 debug APK on the latest observed pipeline run.
- **Android release:** Existing workflow publishes only when explicitly requested, but its published artifact is currently a debug APK. Production signing/AAB release infrastructure is not yet configured.
- **iOS:** No committed iOS project was found in the audited repository tree. iOS therefore cannot be claimed as built/validated from source control.

## CI/CD baseline

`.github/workflows/orenza-ci.yml` currently installs dependencies, builds the web app, starts production Next.js, and runs the smoke suite. `.github/workflows/orenza-vercel.yml` verifies the deployed production URL and critical routes. `.github/workflows/android-release.yml` performs web build/smoke tests, Android generation, debug APK build, emulator install/launch, artifact upload, and explicit release publication.

The latest observed Android pipeline run completed successfully for build, smoke tests, APK generation, emulator install/launch, and finalization; the release job was skipped because the run was not an explicit Android release invocation.

## Known gaps against the master product specification

1. The active login UX does not yet route through the dedicated OTP screen.
2. The repository's package scripts do not currently expose separate lint/typecheck/unit/integration test commands.
3. The Android workflow does not yet validate a release AAB/APK build or production signing.
4. No committed iOS native project is present.
5. The AI surface is advisory and the repository does not currently include an Agents SDK dependency; this is a deliberate gap pending an architecture decision, not a missing requirement to add agents everywhere.
6. Several consumer/admin areas are implemented through the shared platform shell and need feature-by-feature verification against the full master checklist rather than being assumed complete from route existence alone.
7. External credentials/services (email delivery, provider trading, MT5 bridge, payout providers, production AI configuration, and deployment secrets) must be configured outside Git before their respective integrations can be declared operational.

## Implementation rule

Proceed incrementally from this audited baseline. Preserve working ORENZA functionality, keep sandbox/live boundaries explicit, and do not mark an integration complete unless the real backend/service path and tests confirm it.