# Stage 52 - Cognitive Learning Commit Integrity Runtime

## Purpose
Verify that every learning commit is backed by a valid Stage 51 learning-eligibility gate and cannot be treated as integrity-verified when the gate is absent, blocked, or lineage-mismatched.

## Chain
Outcome → Evidence → Attribution [50] → Feedback → Validation/Regression → Eligibility Gate [51] → Learning Commit [39] → Commit Integrity [52]

## Contract
Stage 52 checks:
- the Stage 39 learning commit exists;
- its feedback record exists;
- a matching Stage 51 gate exists;
- the gate is PASS / LEARNING_ELIGIBLE;
- feedback and execution lineage agree;
- gate evidence/validation lineage is preserved.

A failed check is fail-closed as COMMIT_BLOCKED.

## Authority
Stage 52 verifies integrity only. It does not create commits, mutate beliefs, edit policies, activate policies, or create missions.

## CLI
```
node scripts/node/cognitive-learning-commit-integrity-runtime.mjs init
node scripts/node/cognitive-learning-commit-integrity-runtime.mjs status
node scripts/node/cognitive-learning-commit-integrity-runtime.mjs check <commit_id> [reviewer] [notes]
node scripts/node/cognitive-learning-commit-integrity-runtime.mjs review [id]
```

## Ledger
`04-revenue-system/07-intelligence/cognitive-memory/learning-commit-integrity.jsonl`

The ledger is append-only and stores commit, feedback, execution, gate, and validation lineage.

## Boundary
Stage 39 remains the commit executor. Stage 52 is the integrity checkpoint that must pass before a learning commit is considered valid for downstream use.
