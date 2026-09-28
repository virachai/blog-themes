# Stage 28 — Editorial Brief Contract Runtime

Stage 28 turns the editorial brief into an executable contract between the research/briefing layer and the article.

It checks intent, audience, required subtopics, evidence requirements, success criteria, and optional must-include / must-avoid constraints using deterministic lexical/structural signals.

## Contract format

JSON is preferred with fields: intent, audience, required_subtopics, evidence_requirements, success_criteria, must_include, and must_avoid. A simple Markdown contract using matching headings and bullet lists is also accepted.

## Runtime boundary

This runtime does not determine semantic truth, source authority, audience satisfaction, or whether a criterion is genuinely fulfilled. It produces structural signals for editorial review. It has no release authority; final release remains governed by the seo-quality-gate and release transaction.

## CLI

node scripts/node/editorial-brief-contract-runtime.mjs check <article-file> <brief-file>
node scripts/node/editorial-brief-contract-runtime.mjs check <article-file> <brief-file> --json
node scripts/node/editorial-brief-contract-runtime.mjs check <article-file> <brief-file> --write=artifacts/brief-contract.json

## Pipeline

Signal → Brief Contract → Editorial Quality → Evidence → Fact & Freshness → Source Integrity → Citation Mapping → Contradiction & Consistency → Semantic Coverage → SEO Quality Gate → Release Transaction → Publish → Measure

## Non-goals

- no remote source fetching
- no truth verification
- no semantic entailment
- no autonomous publishing
- no replacement of human/editorial review
