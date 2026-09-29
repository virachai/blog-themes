# Stage 26 - Editorial Contradiction & Claim Consistency Runtime

Stage 26 adds an internal consistency boundary after citation mapping and before SEO/release.

## Checks

- sentence structure detection
- explicit contradiction language
- repeated numeric tokens for contextual review
- repeated year tokens for contextual review
- unqualified absolute-claim language

The runtime detects review signals; it does not infer that repeated numbers or dates are contradictions by themselves. Human/editorial review remains responsible for semantic comparison, context, units, scope, and whether two statements actually refer to the same claim.

## CLI

`node scripts/node/editorial-contradiction-consistency-runtime.mjs check 02-meefunblog/02-staging-post.html`

Optional:

- `--json`
- `--write=artifacts/contradiction-consistency.json`

Pipeline:

`Signal → Brief → Editorial Quality → Editorial Evidence → Fact & Freshness → Source Integrity → Citation Mapping → Contradiction & Consistency → SEO Quality Gate → Release Transaction → Publish → Measure`

Stage 26 is fail-closed for explicit contradiction/absolute-language signals but never grants publication authority.
