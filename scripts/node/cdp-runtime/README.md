# CDP Runtime

Runtime modules shared by the stage 58–62 editorial publication pipeline: a Chrome DevTools Protocol session, an evidence ledger, and a hash-chained transaction/idempotency layer.

These modules were previously kept in the gitignored `.tmp/cdp/runtime/`, which meant the tracked scripts importing them could not run from a fresh clone and could never be exercised by CI. This directory holds only the transitive closure that tracked scripts actually use; the remaining `.tmp/` runtime modules are reachable solely from untracked smoke tests and stay where they are.

- `cdp-session.mjs` - `CdpSession`: connect to a CDP target, evaluate, snapshot, screenshot, fingerprint.
- `evidence.mjs` - `createEvidence()`, `hashText()`: the evidence record shape and its content hash.
- `evidence-ledger.mjs` - `EvidenceLedger`: load/add/save `ledger.json` in a run folder.
- `adversarial-verifier.mjs` - `verifyEvidenceLedger()`, `adversarialVerify()`: BLOCK findings for incomplete or tampered evidence.
- `release-transaction.mjs` - `ReleaseTransaction`, `AuditTrail`: fail-closed preflight → approval → idempotency → execute → verify → commit, with rollback.
- `commit-coordinator.mjs` - `IdempotencyLedger`, `DistributedCommitCoordinator`: hash-chained reservation/commit/abort with fencing tokens.
- `task-state.mjs`, `handoff-contract.mjs`, `skill-invocation.mjs` - state and handoff validation used by the verifier.
- `runtime-plan.mjs`, `capability.mjs` - `createRuntimePlan()` and capability resolution.

Consumers import these as `./cdp-runtime/<name>.mjs`. Node's built-in `fetch` and `WebSocket` are used, so Node 22+ is required - consistent with the repository's zero-dependency rule.
