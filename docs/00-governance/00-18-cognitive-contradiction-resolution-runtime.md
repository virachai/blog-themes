# Stage 34 - Cognitive Contradiction & Resolution Runtime

Stage 34 detects candidate contradictions across beliefs, lessons, and procedures and creates auditable resolution proposals.

## Pipeline

Knowledge Graph -> Candidate Pairing -> Similarity -> Contradiction Candidate -> Resolution Proposal -> Human Review

Detection is heuristic, not truth. Candidates require review.

## Contract

- Compare cognitive records without mutating source memory.
- Use lexical overlap to avoid unrelated pairs.
- Mark candidates rather than asserting contradiction as fact.
- Store optional proposals in contradictions.jsonl.
- Never automatically update beliefs, procedures, decisions, or missions.

## CLI

node scripts/node/cognitive-conflict-runtime.mjs status
node scripts/node/cognitive-conflict-runtime.mjs detect
node scripts/node/cognitive-conflict-runtime.mjs review
node scripts/node/cognitive-conflict-runtime.mjs propose

## Authority

detection=true
resolution_proposal=true
belief_update=false
procedure_update=false
decision_authority=false
