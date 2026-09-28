# Stage 24 — Editorial Source Integrity Runtime

Stage 24 adds a deterministic source-integrity boundary after fact/freshness review and before SEO/release.

## Checks

- source URL presence
- canonical URL deduplication
- HTTPS and URL validity
- stable source-domain extraction
- claim-to-source coverage signal
- citation/reference language signal

The runtime does not fetch or verify remote pages, decide whether a source is authoritative, or prove a claim true. Human/editorial verification remains responsible for source quality, accessibility, provenance, and semantic claim-to-source matching.

## CLI

`node scripts/node/editorial-source-integrity-runtime.mjs check 02-meefunblog/02-staging-post.html`

Optional:

- `--json`
- `--write=artifacts/source-integrity.json`

Pipeline:

`Signal → Brief → Editorial Quality → Editorial Evidence → Fact & Freshness → Source Integrity → SEO Quality Gate → Release Transaction → Publish → Measure`

Stage 24 is fail-closed for detectable source-integrity defects but never grants publication authority.
