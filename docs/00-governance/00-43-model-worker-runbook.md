# Model Worker Runbook

## Purpose

Run one model-bound worker continuously against its own task queue.

Architecture:

```
TASK
  ↓
ROUTER
  ↓
registry.yaml
  ↓
.agent-tasks/<model>/queued/
  ↓
worker-loop.sh
  ↓
model-worker.mjs
  ↓
RESULT → EVIDENCE → VERIFY
```

## Preconditions

1. Read:
   - `docs/00-governance/00-42-agent-protocol-contract.md`
   - `docs/00-governance/00-03-sovereign-agent-enterprise-protocol.md`
   - `memory/MEMORY.md`
   - `memory/ACTIVE.md`
2. Confirm the model exists in `.agent-tasks/registry.yaml`.
3. Confirm the required CLI is installed and authenticated without printing secrets.
4. Confirm the task is already routed into the model's `queued/` directory.

## Start

From repository root:

```bash
chmod +x scripts/worker-loop.sh
MODEL_ID=gemini-3.1-flash-lite ./scripts/worker-loop.sh
```

The loop polls every 15 seconds by default.

Optional controls:

```bash
POLL_SECONDS=5 MODEL_ID=gemini-3.1-flash-lite ./scripts/worker-loop.sh
MAX_TASKS=1 MODEL_ID=gemini-3.1-flash-lite ./scripts/worker-loop.sh
```

## Stop

Foreground worker:

```
Ctrl-C
```

The worker does not auto-retry failed/interrupted tasks.

## Observe

Check the model queue:

```bash
find .agent-tasks/gemini-3.1-flash-lite -maxdepth 2 -type f -print
```

Execution logs are under the model's `logs/` directory.

## Safety rules

- `MODEL_ID` selects a registered model; it does not grant new capabilities.
- Registry policy is authoritative for allowed capabilities and execution limits.
- Never place secrets in task files or logs.
- Do not manually move a task from `running/` unless recovering from an explicitly verified interruption.
- Do not enable automatic retry without a separate policy decision.
- A task is not complete merely because the model process exited successfully; inspect evidence and acceptance criteria.
- The worker must not create follow-up tasks for itself.

## Recovery

If a process is interrupted, inspect:

```bash
find .agent-tasks/<model>/running -maxdepth 1 -type f -print
```

Treat remaining `running/` tasks as unresolved. Verify their execution evidence before deciding whether to recover or re-queue them.

## Verification

Before committing worker changes:

```bash
node --check scripts/node/model-worker.mjs
node --check scripts/node/model-registry.mjs
node scripts/node/build-index.mjs
node scripts/node/build-index.mjs --check
```

Expected final result:

```
STRUCTURE-CHECK: PASS
```
