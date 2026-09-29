# Revenue System

The current production system is the resumable editorial loop in Stages 58-64. Run state and evidence live under `07-intelligence/runs/`.

## Production loop

```text
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

The loop is manual-first and fail-closed. It coordinates state and evidence without inventing research, publication receipts, measurements, revenue, or decisions.

## Commands

From the repository root:

```bash
node scripts/node/editorial-production-loop-runtime.mjs check <run_id>
node scripts/node/editorial-production-loop-runtime.mjs prepare <run_id>
node scripts/node/editorial-production-execution-adapter.mjs plan <run_id>
node scripts/node/blogger-publication-adapter.mjs plan <run_id>
node scripts/node/publication-verification-runtime.mjs verify <run_id>
node scripts/node/publication-measurement-intake-runtime.mjs prepare <run_id>
```

## Boundaries

- Stage 58 owns resumable production state.
- Stage 59 owns execution and CDP target verification.
- Stage 61 owns the authoritative Blogger publication transaction and receipt.
- Stage 62 owns Email-to-Blogger transport and observation.
- Stage 63 owns read-side publication verification.
- Stage 64 owns measurement eligibility and intake.
- Human approval remains the publication authority.
