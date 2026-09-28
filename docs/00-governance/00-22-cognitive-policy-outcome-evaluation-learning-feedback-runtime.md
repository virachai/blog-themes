# Stage 38 — Cognitive Policy Outcome Evaluation & Learning Feedback Runtime

Stage 38 evaluates observed policy outcomes and produces reviewable learning proposals.

## Flow

Policy Execution -> Observed Outcome -> Outcome Evaluation -> Learning Feedback Proposal -> Review -> Cognitive Learning

## Contract

A feedback record preserves:
- execution id
- policy id and version
- observed outcome references
- assessment
- evidence source
- status
- next action

Stage 38 does not directly mutate beliefs, policies, or missions.

## Authority boundary

May:
- evaluate an observed outcome;
- connect outcomes to the exact policy version and execution;
- create a proposed learning feedback record;
- expose feedback for review.

May not:
- update beliefs automatically;
- edit policy definitions;
- activate policies;
- create missions;
- fabricate an outcome.

## CLI

node scripts/node/cognitive-policy-feedback-runtime.mjs init
node scripts/node/cognitive-policy-feedback-runtime.mjs status
node scripts/node/cognitive-policy-feedback-runtime.mjs evaluate <execution_id> <assessment> [evidence]
node scripts/node/cognitive-policy-feedback-runtime.mjs review [policy_id]
