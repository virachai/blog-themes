# Stage 43 - Cognitive Policy Evidence Binding Runtime

Stage 43 creates explicit lineage between eligible knowledge and a future policy proposal.

## Lifecycle

ELIGIBLE KNOWLEDGE → EVIDENCE BINDING → POLICY PROPOSAL INPUT

A binding records the eligible knowledge id, policy scope, intended purpose, claim, and evidence reference.

## Gates

Only Stage 42 records with `ELIGIBLE` state can be bound. Binding itself does not create or activate a policy.

## Authority boundary

Stage 43 may:
- verify eligibility;
- bind eligible knowledge to a policy-oriented evidence record;
- preserve evidence lineage for downstream policy proposal systems.

Stage 43 may not:
- create policy definitions;
- activate policies;
- mutate beliefs or learning;
- create missions.

## CLI

node scripts/node/cognitive-policy-evidence-binding-runtime.mjs init
node scripts/node/cognitive-policy-evidence-binding-runtime.mjs status
node scripts/node/cognitive-policy-evidence-binding-runtime.mjs bind <eligibility_id> [policy_scope] [purpose] [claim] [evidence]
node scripts/node/cognitive-policy-evidence-binding-runtime.mjs review [id]
