# Stage 22 — Editorial Evidence Runtime

Stage 22 adds an evidence boundary between writing quality and SEO/release. It extracts factual-claim signals, discovers source URLs, measures source density, and emits a durable evidence ledger.

## Contract

Input: local HTML or Markdown article.

Output: detected claim signals, source URLs, HTTPS validation, deterministic score/blockers, PASS or REVISE, and explicit evidence_authority/release_authority false flags.

This runtime does not decide whether a claim is true. It identifies claims that need evidence and checks whether the draft exposes supporting source signals. Human/editorial verification remains required for factual truth, freshness, and source quality.

## CLI

    node scripts/node/editorial-evidence-runtime.mjs check 02-meefunblog/02-staging-post.html
    node scripts/node/editorial-evidence-runtime.mjs check 02-meefunblog/02-staging-post.html --json
    node scripts/node/editorial-evidence-runtime.mjs check article.html --write=artifacts/evidence.json

## Runtime position

Signal → Brief → Editorial Quality → Editorial Evidence → SEO Quality Gate → Release Transaction → Publish → Measure

Stage 22 is fail-closed for missing evidence signals but never grants publication authority.
