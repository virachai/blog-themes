# Stage 45 - Cognitive Policy Proposal Runtime

Stage 45 connects the validated cognitive evidence chain to the existing policy proposal lifecycle.

## Required upstream gate

A proposal must reference a Stage 44 record with:

- `status: PROPOSAL_ELIGIBLE`
- `eligibility: ELIGIBLE`

The resulting policy preserves lineage to:
`proposal eligibility → evidence binding → eligible knowledge`.

## Lifecycle

PROPOSAL_ELIGIBLE → POLICY PROPOSED → Stage 36 explicit lifecycle activation

Stage 45 creates only a proposal. It does not activate, edit, execute, or retire policies.

## CLI

node scripts/node/cognitive-policy-proposal-runtime.mjs init
node scripts/node/cognitive-policy-proposal-runtime.mjs status
node scripts/node/cognitive-policy-proposal-runtime.mjs propose <eligibility_id> <name> <scope> <condition> <action> [confidence] [source] [preconditions] [expires_at] [rollback]
node scripts/node/cognitive-policy-proposal-runtime.mjs review [id]
