# Stage 25 - Editorial Citation Mapping Runtime

Stage 25 converts source integrity into a deterministic claim-to-source mapping boundary.

## Checks

- detectable claims
- claim/source ratio
- citation/reference markers
- citation proximity
- orphan claims
- orphan sources

The runtime emits an evidence graph containing claim IDs and source hints. This is a structural mapping signal, not proof that a source actually supports a claim. Human/editorial review remains responsible for semantic verification.

## CLI

`node scripts/node/editorial-citation-mapping-runtime.mjs check 02-meefunblog/02-staging-post.html`

Optional:

- `--json`
- `--write=artifacts/citation-mapping.json`

Pipeline:

`Signal → Brief → Editorial Quality → Editorial Evidence → Fact & Freshness → Source Integrity → Citation Mapping → SEO Quality Gate → Release Transaction → Publish → Measure`

Stage 25 is fail-closed for detectable mapping defects but never grants publication authority.
