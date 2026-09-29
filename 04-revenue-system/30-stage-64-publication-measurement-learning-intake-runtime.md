# Stage 64 - Publication Measurement & Learning Intake Runtime

> Status: IMPLEMENTED
> Date: 2026-09-28

Stage 64 establishes the handoff from verified publication into the existing
measurement runtime. It does not invent metrics and does not grant learning
authority.

## Boundary

PUBLISHED_VERIFIED -> measurement eligibility -> measurement observation -> learning

A publication is eligible for measurement only when Stage 63 reports
PUBLISHED_VERIFIED and the run contains an authoritative Stage 61 receipt.

The runtime writes a measurement-intake artifact. It does not fabricate
outcomes, mark a metric as successful, or create durable learning.

## Command

    node scripts/node/publication-measurement-intake-runtime.mjs prepare <run_id>

The command is read-only with respect to external systems. It writes
publication-measurement-intake.json and records:

- publication URL and external id from the authoritative receipt;
- Stage 63 verification status;
- metric and observation window from measurement-plan.json;
- explicit baseline/target requirements;
- measurement readiness;
- the exact next action.

## States

| State | Meaning |
| --- | --- |
| READY_FOR_MEASUREMENT | verified publication can enter measurement |
| AWAITING_PUBLICATION | authoritative publication receipt is absent |
| AWAITING_VERIFICATION | publication exists but Stage 63 is not verified |
| BLOCKED | evidence or measurement plan is inconsistent |

Stage 64 is the measurement-entry authority for the current publication pipeline. It only determines whether verified publication evidence is eligible for real observation; the observation itself must be supplied as run evidence.

## Safety

- No network calls.
- No Blogger mutation.
- No metric fabrication.
- No success/failure inference.
- No durable learning.
- Missing or inconsistent evidence fails closed.
