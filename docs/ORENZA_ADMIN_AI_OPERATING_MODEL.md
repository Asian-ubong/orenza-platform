# ORENZA — ADMIN + AI OPERATING MODEL

## Principle

AI is an operations assistant, not an unrestricted money-moving authority.

## AI may execute automatically when policy permits

- routine sandbox funding within server-side limits
- non-financial notifications
- market/data synchronization
- reconciliation jobs
- low-risk account monitoring
- anomaly detection
- content classification
- incident triage
- KYC evidence preparation
- fraud/risk recommendations

## AI must request owner approval

- any real-money payout execution
- any real-money withdrawal/transfer enablement
- critical fraud overrides
- high-risk KYC exceptions
- disabling a security restriction
- changing real-money runtime controls
- other CRITICAL operations

## Approval record

Each AI action must persist:

- action ID
- action type
- target user/resource
- risk level
- recommendation
- evidence
- status
- approval identity/time
- decision note
- execution reference
- idempotency key
- timestamps

## Owner notification

The owner receives an in-app notification and, once an approved email/push provider is configured, an external notification containing a secure link back to the exact approval item.

Secrets, passwords and provider tokens are never included.

## RBAC

Owner: SUPER_ADMIN

Future workers receive only the minimum role needed:

- COMPLIANCE
- FINANCE
- TRADING
- SECURITY
- SUPPORT
- READ_ONLY

Worker roles cannot self-grant permissions or approve actions outside their policy.

## Live mode

Live market data may be enabled independently from real-money execution.

Real-money trading and payout controls are separate server-side switches and remain disabled until explicitly authorized. UI visibility does not constitute authorization.
