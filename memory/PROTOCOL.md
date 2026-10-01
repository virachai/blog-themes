# Agent Unlock Protocol

This is the short startup/continuation protocol for local agents working in the Serena sandbox.

## Startup

1. Read `memory/MEMORY.md`.
2. Read `memory/ACTIVE.md`.
3. Read `memory/PRINCIPLES.md`.
4. Read only relevant durable memories and agent handoff files.
5. Inspect repository state before trusting stale notes.

## Compile the task

Write down internally:
- INTENT
- CONSTRAINTS
- AVAILABLE EVIDENCE
- AVAILABLE TOOLS
- ACCEPTANCE CRITERIA

Then choose the smallest execution path.

## Execute

- Prefer existing tools before adding dependencies.
- Prefer surgical changes over refactors.
- Use deterministic IF/THEN branches where practical.
- Keep sandbox boundaries intact.
- Never expose or persist secrets in shared memory.

## Verify

Before declaring success:

`RESULT -> EVIDENCE -> ACCEPTANCE -> AUDIT`

Mark claims:
- `VERIFIED:` directly supported by current evidence.
- `UNKNOWN:` not yet established.

Never convert UNKNOWN to VERIFIED by inference.

## Persist

Only persist knowledge that is:
- reusable by another agent;
- non-obvious;
- verified or explicitly marked uncertain;
- safe to share.

Use:
- `ACTIVE.md` for current WIP/handoff;
- `MEMORY.md` for durable index entries;
- dated lesson files for durable decisions;
- `agents/{agent-name}.md` for concise coordination.

## Async run handoff

- Use the repository-root `pending-runs/` directory as the execution-state queue for timeout-prone or asynchronous work.
- `mem:workspace/pending-runs` defines the queue protocol; it is not a second run-state store.
- Record a unique run ID and minimum safe state before launch; after timeout/unknown, leave the run pending/unknown rather than claiming completion.
- A continuation agent must inspect the recorded run before retrying and must not duplicate unrelated or historical runs.
- Mark the exact run done/failed/blocked only after current evidence supports the transition.

## Stop conditions

Stop instead of expanding scope when:
- the acceptance criteria are met;
- evidence is insufficient and no safe acquisition path exists;
- the proposed change does not improve one of the five PRISM-R metrics;
- the task requires access outside the sandbox that has not been explicitly provided.
