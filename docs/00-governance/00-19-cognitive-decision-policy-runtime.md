# Stage 35 - Cognitive Decision Policy Runtime

## Status

**Superseded by Stage 45.**

Stage 35 previously created policy proposals directly from reviewed memory. That created a second proposal authority beside the evidence-gated Stage 45 runtime.

## Current authority

Policy proposals are now created only by:

`scripts/node/cognitive-policy-governance-runtime.mjs`

Stage 45 requires a valid `PROPOSAL_ELIGIBLE` record before writing a policy proposal.

Use:

```
node scripts/node/cognitive-policy-governance-runtime.mjs status
node scripts/node/cognitive-policy-governance-runtime.mjs propose <eligibility_id> <name> <scope> <condition> <action> [confidence] [source] [preconditions] [expires_at] [rollback]
node scripts/node/cognitive-policy-governance-runtime.mjs review [id]
```

## Boundary

Do not recreate the Stage 35 standalone proposal runtime. New proposal behavior belongs in Stage 45.
