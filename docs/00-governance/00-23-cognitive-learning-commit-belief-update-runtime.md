# Stage 39 - Cognitive Learning Commit & Belief Update Runtime

Stage 39 is the controlled commit boundary between reviewed learning feedback and durable cognitive memory.

## Flow

Learning Feedback -> Explicit Commit -> Belief/Lesson Version -> Audit Ledger -> Retrieval/Graph

## Commit contract

A learning commit references:
- feedback id
- target (belief or lesson)
- claim/correction
- confidence delta
- prior confidence
- proposed confidence
- evidence/outcome ids
- commit status

Belief confidence is clamped to 0..1.

## Authority boundary

Stage 39 may explicitly commit reviewed feedback into a belief or lesson and record an audit event. It may roll back a belief commit.

It may not:
- accept raw outcomes without a feedback record;
- silently update memory;
- edit policy definitions;
- activate policies;
- create missions.

## CLI

node scripts/node/cognitive-learning-commit-runtime.mjs init
node scripts/node/cognitive-learning-commit-runtime.mjs status
node scripts/node/cognitive-learning-commit-runtime.mjs commit <feedback_id> <lesson|belief> <claim> [confidence_delta]
node scripts/node/cognitive-learning-commit-runtime.mjs rollback <commit_id>
node scripts/node/cognitive-learning-commit-runtime.mjs review [id]
