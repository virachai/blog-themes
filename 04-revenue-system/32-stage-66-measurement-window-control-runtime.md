# Stage 66 - Measurement Window Control Runtime

Stage 66 controls **when** a real outcome observation is allowed to enter Stage 65. It does not collect metrics, fabricate observations, or mutate external systems.

## Boundary

```text
Stage 64 READY_FOR_MEASUREMENT
  -> identify authoritative publication observation time
  -> calculate observation window
  -> WAITING_FOR_WINDOW / READY_TO_MEASURE
  -> Stage 65 may collect real observations
```

## Commands

```bash
node scripts/node/measurement-window-control-runtime.mjs init <run_id>
node scripts/node/measurement-window-control-runtime.mjs check <run_id>
```

`init` records the immutable window anchor and due time from existing publication evidence. `check` recalculates current state without changing the anchor.

## Safety invariants

- Requires Stage 64 `READY_FOR_MEASUREMENT`.
- Requires an authoritative Stage 61 publication receipt.
- Requires a traceable Stage 62 publication observation timestamp.
- Never treats the local process time as the publication time.
- Never writes measured values, baseline, target, or sources.
- Never calls analytics APIs or mutates Blogger.
- A future window is `WAITING_FOR_WINDOW`; only an elapsed window becomes `READY_TO_MEASURE`.
- Stage 65 remains responsible for validating actual measurements and sources.
