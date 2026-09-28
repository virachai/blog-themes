# Stage 35 — Cognitive Decision Policy Runtime

Stage 35 turns reviewed cognitive knowledge into explicit decision-policy proposals.

## Policy contract

A policy contains:
- name
- scope
- condition / precondition
- action
- confidence
- source
- expiry (optional)
- rollback procedure
- lifecycle status

Policies are explicit operational rules, not implicit model behavior.

## Lifecycle

Knowledge -> Reviewed Evidence -> Policy Proposal -> Review -> Explicit Activation -> Measure -> Rollback/Retire

## Authority boundary

Stage 35 can create policy proposals and expose them for review. It cannot activate, edit, or retire an active policy and cannot create missions.

## CLI

node scripts/node/cognitive-policy-runtime.mjs init
node scripts/node/cognitive-policy-runtime.mjs status
node scripts/node/cognitive-policy-runtime.mjs propose <name> <scope> <condition> <action> <confidence> [source]
node scripts/node/cognitive-policy-runtime.mjs review [id]
