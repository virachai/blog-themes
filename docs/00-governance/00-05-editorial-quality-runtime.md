# Stage 21 — Editorial Quality Runtime

Stage 21 turns editorial quality into a deterministic runtime boundary. It evaluates a draft before the existing SEO/release gate and produces a machine-readable report.

## Contract

Input: one local article file (HTML or Markdown).

Output:
- title and structural metrics;
- deterministic quality checks;
- score and blockers;
- PASS or REVISE;
- explicit release_authority: false.

Passing editorial quality does not publish, deploy, or bypass the existing release gate.

## Quality dimensions

1. Title — usable length for a search-facing article.
2. Substance — minimum body length.
3. Structure — headings and paragraphs support scanning.
4. Navigation/evidence — links are present.
5. Media — long-form drafts are expected to consider imagery.
6. Readability — sentence-length discipline.
7. Intent — the draft exposes reader questions or sufficiently deep structure.

## CLI

    node scripts/node/editorial-quality-runtime.mjs check 02-meefunblog/02-staging-post.html
    node scripts/node/editorial-quality-runtime.mjs check 02-meefunblog/02-staging-post.html --json

Exit codes: 0 PASS, 2 REVISE, 1 runtime/input error.

## Runtime position

Signal → Editorial Brief → Editorial Quality Runtime (Stage 21) → SEO Quality Gate → Release Transaction → Publish / Measure

Stage 21 can recommend revision, but it cannot grant release authority.
