# Stage 30 — Cognitive Memory & Learning Runtime

Stage 30 introduces a durable cognitive layer above mission execution. It records experience, beliefs, decisions, lessons, and procedures as structured memory so future runs can retrieve prior context and learn from measured outcomes.

## Cognitive contract

The runtime separates **memory from authority**:

- Episodes record what happened and the observed outcome.
- Beliefs record hypotheses with explicit confidence.
- Decisions record rationale and expected outcomes.
- Lessons record failures, corrections, evidence, scope, and limits.
- Procedures record reusable operational patterns.
- Memory may inform future work, but it does not silently authorize publication, mission creation, or business decisions.

## Learning loop

Signal → Mission → Execute → Measure → Episode → Recall → Critique → Lesson → Procedure/Belief update → Next execution

The runtime is deliberately fail-closed around authority. A lesson can be proposed from experience, but promotion into an operational rule remains an explicit reviewed action.

## Storage

Durable records live under:

`04-revenue-system/07-intelligence/cognitive-memory/`

- `episodes.jsonl`
- `beliefs.jsonl`
- `decisions.jsonl`
- `lessons.jsonl`
- `procedures.jsonl`

JSONL keeps records append-only and inspectable while preserving a zero-dependency runtime.

## CLI

```bash
node scripts/node/cognitive-memory-runtime.mjs init
node scripts/node/cognitive-memory-runtime.mjs status

node scripts/node/cognitive-memory-runtime.mjs remember episodes '{"event":"...","outcome":"..."}'
node scripts/node/cognitive-memory-runtime.mjs remember beliefs '{"claim":"...","confidence":0.62}'
node scripts/node/cognitive-memory-runtime.mjs remember decisions '{"decision":"...","reason":"...","expected_outcome":"..."}'
node scripts/node/cognitive-memory-runtime.mjs remember lessons '{"trigger":"...","failure":"...","correction":"..."}'
node scripts/node/cognitive-memory-runtime.mjs remember procedures '{"trigger":"...","steps":["..."]}'

node scripts/node/cognitive-memory-runtime.mjs recall "query"
node scripts/node/cognitive-memory-runtime.mjs learn "query"
```

## Authority boundaries

The Stage 30 runtime can:

1. persist structured memory;
2. retrieve relevant prior experience;
3. represent uncertainty;
4. propose lessons from episodes.

It cannot:

1. declare a belief true;
2. silently rewrite an operational procedure;
3. create or activate a mission;
4. publish content;
5. make business decisions on behalf of the operator.

This makes memory cumulative without allowing memory drift to become uncontrolled autonomous authority.
