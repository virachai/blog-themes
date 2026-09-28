# Stage 33 — Cognitive Consolidation & Knowledge Graph Runtime

Stage 33 consolidates cognitive memory into an explicit graph of nodes and typed relationships.

## Model

Episode -> Belief -> Decision -> Outcome -> Lesson -> Procedure

Evaluations connect observed evidence back to beliefs. The graph is a derived view; source JSONL memory remains authoritative.

## Contract

- Nodes preserve source type and source id.
- Edges are explicit and auditable.
- Missing references are ignored rather than fabricated.
- Graph generation never mutates beliefs, decisions, lessons, or procedures.
- The graph can later support semantic retrieval, impact tracing, contradiction analysis, and learning-path discovery.

## CLI

node scripts/node/cognitive-graph-runtime.mjs status
node scripts/node/cognitive-graph-runtime.mjs build
node scripts/node/cognitive-graph-runtime.mjs query editorial

## Authority

consolidation=true
graph_build=true
belief_update=false
decision_authority=false
mission_creation=false
