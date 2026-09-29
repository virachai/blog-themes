# Stage 46 - Cognitive Policy Proposal Adversarial Verification Runtime

Stage 46 inserts an adversarial gate between policy proposal and policy activation.

## Checks

The runtime verifies:
- proposal eligibility lineage;
- evidence binding lineage;
- knowledge lineage;
- condition presence;
- action presence;
- rollback presence.

A missing required field creates a `BLOCK` gate and `REGRESSION_FLAG`.

## Lifecycle

POLICY PROPOSED → ADVERSARIAL VERIFICATION → VERIFIED/BLOCKED → Stage 36 lifecycle

Verification is append-only and never activates a policy.

## Authority boundary

Stage 46 may:
- inspect proposals;
- run deterministic adversarial checks;
- record findings and a PASS/BLOCK gate.

Stage 46 may not:
- activate or edit policies;
- mutate learning or beliefs;
- create missions.

## CLI

node scripts/node/cognitive-policy-adversarial-verification-runtime.mjs init
node scripts/node/cognitive-policy-adversarial-verification-runtime.mjs status
node scripts/node/cognitive-policy-adversarial-verification-runtime.mjs verify <policy_id> [attack] [reviewer] [notes]
node scripts/node/cognitive-policy-adversarial-verification-runtime.mjs review [id]
