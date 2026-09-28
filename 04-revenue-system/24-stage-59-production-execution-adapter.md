# Stage 59 — Production Execution Adapter

Stage 59 bridges the Stage 58 production state machine to the existing CDP, evidence, and transaction primitives without making external execution implicit.

## Commands

```bash
node scripts/node/editorial-production-execution-adapter.mjs plan <run_id>
node scripts/node/editorial-production-execution-adapter.mjs execute <run_id> dry-run
node scripts/node/editorial-production-execution-adapter.mjs execute <run_id> cdp
```

### Modes

- **plan** — materializes the execution contract.
- **dry-run** — records preflight evidence without touching an external system.
- **cdp** — connects to the configured CDP browser, verifies the target, records a snapshot fingerprint, and stops before publication.

CDP endpoint defaults to `http://127.0.0.1:9222`; override with `CDP_ENDPOINT`.

## Execution boundary

A publication operation is blocked unless:

1. Stage 58 is no longer incomplete.
2. A release candidate exists.
3. Release status is `READY_FOR_RELEASE_APPROVAL`.
4. Explicit human approval is recorded as `APPROVED`.
5. Idempotency and evidence context exist.

The adapter does **not** manufacture approval, publication receipts, analytics, revenue, or success claims.

## Evidence

Each dry-run or CDP preflight appends an evidence record to the run's Evidence Ledger and writes:

`execution-plan.json`

This makes execution resumable and auditable without requiring an AI agent.

## Definition of done

Stage 59 is complete when a production run can be:

```
Stage 58 state
  ↓
Preflight
  ↓
Execution Plan
  ↓
Asset handoff
  ↓
CDP target verification
  ↓
Publication transaction (future operation)
  ↓
Publication receipt
  ↓
Measurement receipt
```

The actual publication transaction remains an explicit, gated operation rather than an automatic side effect of planning.
