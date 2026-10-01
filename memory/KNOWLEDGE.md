# Knowledge Topology

Use this map to decide where evidence belongs. Do not treat all context as the same kind of knowledge.

| Layer | Source | Use |
| :-- | :-- | :-- |
| Repository | source files, tests, config, git state | current implementation facts |
| Shared memory | `memory/` | durable decisions and active handoff |
| Agent coordination | `memory/agents/` | current per-agent state |
| Runtime | command/test output | reproducible execution evidence |
| Live web | Chrome/CDP or web research | current external observations |
| YouTube | transcript/CC/API | external knowledge source |
| User instruction | current conversation | intent and constraints |

## Evidence precedence

1. Current repository state beats stale memory.
2. Direct runtime/live evidence beats inference.
3. Explicit user constraints beat agent preferences.
4. Durable memory is useful context, not proof of current state.
5. External knowledge must retain its source/time context when it materially affects a decision.

## Knowledge promotion

`OBSERVED -> VERIFIED -> DURABLE`

- OBSERVED: directly seen but not yet sufficiently checked.
- VERIFIED: checked against the relevant acceptance condition.
- DURABLE: verified knowledge that is reusable across tasks.

Do not skip stages by assumption.

## Tool selection

IF the answer depends on current repository state -> inspect repo.

IF it depends on a live website -> use live browser/CDP or web evidence.

IF it depends on video content -> use transcript/CC before inventing a summary.

IF it is an implementation task -> use Serena's semantic/file tools and verify the result.

IF no evidence source can establish the claim -> mark UNKNOWN.
