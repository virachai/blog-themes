# Stage 54 — Cognitive Learning Commit Provenance Runtime

## Purpose
Create a complete, append-only provenance chain for every learning commit.

## Chain
Outcome → Evidence → Attribution → Feedback → Eligibility Gate → Learning Commit

## Contract
A provenance record is verified only when the runtime can resolve:
- Stage 39 learning commit;
- source feedback and execution;
- Stage 50 attribution with PASS / learning eligibility;
- Stage 51 eligibility gate with PASS / LEARNING_ELIGIBLE;
- bound execution evidence;
- at least one referenced outcome.

Missing lineage is fail-closed as PROVENANCE_INCOMPLETE.

## Authority
Stage 54 verifies and records provenance only. It does not create learning commits or mutate beliefs/policies.

## CLI
```
node scripts/node/cognitive-learning-provenance-runtime.mjs init
node scripts/node/cognitive-learning-provenance-runtime.mjs status
node scripts/node/cognitive-learning-provenance-runtime.mjs build <commit_id>
node scripts/node/cognitive-learning-provenance-runtime.mjs review [id]
```

## Ledger
`04-revenue-system/07-intelligence/cognitive-memory/learning-commit-provenance.jsonl`
