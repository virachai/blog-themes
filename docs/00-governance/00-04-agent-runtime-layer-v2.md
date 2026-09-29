# Agent Runtime Layer v2

## Purpose
Turn the completed 15-skill system into a single registry-driven execution control plane.
The runtime does not replace the skills. It decides which skill chain is sufficient, resolves dependencies, and enforces the final quality-gate handoff.

## Runtime Contract
TASK -> INTENT ROUTER -> MINIMUM SUFFICIENT SKILL -> DEPENDENCY CLOSURE -> EXECUTION HANDOFF -> SEO QUALITY GATE -> REPORT

## Commands
node scripts/node/meefunblog-runtime.mjs validate
node scripts/node/meefunblog-runtime.mjs route "draft an article about ..."
node scripts/node/meefunblog-runtime.mjs plan "publish a Blogger template change"
node scripts/node/meefunblog-runtime.mjs route --json "..."

## Responsibilities
1. Registry validation: exactly 15 skills, mirrored registries, matching SKILL.md frontmatter, valid dependencies, no cycles, explicit release gate.
2. Intent routing: score task text against registry triggers and select the highest-signal skill.
3. Dependency planning: resolve the selected skill's dependency closure in deterministic order.
4. Release safety: selected execution paths end at seo-quality-gate; publish/release/deploy/live/material language also forces the gate.

## Confidence Policy
Confidence is a routing signal, not permission. A weak or zero match must not become autonomous escalation.

## Design Invariants
1. Registry is the source of truth.
2. Runtime maintains no duplicate skill inventory.
3. Dependency closure is deterministic.
4. Unknown dependencies and cycles fail validation.
5. Missing SKILL.md fails validation.
6. seo-quality-gate remains explicit.
7. Runtime planning has no external side effects.
8. Routing does not grant authority.
9. Failed validation means the runtime is not trusted for orchestration.

## Execution Contract v2.1

The `contract` command converts a route into a machine-readable task handoff without executing the task.

```bash
node scripts/node/meefunblog-runtime.mjs contract "publish a Blogger template performance change"
```

The contract contains:

- objective and operating mode;
- C2/C3 change classification;
- selected skills and deterministic execution chain;
- routing confidence;
- empty evidence ledger for verified facts/results;
- explicit skill-to-skill handoffs;
- G0-G4 gate state;
- rollback requirement;
- `PLANNED` lifecycle status.

The contract is an **execution boundary**, not an authorization token. A skill may only move its handoff/gate state after producing evidence. A release gate cannot be marked PASS from routing alone.

## Scope Boundary
v2 stops before execution automation. Future layers may add task-state persistence, evidence ledgers, confidence calibration, handoff contracts, adversarial verification, structured reports, and controlled skill invocation adapters.
## Stage 5 - Runtime Integration

Stage 5 turns the v2 control plane into a capability-oriented runtime foundation. The runtime now has explicit adapters for browser sessions, observations, capability resolution, runtime planning, and evidence records.

Runtime flow:

TASK -> ROUTE -> CAPABILITY RESOLUTION -> SESSION -> OBSERVE -> EXECUTE -> TRACE -> EVIDENCE -> VALIDATE -> REPORT

Implemented runtime modules originate under `.tmp/cdp/runtime/`. The subset consumed by tracked scripts was promoted to [`scripts/node/cdp-runtime/`](../../scripts/node/cdp-runtime/README.md) - `.tmp/` is gitignored, so importing from it meant a fresh clone and CI could not resolve the stage 58–62 runtimes at all:

- `session.mjs` - browser session state and navigation history. Still in `.tmp/`; no tracked script imports it.
- `observation.mjs` - normalized page observation and summaries. Still in `.tmp/`; no tracked script imports it.
- `capability.mjs` - canonical runtime capability resolution. **Moved** to `scripts/node/cdp-runtime/`.
- `meefunblog-runtime.mjs` - deterministic execution-phase plan with security boundaries.
- `evidence.mjs` - timestamped evidence records with SHA-256 content hashes. **Moved** to `scripts/node/cdp-runtime/`.

`browser-trace` is the observability adapter. It remains read-only and is not the browser control plane.

Stage 5 establishes the runtime integration contract but does not grant autonomous authority. Browser security challenges require human handoff, authentication remains session-explicit, and planning does not bypass release gates. Future work may add persistent task state, live CDP session adapters, snapshot diffing, evidence ledgers, skill invocation adapters, and adversarial verification.

## Stage 5 Adapters

Stage 5 now includes four live-runtime adapters:

- `cdp-session.mjs` - connects to the active Chrome CDP target, evaluates page state, navigates, captures snapshots and screenshots.
- `evidence-ledger.mjs` - persists structured evidence records with stable IDs and content hashes.
- `snapshot-diff.mjs` - compares page snapshots by URL, title, readiness, text and HTML hashes/lengths.
- `skill-invocation.mjs` - validates runtime-to-skill handoffs against the canonical 15-skill registry and never grants execution authority.

A live smoke test has passed against the active Chrome target: CDP connection, snapshot capture, evidence creation, snapshot diff, and `technical-seo` invocation validation all completed successfully.

## Stage 6 - Task State & Checkpoint Runtime

Stage 6 adds durable task state so a planned or active run can be paused, validated, and resumed without reconstructing execution context from memory.

Runtime flow:

TASK -> RUN CREATED -> ROUTE -> SKILL CHAIN -> SESSION -> OBSERVE -> EVIDENCE -> CHECKPOINT -> PAUSE/FAIL -> RESUME -> VALIDATE -> CONTINUE -> COMPLETE

Implemented modules:

- `task-state.mjs` - versioned lifecycle state, deterministic transition rules, atomic JSON persistence, checkpoint creation, checkpoint integrity verification, and resume validation.
- `handoff-contract.mjs` - hash-bound skill handoff records bound to a task, destination skill, evidence IDs, and checkpoint revision.
- `task-state-smoke.mjs` - verifies create/run/checkpoint/pause/resume and handoff validation end-to-end.

Stage 6 invariants:

1. Every resumable run has a stable `task_id` and monotonically increasing checkpoint revision.
2. Invalid lifecycle transitions fail closed.
3. Checkpoints are integrity-checked before resume.
4. Resume is allowed only from `PAUSED` or `FAILED` state.
5. Handoffs are task-bound and evidence-aware; validation does not grant execution authority.
6. State persistence uses write-then-rename to avoid exposing partial checkpoint files.
7. State recovery does not bypass browser security, authentication, release gates, or human handoff requirements.

## Stage 7 - Adversarial Verification Runtime

Stage 7 adds a fail-closed verification layer between runtime state and continued execution. Verification independently challenges evidence integrity, checkpoint integrity, state/evidence consistency, skill handoffs, and skill invocation authority.

Implemented modules:

- `adversarial-verifier.mjs` - produces a versioned verification report with `PASS` or `BLOCKED` status and explicit findings.
- `adversarial-smoke.mjs` - proves a clean run can continue and a tampered handoff is blocked.

Stage 7 invariants:

1. Verification is independent of the producer that created the evidence or handoff.
2. Missing, duplicate, incomplete, or tampered evidence blocks continuation.
3. Invalid checkpoint integrity or state/evidence references block continuation.
4. Invalid task-bound handoffs block continuation.
5. Invalid skill invocations block continuation.
6. `canContinue()` returns true only for a clean `PASS` report with no blocking findings.
7. Adversarial verification does not grant execution authority; it only determines whether the runtime may proceed to the next controlled boundary.

The Stage 7 smoke test passes with zero findings for the clean fixture and blocks a deliberately tampered handoff with `H001`.


## Stage 8 - Production Runtime / Execution Orchestrator

Stage 8 composes the Stage 5–7 runtime adapters into one controlled execution loop. It owns task creation, lifecycle transitions, skill invocation, evidence persistence, skill handoffs, checkpoints, adversarial verification, and terminal completion/failure states.

Runtime flow:

TASK -> CREATE RUN -> RUNNING -> SKILL INVOCATION -> EXECUTE -> EVIDENCE -> HANDOFF -> CHECKPOINT -> ADVERSARIAL VERIFY -> CONTINUE/FAIL -> COMPLETE

Implemented modules:

- `execution-orchestrator.mjs` - production-oriented orchestration boundary composing task state, evidence ledger, skill invocation, handoff validation, and adversarial verification.
- `execution-orchestrator-smoke.mjs` - end-to-end deterministic smoke test over a two-skill chain.

Stage 8 invariants:

1. The orchestrator never treats routing as authorization.
2. Every skill step produces a checkpoint and task-bound handoff before the next step.
3. Evidence and state are persisted during the run, not only at terminal completion.
4. Skill handlers are dependency-injected; absent handlers execute only a non-authoritative validation/dry-run path.
5. Adversarial verification is mandatory before `COMPLETED`.
6. Verification failure transitions the run to `FAILED` and blocks completion.
7. Browser security, authentication, release gates, and human handoff remain explicit boundaries.

Stage 8 smoke test passes: `COMPLETED`, revision `3`, three checkpoints, two handoffs, and adversarial verification `PASS`.


## Stage 9 - Real Skill Execution Bridge

Stage 9 connects the production orchestrator to the canonical skill installations in `.agents/skills` and `.claude/skills` without turning a `SKILL.md` into an authorization primitive.

Implemented modules:

- `skill-execution-bridge.mjs` - resolves canonical skill installations, loads `SKILL.md`, exposes controlled execution through dependency-injected handlers, and enforces execution timeouts.
- `skill-bridge-smoke.mjs` - verifies canonical skill resolution and both unbound and bound execution paths.
- `execution-orchestrator.mjs` - now routes each skill step through the bridge before evidence/checkpoint/handoff processing.

Stage 9 invariants:

1. Only skills present in the canonical `.agents/skills` or `.claude/skills` roots can be resolved.
2. Loading a `SKILL.md` does not itself grant execution authority.
3. Unbound skills remain `UNBOUND` and cannot perform side effects.
4. Bound handlers receive explicit context and an abort signal for timeout control.
5. Skill failures remain isolated to the current task and transition the run to `FAILED`.
6. Existing evidence, checkpoint, handoff, and adversarial verification gates remain mandatory.
7. The bridge does not bypass authentication, browser security, release gates, or human handoff requirements.

Stage 9 smoke test passes against the installed `technical-seo` skill: canonical resolution succeeded, unbound mode remained non-authoritative, and a controlled bound handler executed successfully.


## Stage 10 - Capability / Policy Enforcement Runtime

Stage 10 adds a pre-execution policy boundary. A skill must receive only explicitly requested and granted capabilities, and policy is evaluated before the execution handler is invoked.

Implemented modules:

- `policy-enforcer.mjs` - canonical skill-to-capability requirements, capability validation, escalation detection, security-approval enforcement, and release-gate ownership checks.
- `execution-orchestrator.mjs` - evaluates and asserts policy before every skill execution.
- `policy-enforcer-smoke.mjs` - verifies a valid grant, capability escalation blocking, and security-approval blocking.

Stage 10 invariants:

1. Unknown capabilities fail closed.
2. Required skill capabilities must be explicitly granted before execution.
3. Unrequested capability escalation is blocked.
4. Security-boundary capability requires explicit human approval.
5. Release-gate authority remains owned by `seo-quality-gate`.
6. Policy failure occurs before the skill handler is invoked.
7. Stage 6–9 state, evidence, checkpoint, handoff, and adversarial controls remain mandatory.

Stage 10 smoke passes: valid `technical-seo` capability grants return `PASS`; escalation and unapproved security capability return `BLOCKED`.


## Stage 11 - Release Gate & Transaction Safety Runtime

Stage 11 introduces a controlled mutation boundary for production-affecting operations. Mutations must pass preflight, optional human approval, execution, post-execution verification, and commit; verification or execution failure triggers rollback. Every transaction emits a hash-chained audit trail.

Implemented modules:

- `release-transaction.mjs` - transaction state machine, preflight gate, human-approval gate, execute/verify/commit flow, rollback handling, and append-only hash-chained audit trail.
- `release-transaction-smoke.mjs` - verifies successful commit, verification-triggered rollback, approval-triggered rollback, and audit-chain integrity.

Stage 11 invariants:

1. No production mutation occurs before preflight passes.
2. Explicit human approval is required when a transaction declares it.
3. Commit occurs only after post-execution verification returns `PASS`.
4. Verification failure triggers rollback; rollback failure becomes terminal `FAILED`.
5. Audit records are hash-chained and independently verifiable.
6. Transaction IDs bind the audit sequence to task and operation context.
7. Stage 10 capability policy remains a prerequisite; Stage 11 does not grant capabilities.
8. Browser security, authentication, and release ownership remain explicit boundaries.

Stage 11 smoke passes: one transaction `COMMITTED`, one verification failure `ROLLED_BACK`, one missing approval `ROLLED_BACK`, and the audit chain verifies successfully across 10 events.


## Stage 12 - Observability, Audit Intelligence & Runtime Recovery

Stage 12 adds a structured runtime event stream, failure taxonomy, health summarization, replayable event selection, and checkpoint-aware recovery planning across the Stage 5–11 runtime.

Implemented modules:

- `observability.mjs` - append-only structured runtime events, event hashing, failure taxonomy, health summaries, and replayable-event extraction.
- `recovery.mjs` - validates the latest checkpoint and produces a deterministic recovery/replay plan without granting new execution authority.
- `observability-recovery-smoke.mjs` - verifies event capture, failure classification, health reporting, and checkpoint recovery planning.

Stage 12 invariants:

1. Runtime events are structured, sequenced, and hash-bound to their event payload.
2. Failures use a stable taxonomy: policy, invocation, execution, evidence, handoff, verification, transaction, recovery, or system.
3. Any classified failure degrades the runtime health summary until explicitly resolved by later operational logic.
4. Recovery requires a valid checkpoint; missing or invalid checkpoints fail closed.
5. Replay selects only safe state-transition evidence and does not itself execute mutations.
6. Recovery planning does not grant capabilities or bypass policy, verification, approval, or release gates.
7. Existing transaction audit trails remain authoritative for mutation commit/rollback history.

Stage 12 smoke passes: three structured events captured, one verification failure classified, health reported `DEGRADED`, and a valid checkpoint produced a `READY` recovery plan from the recorded execution cursor.


## Stage 13 - Runtime Control Plane

Stage 13 adds a unified control-plane surface over runtime state, events, recovery, policy evaluation, and release transactions. It is an inspection and controlled-action boundary; it does not create new execution authority.

Implemented modules:

- `control-plane.mjs` - run inspection, scoped/global health, checkpoint-aware recovery planning, policy evaluation, controlled resume, and transaction delegation.
- `control-plane-smoke.mjs` - verifies run inspection, checkpoint integrity visibility, health reporting, and recovery readiness.

Stage 13 invariants:

1. Control-plane inspection is read-only with respect to task execution state.
2. Recovery is allowed only when a valid checkpoint exists.
3. Resume delegates to the existing orchestrator rather than executing skills directly.
4. Policy decisions are delegated to the Stage 10 policy engine.
5. Transactions are delegated to the Stage 11 transaction boundary.
6. Control-plane actions do not bypass capability, adversarial verification, human approval, or release gates.
7. The control plane can report degraded/healthy runtime state without converting health into execution authority.

Stage 13 smoke passes: paused run inspection reports a valid checkpoint, scoped health is `HEALTHY`, and recovery planning returns `READY` from the recorded execution cursor.


## Stage 14 - Multi-Run Scheduler & Concurrency Control

Stage 14 adds controlled scheduling for multiple runtime tasks. Jobs are priority ordered, bounded by a concurrency limit, protected by resource leases, and cancellable before execution. Scheduler execution delegates to the existing orchestrator and therefore cannot bypass Stage 10–13 policy, verification, transaction, or recovery boundaries.

Implemented modules:

- `scheduler.mjs` - priority queue, bounded concurrency, resource lease manager, cancellation, job lifecycle, and scheduler events.
- `scheduler-smoke.mjs` - verifies priority ordering, concurrency, resource-conflict serialization, cancellation, and completion states.

Stage 14 invariants:

1. Scheduler concurrency is explicitly bounded.
2. Resource-conflicting jobs cannot hold the same lease simultaneously.
3. Resource acquisition is deterministic by sorted resource names.
4. Queued cancellation prevents execution; running cancellation is represented as a request and remains governed by the orchestrator.
5. Scheduler never executes skills directly; it delegates to the existing orchestrator.
6. Scheduler failure does not grant capabilities or bypass policy/release gates.
7. Lease release occurs on every terminal path, including execution errors.

Stage 14 smoke passes: four jobs reached terminal states, three completed, one was cancelled, high-priority execution preceded the lower-priority browser-conflicting job, and an independent resource ran in parallel under a concurrency limit of two.

## Stage 15 - Distributed Worker Isolation, Lease Fencing & Crash Recovery

Stage 15 establishes an execution boundary between the runtime scheduler and the worker that carries an orchestrated task. The scheduler remains the authority for queueing and concurrency, while workers receive explicit, time-bounded ownership leases.

### Worker model

`WorkerRegistry` tracks worker identity and lifecycle:

- `IDLE` - available for assignment.
- `LEASED` - ownership assigned but execution has not started.
- `RUNNING` - executing through the existing orchestrator boundary.
- `DRAINING` - reserved for future graceful shutdown semantics.
- `DEAD` - unavailable until explicitly re-registered.

Workers never invoke skills directly. The worker executes only through the existing orchestrator, preserving policy enforcement, evidence, verification, handoff, and release-gate controls.

### Lease and fencing invariants

Every worker assignment receives:

- `leaseId` - unique ownership instance.
- `taskId` - execution identity.
- `fencingToken` - monotonically increasing ownership generation.
- `leaseExpiresAt` - time-bounded ownership.
- heartbeat timestamp.

A worker may heartbeat or release only while all ownership fields still match. A stale worker therefore cannot regain authority after its lease has been reclaimed.

Reassignment advances the fencing generation. This prevents a crashed or partitioned worker from being treated as the current owner after another worker has taken over the task.

### Crash and stale-lease recovery

When a worker lease expires, the registry reclaims the assignment and returns the worker to `IDLE`. A replacement assignment receives a new fencing token. The old ownership token is rejected fail-closed.

This Stage intentionally separates **resource locks** from **execution ownership**:

`ResourceLeaseManager` protects shared runtime resources; `WorkerRegistry` protects the identity of the executor.

Both must succeed before a scheduler job enters `LEASED`.

### Heartbeat

Running workers refresh their lease periodically. Heartbeats are ownership-authenticated and cannot extend a lease belonging to a different generation. The worker pool stops heartbeats when execution completes or fails.

### Duplicate-execution invariant

A stale execution cannot be considered authoritative merely because its process continues running. Before ownership-sensitive worker operations, the current lease identity and fencing token must match the registry state.

Stage 15 therefore establishes:

`Scheduler -> Resource Lease -> Worker Lease/Fencing -> Orchestrator -> Skill Execution`

No worker layer bypasses the existing policy, evidence, verification, transaction, or release-gate runtime.

### Verification

Stage 15 smoke coverage verifies:

1. two workers can receive distinct simultaneous ownership.
2. an expired worker lease is reclaimed.
3. a stale ownership token is rejected.
4. reassignment advances the fencing token.
5. replacement execution completes exactly once.
6. all workers return to `IDLE` after execution.
7. the existing Stage 14 scheduler smoke remains passing with worker isolation enabled.

## Stage 16 - Persistent Distributed State, Durable Job Queue & Worker Recovery

Stage 16 moves scheduler state from process memory toward a durable, restart-safe control boundary.

### Durable Job Journal

- Jobs are persisted as append-only NDJSON events.
- Each event carries sequence, timestamp, job snapshot, previous hash, and SHA-256 event hash.
- Journal replay fails closed on sequence gaps or broken hash chaining.
- Terminal states (`COMPLETED`, `FAILED`, `CANCELLED`) remain terminal across restart.

### Restart Recovery

- Non-terminal jobs found during replay are reconstructed as `QUEUED`.
- Previous worker/resource ownership is discarded; stale ownership is never resumed implicitly.
- `recoveryCount` increments on each restart recovery for operational visibility.
- Rehydration uses the scheduler's explicit `restore()` boundary rather than direct skill execution.

### Durable Queue / Execution Boundary

`Durable Job Journal -> Scheduler Restore -> Resource Lease -> Worker Lease/Fencing -> Orchestrator -> Skill Execution`

The durable layer records lifecycle evidence but does not grant additional skill authority. Scheduler concurrency/resource isolation and worker fencing remain active after recovery.

### Duplicate-Execution Safety

Stage 16 provides durable **commit-state continuity**, not a claim of exactly-once physical execution. A crash can occur after an external side effect and before a terminal journal event; therefore side-effecting release paths remain idempotent and transactionally guarded by the existing release-transaction layer. Recovered work receives fresh worker ownership and fencing.

### Verification

1. durable job journal survives scheduler reconstruction.
2. journal hash-chain integrity is verified during replay.
3. non-terminal work is requeued after restart.
4. terminal work remains terminal after restart.
5. recovery count is persisted/observable.
6. recovered work receives a fresh worker fencing token.
7. Stage 15 stale-token smoke remains passing.
8. Stage 14 scheduler concurrency/resource-conflict smoke remains passing.
9. Stage 16 crash/restart smoke passes.
10. `git diff --check` passes.

## Stage 17 - Distributed Commit Coordination, Idempotency Ledger & Exactly-Once Commit

Stage 17 adds a durable commit boundary for side-effecting release operations. It guarantees idempotent **commit state** under replay; it does not claim exactly-once physical execution of arbitrary external systems.

### Commit Coordinator

- `DistributedCommitCoordinator` sits between successful verification and the final runtime commit record.
- Every coordinated commit requires an explicit idempotency key and worker fencing context.
- A committed idempotency key is replayed as the existing committed result without executing the side effect again.
- A conflicting reservation cannot take over a live reserved key.

### Idempotency Ledger

- Append-only NDJSON ledger with sequence numbers and SHA-256 hash chaining.
- States: `RESERVED`, `COMMITTED`, `ABORTED`.
- Replay reconstructs the latest state per idempotency key.
- Integrity failures fail closed.
- The ledger survives process reconstruction and can be independently verified.

### Release Transaction Integration

`Preflight -> Approval -> Reserve Idempotency Key -> Execute -> Verify -> Commit Coordinator -> Audit Commit`

The release transaction remains the authority for rollback and release-state transitions. The coordinator prevents duplicate committed side effects from being executed again when the same idempotency key is replayed.

### Exactly-Once Boundary

The runtime now provides exactly-once **logical commit** for a given durable idempotency key: repeated commit attempts resolve to the same committed record and do not invoke the physical adapter again. This must not be interpreted as exactly-once delivery to an external API unless that external API participates in a compatible idempotency/transaction protocol.

### Verification

1. first coordinated transaction commits.
2. identical replay returns the prior committed result.
3. replay executes the physical adapter only once.
4. cross-process-style reconstruction reads the same committed key from the ledger.
5. ledger hash-chain integrity verifies.
6. Stage 11 release-transaction smoke remains passing.
7. Stage 16 durable recovery smoke remains passing.
8. Stage 15 worker fencing smoke remains passing.
9. Stage 14 scheduler smoke remains passing.
10. `git diff --check` passes.

## Stage 18 - Event-Sourced Runtime, Deterministic Replay & Time-Travel Debugging

Stage 18 establishes an append-only runtime event model that can reconstruct execution state without trusting mutable in-memory state.

### Event-Sourced Runtime

- Runtime events are typed and sequence-numbered.
- Each event carries a deterministic logical clock, run identity, payload, previous hash, and SHA-256 event hash.
- Hash-chain verification fails closed on sequence gaps, mutation, or ordering corruption.
- Runtime state is derived by a pure reducer rather than persisted as the authoritative execution truth.

### Deterministic Replay

- The same ordered event stream plus the same initial state produces the same reconstructed state hash.
- Replay is bounded by sequence number, allowing historical reconstruction.
- Recovery rebuilds the in-memory cursor from the durable event stream before accepting new events.
- Logical time is monotonic and independent of wall-clock time, making replay semantics stable.

### Time Travel

`timeTravel(sequence)` reconstructs the runtime state exactly as it existed at that event boundary.

This supports historical gate inspection, route/skill execution inspection, evidence/checkpoint reconstruction, commit/rollback boundary inspection, and post-failure forensic analysis.

Time travel is read-only; it never grants authority to mutate historical state or bypass current policy/release gates.

### Architecture

`Durable Events -> Integrity Verification -> Deterministic Reducer -> Reconstructed State -> Current Runtime`

The event-sourced layer complements, rather than replaces, the existing task-state, scheduler, worker-fencing, evidence, policy, and transaction layers.

### Verification

1. event stream persists across runtime reconstruction.
2. event hash-chain integrity verifies.
3. deterministic replay produces the same state hash.
4. replay can stop at an earlier sequence.
5. historical state differs correctly before later commit events.
6. logical time remains monotonic.
7. Stage 17 idempotent commit smoke remains passing.
8. Stage 16 durable recovery smoke remains passing.
9. Stage 15 worker fencing smoke remains passing.
10. Stage 14 scheduler smoke remains passing.
11. `git diff --check` passes.

## Stage 19 - Runtime Snapshotting, Event Compaction & Merkle State Verification

Stage 19 adds cryptographic runtime snapshots so long event histories can be restored from a verified state checkpoint plus a bounded event tail.

### Runtime Snapshot Store

- Snapshots persist reconstructed runtime state at an event sequence.
- Each snapshot contains a state hash and a previous-snapshot hash, forming a snapshot chain.
- Snapshot integrity is independently verifiable without trusting the live runtime.
- Restore starts from the latest verified snapshot and replays only events after its sequence.

### Event Compaction

- Compaction creates a new snapshot at the current event boundary.
- Historical event data remains the authoritative audit/replay source; compaction does not grant permission to delete evidence.
- Multiple snapshots may coexist, allowing forensic recovery from earlier boundaries.

### Merkle State Verification

- Runtime state can be represented as deterministic key/value leaves.
- Leaves are sorted before Merkle construction.
- Pairwise SHA-256 reduction produces a deterministic state root.
- The Merkle root provides a compact integrity fingerprint for reconstructed state.

### Architecture

`Event Stream -> Verified Snapshot -> Event Tail Replay -> Runtime State -> Merkle Root`

Snapshotting is an optimization and integrity layer. It does not replace event verification, worker fencing, policy enforcement, evidence validation, or release transaction controls.

### Verification

1. snapshot persists reconstructed state at a known sequence.
2. snapshot hash-chain integrity verifies.
3. compaction creates a current snapshot.
4. restore reconstructs the same final lifecycle from snapshot plus event tail.
5. state Merkle root is deterministic.
6. Stage 18 deterministic replay remains passing.
7. Stage 17 idempotent commit remains passing.
8. Stage 16 durable recovery remains passing.
9. Stage 15 worker fencing remains passing.
10. Stage 14 scheduler remains passing.
11. `git diff --check` passes.

## Stage 20 - Distributed Event Bus, Cross-Worker Streaming & Leader Coordination

Stage 20 adds a durable event-stream boundary and explicit leader lease so multiple runtime nodes can observe the same lifecycle without sharing mutable process memory.

### Distributed Event Bus

- `DurableEventBus` persists typed runtime events as an append-only hash-chained stream.
- Subscribers receive events by type and correlation identity without receiving execution authority.
- Consumers can replay events from a sequence boundary.
- Bus integrity verification fails closed on sequence gaps or hash-chain corruption.

### Cross-Worker Event Streaming

Worker lifecycle signals can be published as durable events (`JOB_CREATED`, `JOB_STARTED`, `JOB_COMPLETED`, etc.) and consumed independently by observability, recovery, control-plane, or audit components.

Event delivery is informational/control-plane synchronization; a subscriber cannot directly invoke a skill or bypass the orchestrator/policy/release layers.

### Leader Coordination

- `LeaderLeaseCoordinator` provides a node-scoped lease with term, lease ID, owner, and expiry.
- Competing nodes cannot acquire an unexpired lease.
- Stale leadership is rejected by lease identity and expiry checks.
- The current leader can renew its lease; leadership terms advance after takeover.
- Leader coordination is a fencing boundary, not a source of business or skill authority.

### Architecture

`Leader Lease -> Scheduler/Control Plane -> Durable Event Bus -> Workers -> Orchestrator -> Skills`

The existing worker fencing token remains the execution ownership boundary. The leader lease prevents competing control-plane coordinators from acting concurrently, while the worker token prevents stale workers from committing work.

### Verification

1. durable cross-worker events persist and replay.
2. event-bus hash integrity verifies.
3. typed subscriptions receive only matching lifecycle events.
4. competing leader acquisition is rejected while a lease is valid.
5. stale leader ownership is rejected.
6. leader renewal extends the valid lease.
7. Stage 19 snapshot/compaction smoke remains passing.
8. Stage 18 deterministic replay smoke remains passing.
9. Stage 17 idempotent commit smoke remains passing.
10. Stage 16 durable recovery smoke remains passing.
11. Stage 15 worker fencing smoke remains passing.
12. Stage 14 scheduler smoke remains passing.
13. `git diff --check` passes.
