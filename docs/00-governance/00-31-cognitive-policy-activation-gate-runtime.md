# Stage 47 — Cognitive Policy Activation Gate Runtime

Stage 47 is the fail-closed gate immediately before policy activation.

## Required conditions

A policy must have:
- proposal eligibility lineage;
- evidence binding lineage;
- knowledge lineage;
- at least one adversarial verification;
- at least one passing `VERIFIED/PASS` verification.

The gate produces `ACTIVATION_ELIGIBLE` or `ACTIVATION_BLOCKED`.

## Lifecycle

POLICY PROPOSED → ADVERSARIAL VERIFIED → ACTIVATION GATE → Stage 36 explicit activation

Stage 47 never activates the policy itself.

## Authority boundary

Stage 47 may:
- inspect policy lineage;
- inspect adversarial verification results;
- issue an activation gate decision.

Stage 47 may not:
- activate or edit policies;
- mutate learning or beliefs;
- create missions.

## CLI

node scripts/node/cognitive-policy-activation-gate-runtime.mjs init
node scripts/node/cognitive-policy-activation-gate-runtime.mjs status
node scripts/node/cognitive-policy-activation-gate-runtime.mjs check <policy_id> [reviewer] [notes]
node scripts/node/cognitive-policy-activation-gate-runtime.mjs review [id]
