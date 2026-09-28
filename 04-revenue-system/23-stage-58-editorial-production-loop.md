# Stage 58 — Editorial Production Loop Runtime

Stage 58 connects the existing discovery, asset, distribution, monetization, measurement, optimization, and intelligence layers into one inspectable production state machine.

## Runtime

`scripts/node/editorial-production-loop-runtime.mjs`

The runtime is deliberately **manual-first and fail-closed**:

```
Opportunity
  ↓
Research
  ↓
Asset
  ↓
Release Approval
  ↓
Publication Receipt
  ↓
Measurement
  ↓
Learning / Optimization
  ↺
Opportunity
```

## Commands

From repository root:

```bash
node scripts/node/editorial-production-loop-runtime.mjs check <run_id>
node scripts/node/editorial-production-loop-runtime.mjs prepare <run_id>
```

`prepare` writes `production-loop-state.json` into the run directory.

## Gates

| Gate | Required evidence |
| :-- | :-- |
| Opportunity | validated mission/run contract |
| Research | real research brief |
| Asset | release-candidate asset |
| Release | explicit approval boundary |
| Publication | real publication receipt |
| Measurement | observed outcome |
| Learning | evidence-backed decision |

## Safety boundaries

- The runtime never fabricates sources, metrics, publication receipts, or revenue.
- `READY_FOR_RELEASE_APPROVAL` is not publication authority.
- External publication remains an explicit human-controlled action.
- Measurement is not inferred from asset creation or publication intent.
- Learning is downstream of observed evidence.

## Definition of done

A run reaches `LOOP_COMPLETE` only when publication, measurement, and learning evidence have all been recorded. Otherwise the runtime reports the first actionable gate and preserves the run state for resumption.
