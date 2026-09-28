# Stage 51 — Cognitive Learning Eligibility & Commit Gate Runtime

Stage 51 is the fail-closed gate immediately before learning is allowed to enter the existing learning-commit runtime.

## Flow

Outcome Attribution → Feedback Proposal → Validation/Regression Check → Learning Eligibility Gate → Stage 39 Commit

## Runtime

`scripts/node/cognitive-learning-eligibility-gate-runtime.mjs`

Ledger: `04-revenue-system/07-intelligence/cognitive-memory/learning-eligibility-gates.jsonl`

## Invariants

- Attribution must be PASS and learning-eligible.
- Feedback must exist and be `PROPOSED_LEARNING`.
- Any linked regression validation blocks eligibility.
- PASS only means eligible for review/commit; it does not perform the commit.
- Stage 51 cannot update beliefs, lessons, policies, or missions.
