# Stage 42 - Cognitive Knowledge Promotion & Policy Eligibility Runtime

Stage 42 adds a second trust boundary: trusted knowledge is not automatically eligible to influence policy.

## Lifecycle

TRUSTED KNOWLEDGE → ELIGIBILITY CANDIDATE → ELIGIBLE

Eligibility is explicit and scoped to a purpose. The runtime records scope, purpose, evidence, and review state.

## Gates

Only Stage 41 knowledge with `TRUSTED` state can enter eligibility assessment. Assessment is review-required. Approval produces `ELIGIBLE` knowledge but does not create or activate a policy.

## Authority boundary

Stage 42 may:
- assess trusted knowledge for policy eligibility;
- propose scoped eligibility;
- explicitly approve eligibility.

Stage 42 may not:
- mutate beliefs or learning commits;
- create policy definitions;
- activate policies;
- create missions.

## CLI

node scripts/node/cognitive-knowledge-eligibility-runtime.mjs init
node scripts/node/cognitive-knowledge-eligibility-runtime.mjs status
node scripts/node/cognitive-knowledge-eligibility-runtime.mjs assess <promotion_id> [scope] [purpose] [evidence]
node scripts/node/cognitive-knowledge-eligibility-runtime.mjs approve <eligibility_id>
node scripts/node/cognitive-knowledge-eligibility-runtime.mjs review [id]
