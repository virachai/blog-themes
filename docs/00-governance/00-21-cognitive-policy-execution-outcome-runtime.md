# Stage 37 - Cognitive Policy Execution & Outcome Measurement Runtime

Stage 37 connects ACTIVE policies to observable executions and measured outcomes without allowing the runtime to activate policies, edit policy definitions, update beliefs, or create missions.

## Flow

ACTIVE Policy -> Execute -> Execution Record -> Observe -> Outcome Record -> Measurement Review -> Cognitive Evaluation

## Event records

- `policy-executions.jsonl` - immutable execution records.
- `policy-outcomes.jsonl` - immutable observed outcome records.
- Stage 36 remains authoritative for policy lifecycle state.
- Stage 35 remains authoritative for policy proposals.

## Contract

An execution records:
- execution id
- policy id
- policy version
- context
- condition
- action
- execution status

An outcome records:
- outcome id
- execution id
- policy id/version
- observed result
- measurement status
- measurement timestamp

## Authority boundary

Stage 37 may:
- execute an ACTIVE policy explicitly;
- record execution evidence;
- record observed outcomes;
- expose execution/outcome history for measurement review.

Stage 37 may not:
- activate or deactivate policies;
- rewrite policy definitions;
- update beliefs automatically;
- create missions;
- fabricate outcomes.

## CLI

node scripts/node/cognitive-policy-execution-runtime.mjs init
node scripts/node/cognitive-policy-execution-runtime.mjs status
node scripts/node/cognitive-policy-execution-runtime.mjs execute <policy_id> <context>
node scripts/node/cognitive-policy-execution-runtime.mjs outcome <execution_id> <observed> [status]
node scripts/node/cognitive-policy-execution-runtime.mjs review [policy_id]
