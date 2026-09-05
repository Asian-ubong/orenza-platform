# ORENZA Architecture Inventory

Audit date: 2026-09-05
Repository: `Asian-ubong/orenza-platform`
Baseline version: `0.1.4`
Android application ID: `com.orenzatech.orenza`

## A. Existing and reusable

- Next.js App Router + React + TypeScript application shell.
- Shared ORENZA branding assets under `public/brand/`.
- Existing platform route dispatcher and authenticated/private surfaces.
- Supabase browser/server integration and existing migrations.
- Existing registration API and password authentication through Supabase Auth.
- Existing email OTP send/verify API boundary and verification UI.
- Existing sandbox/demo-oriented product surfaces and trading confirmation flow.
- Existing market, portfolio, wallet, payout/activity, KYC, MT5 and settings surfaces.
- Existing AI Premium/advisory market-analysis implementation.
- Existing server-side payout and provider gating.
- Existing MT5 server-side status/integration boundary.
- Existing PWA/update/version endpoints and Capacitor configuration.
- Existing Android CI generation, debug build and emulator smoke-test path.
- Existing Vercel and general CI workflows.

## B. Existing but incomplete

- Registration currently bypasses the OTP screen because email delivery is intentionally disabled for the current stage.
- Login currently uses password authentication without an OTP step.
- OTP API/UI exists but the production email provider is not enabled.
- AI is advisory rather than an authorized action-capable trading assistant.
- Trading is sandbox-first; live execution is intentionally gated/disabled until real infrastructure is configured.
- Wallet/payout integrations have provider boundaries but real-money operations remain gated.
- MT5 architecture exists but requires a real bridge/account configuration before live synchronization.
- Admin routes/control surfaces exist but require feature-by-feature RBAC and action verification.
- Automated coverage is currently strongest at route/smoke level; dedicated unit, integration and security test layers need expansion.
- Android CI can generate release APK/AAB artifacts, but production signing credentials are not configured in source/CI.
- iOS native project is not committed in the repository.

## C. Broken / currently failing validation

- Android release pipeline run 27 initially failed because the validation step assumed the generated release APK was named exactly `app-release.apk` even though Gradle may emit a suffixed release APK name. The build itself completed successfully.
- The validation logic was corrected to resolve `app-release*.apk` dynamically. A fresh pipeline run is required to verify the correction.

## D. Deprecated / risky patterns to remove progressively

- Direct feature assumptions based only on route existence.
- User-facing messaging that implies email OTP is active while the provider is disabled.
- Build scripts that lack explicit quality-gate commands for typecheck/lint/unit/integration/security layers.
- Any future financial state changes that do not flow through an authoritative server-side ledger/workflow.

## E. Missing

- Complete canonical auth state machine with enabled/disabled OTP provider states.
- Full demo/live account state model and enforced cross-environment isolation across every financial API.
- Complete authoritative double-entry-style ledger model where existing schema is insufficient.
- Production-grade deposit/withdrawal reconciliation with configured providers.
- Full native ORENZA Terminal execution infrastructure.
- Configured MT5 broker bridge and synchronization.
- Full KYC document verification provider integration.
- Complete AI permission model and high-risk action confirmation path.
- Production push-notification delivery configuration.
- Complete support ticket backend/workflow if not already represented by existing routes/data.
- Full admin RBAC matrix and backend-enforced dual approval for high-risk actions.
- Authenticated real-time event infrastructure where existing polling is insufficient.
- Dedicated unit/integration/security/mobile regression suites.
- Native iOS project, signing, archive and TestFlight pipeline.
- Android production keystore/signing configuration through protected CI secrets.

## F. Needs redesign

- Authentication navigation should make OTP the canonical future path while retaining a safe disabled-provider state today.
- Application state should be explicitly separated into auth, account mode, KYC, wallet, trading, notifications, AI and settings domains.
- Admin control center should be treated as an operational product rather than a collection of privileged screens.
- Release metadata should be traceable to commit, version, build number, environment and checksum.

## G. Needs security hardening

- OTP rate limits, attempt limits, expiration and replay protection must be verified end-to-end.
- Every sensitive API must enforce server-side authorization independent of UI state.
- Financial operations require idempotency and atomic ledger transitions.
- KYC storage must remain private and role-restricted.
- AI tools must be schema-validated, permission-checked and audited.
- Admin high-risk actions need explicit roles and, where required, dual approval.
- Logging must exclude secrets, tokens, OTP values and sensitive KYC contents.

## H. Needs backend implementation

- Canonical account/environment service.
- Authoritative wallet/ledger service and reconciliation workflows.
- Live account activation workflow after KYC approval.
- Promotional-credit ledger treatment with separate restrictions and expiry.
- Production trading execution adapter and terminal service.
- MT5 bridge adapter.
- Payment/deposit/withdrawal reconciliation services.
- AI permission/action authorization service.
- Notification delivery service.
- Admin audit/event service and real-time event stream.

## I. Needs mobile implementation

- Android is currently generated from the Capacitor web application in CI; native project output is not committed.
- First Android milestone must validate splash/welcome/auth/navigation/demo experience, not just that Gradle compiles.
- Secure mobile session handling, lifecycle/network recovery and push notification integration need feature-level verification.
- iOS requires a native project/build pipeline before any claim of a built iOS artifact.

## J. Needs testing

- Registration/login/OTP state-machine tests.
- Demo/live isolation tests, including malicious cross-environment requests.
- Ledger concurrency/idempotency tests.
- Withdrawal authorization and reconciliation tests.
- Trading order/position lifecycle tests.
- MT5 adapter contract tests.
- AI prompt-injection/tool-authorization tests.
- Admin RBAC matrix tests.
- Mobile install/launch/navigation regression tests.
- Release artifact integrity and metadata tests.

## Current verified baseline

- `pnpm build` completed successfully on the audited commit.
- Existing `pnpm e2e:smoke` passed all configured route/smoke checks, including anonymous admin protection and uncached version endpoint behavior.
- Android Gradle `assembleDebug assembleRelease bundleRelease` completed successfully in the failed pipeline run; artifact validation failed afterward due to the release APK filename assumption.
- Vercel deployment workflow for the corrected workflow commit completed successfully.
- The Android workflow validation has been corrected and is currently awaiting the fresh run result before the Android milestone is marked passed.

## External dependencies that must remain explicit

No production credentials are to be invented. The following require real configuration before production activation:

- Supabase production project/auth configuration.
- Email provider for OTP/recovery/security mail.
- Market-data provider.
- ORENZA trading execution infrastructure.
- MT5 bridge and broker account.
- Payment/banking/crypto providers.
- KYC/identity provider.
- Push notification provider.
- Android release keystore and signing secrets.
- Apple Developer account, certificates/profiles and App Store Connect/TestFlight configuration.
