# Stage 44 - Cognitive Policy Proposal Eligibility Runtime

Stage 44 adds a final gate between evidence lineage and the policy proposal lifecycle.

## Lifecycle

EVIDENCE_BOUND → PROPOSAL ELIGIBILITY CANDIDATE → PROPOSAL ELIGIBLE → POLICY PROPOSAL

Only evidence bindings that passed Stage 43 can enter assessment. Assessment is review-required and approval is explicit.

## Authority boundary

Stage 44 may:
- assess evidence-bound knowledge for policy proposal eligibility;
- record reviewer rationale and threshold;
- explicitly approve proposal eligibility.

Stage 44 may not:
- create policy definitions;
- activate or edit policies;
- mutate learning or beliefs;
- create missions.

## CLI

node scripts/node/cognitive-policy-proposal-eligibility-runtime.mjs init
node scripts/node/cognitive-policy-proposal-eligibility-runtime.mjs status
node scripts/node/cognitive-policy-proposal-eligibility-runtime.mjs assess <binding_id> [reviewer] [rationale] [threshold]
node scripts/node/cognitive-policy-proposal-eligibility-runtime.mjs approve <eligibility_id>
node scripts/node/cognitive-policy-proposal-eligibility-runtime.mjs review [id]
