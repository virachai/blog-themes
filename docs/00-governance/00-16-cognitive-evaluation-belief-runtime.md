# Stage 32 - Cognitive Evaluation & Belief Update Runtime

Stage 32 compares a recorded belief with an observed outcome and produces an auditable, bounded confidence proposal.

## Pipeline

Belief -> Prediction -> Action -> Observation -> Evaluation -> Confidence Proposal -> Review -> Explicit Update

## Contract

An evaluation records the belief id, prior confidence, observed outcome, confidence delta, proposed confidence, evidence status, and authority/status.

The initial conservative policy proposes +0.10 for supporting evidence or -0.10 for contradicting evidence, bounded to [0,1].

## Authority boundary

Stage 32 does not mutate the belief record. It writes proposed evaluations to evaluations.jsonl. Promotion into durable belief state is a separate reviewed action.

## CLI

node scripts/node/cognitive-learning-commit-runtime.mjs init
node scripts/node/cognitive-learning-commit-runtime.mjs status
node scripts/node/cognitive-learning-commit-runtime.mjs evaluate <belief_id> supported
node scripts/node/cognitive-learning-commit-runtime.mjs evaluate <belief_id> contradicted
node scripts/node/cognitive-learning-commit-runtime.mjs review [belief_id]
