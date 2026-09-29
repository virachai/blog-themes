# Cognitive Memory

Stage 30 durable memory store.

Records are append-only JSONL and should be treated as evidence-bearing state, not unquestionable truth.

- episodes.jsonl - observed experiences and outcomes
- beliefs.jsonl - hypotheses with confidence
- decisions.jsonl - decisions, rationale, expected outcomes
- lessons.jsonl - proposed durable lessons
- procedures.jsonl - reusable procedures

Use `node scripts/node/cognitive-memory-runtime.mjs status` to inspect the store.
