# Stage 60 — Publication Transaction Runtime

Stage 60 wraps publication execution in a fail-closed transaction boundary.

## Commands

```bash
node scripts/node/editorial-publication-transaction-runtime.mjs plan <run_id>
node scripts/node/editorial-publication-transaction-runtime.mjs execute <run_id> dry-run
node scripts/node/editorial-publication-transaction-runtime.mjs execute <run_id> cdp
```

## Transaction

```
PREFLIGHT
  ↓
HUMAN APPROVAL
  ↓
IDEMPOTENCY RESERVATION
  ↓
EXECUTION
  ↓
VERIFICATION
  ↓
COMMIT
  ↘
   ROLLBACK on failure
```

The runtime reuses the existing ReleaseTransaction, distributed commit/idempotency ledger, CDP session, and Evidence Ledger.

## Important boundary

Stage 60 does not equate browser connectivity with publication success.

The current CDP adapter verifies the selected browser target and stops before performing an irreversible publication action. A real Blogger publication adapter must be bound explicitly to the site's UI contract and provide a post-action verification plus a real publication receipt.

No `publication-receipt.json` is created by a dry-run or target-verification-only execution.

## Gates

- release must be `READY_FOR_RELEASE_APPROVAL`
- explicit approval must be `APPROVED`
- asset must exist
- idempotency key and fencing context are required
- verification must pass before commit
- evidence is recorded for every transaction attempt

## Definition of done

A real publication implementation can be plugged into the transaction without changing the surrounding state machine, and every attempt remains resumable, auditable, idempotent, and rollback-aware.
