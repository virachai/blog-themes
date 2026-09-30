# Shared Memory Protocol

This directory is the **cross-agent source of truth** for this repository. Every agent that works in this repo must use the same protocol, regardless of agent/runtime/memory backend.

## 1. Read first

Before any non-trivial task:

1. Read `memory/MEMORY.md`.
2. Read `memory/ACTIVE.md`.
3. Follow relevant memory links from `MEMORY.md`.
4. Treat repository state and these shared files as shared state.

Required handoff command:

> Read shared memory first, then continue.

This means reading the repository `memory/` files above. It does **not** mean relying on an agent-local memory system.

## 2. Two memory layers

- **Shared memory:** `memory/MEMORY.md`, `memory/ACTIVE.md`, and linked lesson files in `memory/`. All agents must be able to read these.
- **Agent-local memory:** Serena/Gemini/etc. may have additional private or backend-specific memory. It is auxiliary only and must never be treated as shared state.
- A decision that another agent must know belongs in repository `memory/`.

## 3. Durable vs active state

- `MEMORY.md` = index of durable lessons and validated conventions. Do not put task transcripts or transient status here.
- `ACTIVE.md` = current WIP/handoff only. One block per open task; no history.
- Linked lesson files = durable, non-obvious decisions/conventions.
- When a task is complete, remove its WIP block from `ACTIVE.md`; preserve durable decisions in a lesson file only when they meet the memory threshold.

## 4. State and evidence

- Repository state wins over stale memory.
- If memory conflicts with repository state, inspect the repo and update `ACTIVE.md` accordingly.
- Mark uncertain claims `UNKNOWN:`.
- Mark only evidence-backed claims `VERIFIED:`.
- Never upgrade `UNKNOWN` to `VERIFIED` by inference.
- Do not store secrets, credentials, consent values, or unnecessary personal data.

## 5. Handoff discipline

For meaningful work, update `ACTIVE.md` with:

```
TASK:
OBJECTIVE:
CONSTRAINTS:
CURRENT STATE:
CHANGED SURFACES:
EVIDENCE:
OPEN RISKS:
ACCEPTANCE CRITERIA:
NEXT ACTION:
```

Keep it concise. No transcript.

## 6. Surgical execution

- Inspect actual gaps before changing code.
- Prefer the smallest safe change.
- Preserve existing decisions unless new evidence requires change.
- Do not refactor unrelated code.
- Do not commit unrelated changes.
- Before commit, verify the acceptance criteria and report what is VERIFIED vs UNKNOWN.

## 7. Agent interoperability

Any agent may update shared memory, but must write in the repository `memory/` layer so other agents can see it.

When asked to "read shared memory", the minimum contract is:

```
cat memory/MEMORY.md
cat memory/ACTIVE.md
```

Then inspect only linked/relevant lesson files.

## 8. Current task handoff

If a task is intentionally handed from one agent to another, put the exact current state and next action in `memory/ACTIVE.md`. The receiving agent should continue from that state rather than rediscovering prior decisions.
