# Stage 31 - Cognitive Retrieval & Context Assembly Runtime

Stage 31 turns Stage 30 durable memory into an executable pre-action context layer.

## Pipeline

Task -> Query -> Retrieve -> Rank -> Assemble Context -> Execute -> Measure -> Store Experience

## Retrieval

The first implementation is deterministic token-overlap retrieval. Query terms are matched against serialized memory records, zero-overlap records are excluded, matches are ranked, and results are capped. Every result keeps its memory id and type.

A future semantic/vector adapter can replace retrieval without changing the context contract.

## Context

The assembled package contains episodes, beliefs, decisions, lessons, procedures, and provenance. Retrieved beliefs remain hypotheses with their recorded confidence.

## Authority boundary

Stage 31 can retrieve and assemble context. It does not decide that a belief is true, mutate memory during retrieval, authorize missions, publish content, or make business decisions.

## CLI

node scripts/node/cognitive-memory-runtime.mjs status
node scripts/node/cognitive-memory-runtime.mjs retrieve "editorial quality"
node scripts/node/cognitive-memory-runtime.mjs assemble "editorial quality" 10
node scripts/node/cognitive-memory-runtime.mjs assemble "editorial quality" 10 --write=.agent-runs/cognitive-context.json
