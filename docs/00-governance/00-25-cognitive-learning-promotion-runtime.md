# Stage 41 - Cognitive Learning Promotion Runtime

Stage 41 separates durable learning from trusted knowledge.

## Trust lifecycle

LEARNED -> CANDIDATE -> TRUSTED

A learning commit can only become a promotion candidate after Stage 40 validation. A candidate can only become TRUSTED through an explicit promotion command.

## Gates

Promotion is blocked when any linked validation has a `BLOCK` gate.

The runtime does not infer trust from a single outcome and does not automatically create policies from trusted knowledge.

## Authority boundary

Stage 41 may:
- verify validation evidence;
- propose promotion;
- explicitly promote a reviewed candidate to TRUSTED;
- expose trusted knowledge for downstream consumers.

Stage 41 may not:
- rewrite beliefs;
- alter policy definitions;
- activate policies;
- create missions;
- bypass regression gates.

## CLI

node scripts/node/cognitive-learning-commit-runtime.mjs init
node scripts/node/cognitive-learning-commit-runtime.mjs status
node scripts/node/cognitive-learning-commit-runtime.mjs promote <commit_id> [reviewer] [evidence]
node scripts/node/cognitive-learning-commit-runtime.mjs trust <promotion_id>
node scripts/node/cognitive-learning-commit-runtime.mjs review [id]
