# ORENZA — FULL USER FLOW

## 0. Platform boundary

ORENZA is the orchestration, identity, risk, ledger, support and administrative layer. Deriv remains the external source for enabled Deriv market/account/trading data. MT5 remains a separate external trading account connection.

All user-visible balances and trading results must come from the canonical backend/provider event path. No frontend hardcoded financial balances, invented prices or simulated real-money results are allowed in live mode.

## 1. Private access

`Install/open ORENZA → private access gate → authentication → allowlist check → device/session registration → dashboard`

- No uncontrolled public signup.
- Account access is backend-authorized.
- Every session receives a server-side session/device record.
- Suspended, blocked or unapproved users cannot proceed.

## 2. User registration and identity

`Invite/registration request → email verification → profile creation → device registration → terms/consent → KYC request`

The backend is the source of truth for identity, account status, permissions and eligibility.

## 3. KYC / AML

`KYC submission → document validation → identity/liveness checks → AML/risk screening → AI assessment → manual review when required → owner/admin decision → VERIFIED / REJECTED / RESTRICTED`

The AI may collect evidence, detect inconsistencies, score risk and recommend a decision. It must not fabricate verification or bypass the configured KYC provider. Provider credentials/results remain server-side.

## 4. Sandbox funding

`User requests sandbox funding → risk/eligibility checks → AI validates request against server limits → backend allocation → sandbox wallet ledger → user notification`

Sandbox funds are virtual and are never represented as real cash.

The current sandbox treasury rules remain backend-controlled, including the configured allocation/day limits.

## 5. Deriv connection

`Connect Deriv → OAuth 2.0 + PKCE → callback → state verification → backend token exchange → encrypted server-side token storage → account identity → authenticated WebSocket → balance/portfolio/transaction synchronization`

Provider tokens never enter the browser bundle or normal API responses.

## 6. Live Deriv markets

`Markets → active_symbols → market categorization → tick subscription → real-time quote → chart/history → account/provider availability checks`

Deriv's `active_symbols` feed is the source of available instruments and `ticks` is the source of live quotes. ORENZA must not hardcode a list as the authoritative market universe.

## 7. Trading

### Demo

`Market → instrument → order parameters → risk validation → user confirmation → backend → Deriv/MT5 demo execution → provider event → reconciliation → ORENZA ledger → position/P&L`

### Real

`KYC/eligibility → provider account verified → risk checks → instrument/account permissions → order review → explicit authorization → backend execution → provider event → reconciliation → ledger → position/P&L`

Real trading must never be enabled merely because the UI is present. Server-side runtime controls, provider authorization and applicable compliance requirements must all be satisfied.

## 8. MT5 account

`Eligible user → backend creates/links MT5 account → server receives account identity/settings → credentials delivered through secure provider-approved channel → user signs in to MT5 → live account/positions/deals synchronized → reconciliation`

ORENZA must not expose provider master passwords or secret credentials in the browser or normal admin UI.

## 9. AI operating layer

The AI continuously evaluates:

- KYC status and missing evidence
- account anomalies
- funding requests
- unusual trading activity
- market/risk conditions
- fraud/scam signals
- account restrictions
- reconciliation mismatches
- system health
- support/content operations

For each action it creates an auditable AI action record containing recommendation, evidence, risk level, status and execution/approval reference.

## 10. Owner approval

`AI detects action → AI creates action record → owner notification → owner opens admin app → evidence/recommendation shown → APPROVE or DECLINE → backend revalidates → execute if permitted → audit log → notify affected user`

### Mandatory owner approval

- Real-money payout execution
- Enabling real-money withdrawals/transfers
- High-risk KYC exceptions
- Critical account unblocking
- High-risk fraud overrides
- Changes to real-money runtime controls
- Other actions classified CRITICAL by the policy engine

## 11. Payout

`User requests payout → eligibility calculation → KYC/risk/duplicate checks → payout request → AI review → owner approval → backend idempotency check → payout provider adapter → provider result/webhook → ledger reconciliation → user/admin notification`

A direct real-money payout cannot be executed by AI alone.

## 12. Admin application

The admin application is a privileged, separate control surface for the owner.

Modules:

1. Dashboard
2. Users
3. Allowlist
4. KYC & AML
5. Sandbox funding
6. Trading monitor
7. Deriv
8. MT5
9. Wallets
10. Ledger
11. Profit Units
12. Payout approvals
13. Local transactions
14. AI action queue
15. Risk & fraud
16. Notifications
17. Content
18. Security
19. Incidents
20. System health
21. Runtime controls
22. Audit log

Workers can later receive restricted roles through RBAC without receiving owner privileges.

## 13. Notification flow

`Backend event → notification record → email/push/in-app channel → owner/admin action → status update`

The notification must contain enough context to open the exact pending approval in the admin app without exposing secrets.

## 14. Reconciliation

Every provider event is reconciled against ORENZA records.

`Provider event → normalized event → idempotency check → canonical ledger/account state → discrepancy detection → incident if mismatch`

No UI balance is authoritative unless it is sourced from the canonical backend/provider path.

## 15. Security states

User states:

`INVITED → ACTIVE → KYC_PENDING → VERIFIED → RESTRICTED → SUSPENDED → CLOSED`

Connection states:

`MISSING → CONNECTING → ACTIVE → DEGRADED → EXPIRED → REVOKED`

Approval states:

`PENDING_APPROVAL → APPROVED / DECLINED → EXECUTED / FAILED / CANCELLED`

## 16. Privacy

Testing remains private:

- no Google Play publication
- no public launch
- no public distribution campaign
- private GitHub/Vercel/Supabase/Figma access controls
- admin app restricted to authorized owner/admin identities

A private URL alone is not sufficient security; backend authorization remains mandatory.
