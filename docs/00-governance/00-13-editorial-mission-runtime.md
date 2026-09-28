# Stage 29 — Editorial Mission Runtime

Stage 29 introduces a mission-level contract above individual editorial validators. A mission binds the originating signal, executable brief, article execution state, and measurement contract into one traceable unit.

## Mission contract

```json
{
  "mission_id": "mission-001",
  "signal": { "source": "search-console", "observation": "reader demand signal" },
  "brief": {
    "intent": "solve the reader problem",
    "audience": "target readers",
    "required_subtopics": ["topic one"],
    "evidence_requirements": ["source requirement"],
    "success_criteria": ["observable outcome"]
  },
  "article": { "path": "02-meefunblog/article.html", "status": "draft" },
  "measurement": { "success_metric": "organic clicks", "observation_window": "28d" }
}
```

## Runtime role

The runtime validates mission completeness and produces deterministic blockers. It does not publish, judge truth, infer causality, or declare business success. Downstream editorial and release runtimes remain authoritative for their own gates.

## CLI

node scripts/node/editorial-mission-runtime.mjs check <mission.json>
node scripts/node/editorial-mission-runtime.mjs check <mission.json> --json
node scripts/node/editorial-mission-runtime.mjs check <mission.json> --write=artifacts/mission.json

## Pipeline

Signal → Mission → Brief Contract → Article Production → Editorial Gates → SEO Gate → Release → Publish → Measure → Learning → Next Mission

Stage 29 is the first orchestration boundary that makes the complete content lifecycle traceable as one unit.
