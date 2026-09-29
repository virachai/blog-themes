# Stage 27 - Editorial Semantic Coverage Runtime

Stage 27 adds an intent and semantic-coverage boundary before SEO/release.

## Checks

- recognizable user-intent signal
- explicit user question/problem signal
- semantic heading coverage
- paragraph depth across sections
- recurring vocabulary/topic coherence

The runtime provides structural coverage signals only. It does not claim to understand reader intent perfectly, prove topical completeness, or replace editorial judgment. A real brief/subtopic manifest can be supplied by a future contract-aware stage.

## CLI

`node scripts/node/editorial-semantic-coverage-runtime.mjs check 02-meefunblog/02-staging-post.html`

Optional:

- `--json`
- `--write=artifacts/semantic-coverage.json`

Pipeline:

`Signal → Brief → Editorial Quality → Evidence → Freshness → Source Integrity → Citation Mapping → Contradiction & Consistency → Semantic Coverage → SEO Quality Gate → Release Transaction → Publish → Measure`

Stage 27 is fail-closed for detectable structural coverage defects but never grants publication authority.
