# Revenue System Runbook

## Weekly 30-minute cycle

### 1. Discovery — 5 min

Review `01-discovery/opportunities.csv`. Add only opportunities with a specific audience problem, distribution path, monetization path, success metric, and stop condition. Mark promising rows `ready`.

### 2. Asset Factory — 8 min

Create one asset record in `02-assets/assets.csv`. Link it to an opportunity and define asset type, target intent, primary action, monetization mechanism, and acceptance checklist.

### 3. Distribution — 5 min

Record publication in `03-distribution/runs.csv`. Use the normal Blogger/GitHub workflow and record the canonical URL and evidence.

### 4. Monetization — 3 min

Record the mechanism in `04-monetization/plans.csv`. Examples: adsense, affiliate, lead, product, service. Actual revenue must remain separate from estimates.

### 5. Measurement — 5 min

Append a comparable snapshot to `05-measurement/snapshots.csv` at a fixed cadence. Record source and actual revenue.

### 6. Optimization — 4 min

Record one decision in `06-optimization/decisions.csv`: `keep`, `improve`, `expand`, `stop`, or `wait`. Every decision references evidence and a next action.

## Gates

G0 Opportunity → G1 Asset → G2 Distribution → G3 Monetization → G4 Measurement → G5 Optimization.

## Minimum-time loop

Pick one ready opportunity → ship one asset → connect one monetization path → record baseline → set review date → make one evidence-based decision.
