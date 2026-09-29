# Stage 23 - Editorial Fact & Freshness Runtime

Stage 23 adds a deterministic freshness boundary after evidence detection and before SEO/release.

## Checks

- explicit date/year signals
- stale years (3+ years older than the reference year)
- numeric-claim/source presence
- source/date context
- explicit comparison/conflict signals requiring editorial review

The runtime reports PASS/REVISE and blockers. It does not verify truth, browse the web, judge source quality, or grant publication authority.

## CLI

`node scripts/node/editorial-fact-freshness-runtime.mjs check 02-meefunblog/02-staging-post.html`

Optional:

- `--json`
- `--year=YYYY` for deterministic tests
- `--write=artifacts/fact-freshness.json`

Pipeline:

`Signal → Brief → Editorial Quality → Editorial Evidence → Fact & Freshness → SEO Quality Gate → Release Transaction → Publish → Measure`
