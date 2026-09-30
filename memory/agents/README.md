# Shared Agent Workspace

This directory is the shared, file-based communication layer for agents working in this repository.

## File convention

Each agent uses one file named:

`memory/agents/{agent-name}.md`

Examples:

- `memory/agents/claude.md`
- `memory/agents/gemini.md`
- `memory/agents/codex.md`
- `memory/agents/local.md`

Use a stable agent name, not a session ID.

## Agent file contract

Keep the file concise and overwrite/update it rather than appending transcripts.

```md
# {Agent Name}

STATUS: IDLE | WORKING | BLOCKED | DONE
TASK:
OBJECTIVE:
CURRENT STATE:
CHANGED SURFACES:
EVIDENCE:
OPEN RISKS:
NEXT ACTION:
LAST UPDATED:
```

## Coordination rules

1. Read `memory/MEMORY.md` and `memory/ACTIVE.md` first.
2. Read relevant files under `memory/agents/` before taking over another agent's work.
3. Write current handoff/status to your own `{agent-name}.md` before stopping or handing off.
4. `memory/ACTIVE.md` remains the canonical task-level WIP/handoff record; agent files are the coordination layer, not a replacement for durable memory.
5. Repository state beats stale agent notes.
6. Do not use these files for secrets or credentials.
7. Do not paste chat transcripts; record only actionable state, evidence, risks, and next action.

## Minimal handoff

A receiving agent should be able to continue from:

- `memory/MEMORY.md`
- `memory/ACTIVE.md`
- relevant `memory/agents/{agent-name}.md`

No chat copy/paste should be required for normal handoff.
