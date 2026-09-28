# Stage 36 — Cognitive Policy Activation & Lifecycle Runtime

Stage 36 is the explicit authority boundary between proposed decision policies and operational policy state.

## Lifecycle

PROPOSED -> ACTIVE -> SUSPENDED -> ACTIVE
                  |             |
                  +-> RETIRED <-+
                  +-> ROLLBACK -> PROPOSED

Activation is always explicit. The runtime never auto-activates a policy.

## Event-sourced contract

Stage 35 remains the authoritative source for policy proposals in `policies.jsonl`.
Stage 36 records lifecycle transitions in append-only `policy-events.jsonl`.

The current policy state is derived from:
1. the Stage 35 policy proposal;
2. ordered lifecycle events;
3. expiry metadata.

The proposal record is not rewritten during lifecycle transitions.

## Supported transitions

- `activate <id> [expires_at]` — explicit human-authorized activation; increments version.
- `suspend <id>` — pauses an active policy.
- `resume <id>` — resumes a suspended policy.
- `retire <id>` — permanently retires a policy.
- `rollback <id>` — returns an active/suspended policy to PROPOSED state.
- `evaluate` — exposes the currently active policy set without changing state.
- `review [id]` — derives lifecycle state for review.
- `status` — reports lifecycle counts and authority.

## Expiry

An active policy with an `expires_at` timestamp at or before the current time is reported as SUSPENDED. Expiry is fail-closed and does not mutate the event ledger.

## Authority boundary

Stage 36 may:
- activate a reviewed policy explicitly;
- suspend, resume, retire, or rollback lifecycle state;
- derive the current active policy set;
- record an immutable audit event.

Stage 36 may not:
- rewrite the underlying policy proposal;
- change beliefs automatically;
- create missions;
- silently activate policies;
- invent evidence or outcomes.

## CLI

node scripts/node/cognitive-policy-lifecycle-runtime.mjs init
node scripts/node/cognitive-policy-lifecycle-runtime.mjs status
node scripts/node/cognitive-policy-lifecycle-runtime.mjs activate <id> [expires_at]
node scripts/node/cognitive-policy-lifecycle-runtime.mjs suspend <id>
node scripts/node/cognitive-policy-lifecycle-runtime.mjs resume <id>
node scripts/node/cognitive-policy-lifecycle-runtime.mjs retire <id>
node scripts/node/cognitive-policy-lifecycle-runtime.mjs rollback <id>
node scripts/node/cognitive-policy-lifecycle-runtime.mjs review [id]
node scripts/node/cognitive-policy-lifecycle-runtime.mjs evaluate
