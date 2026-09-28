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
## Stage 5 — Runtime Integration

Stage 5 turns the v2 control plane into a capability-oriented runtime foundation. The runtime now has explicit adapters for browser sessions, observations, capability resolution, runtime planning, and evidence records.

Runtime flow:

TASK -> ROUTE -> CAPABILITY RESOLUTION -> SESSION -> OBSERVE -> EXECUTE -> TRACE -> EVIDENCE -> VALIDATE -> REPORT

Implemented runtime modules live under `.tmp/cdp/runtime/`:

- `session.mjs` — browser session state and navigation history.
- `observation.mjs` — normalized page observation and summaries.
- `capability.mjs` — canonical runtime capability resolution.
- `runtime-plan.mjs` — deterministic execution-phase plan with security boundaries.
- `evidence.mjs` — timestamped evidence records with SHA-256 content hashes.

`browser-trace` is the observability adapter. It remains read-only and is not the browser control plane.

Stage 5 establishes the runtime integration contract but does not grant autonomous authority. Browser security challenges require human handoff, authentication remains session-explicit, and planning does not bypass release gates. Future work may add persistent task state, live CDP session adapters, snapshot diffing, evidence ledgers, skill invocation adapters, and adversarial verification.

## Stage 5 Adapters

Stage 5 now includes four live-runtime adapters:

- `cdp-session.mjs` — connects to the active Chrome CDP target, evaluates page state, navigates, captures snapshots and screenshots.
- `evidence-ledger.mjs` — persists structured evidence records with stable IDs and content hashes.
- `snapshot-diff.mjs` — compares page snapshots by URL, title, readiness, text and HTML hashes/lengths.
- `skill-invocation.mjs` — validates runtime-to-skill handoffs against the canonical 15-skill registry and never grants execution authority.

A live smoke test has passed against the active Chrome target: CDP connection, snapshot capture, evidence creation, snapshot diff, and `technical-seo` invocation validation all completed successfully.
