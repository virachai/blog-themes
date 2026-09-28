# Cognitive Policy Lifecycle

Stage 36 operationalizes explicit policy lifecycle state while preserving append-only provenance.

## Sources

- `policies.jsonl` — Stage 35 policy proposals.
- `policy-events.jsonl` — Stage 36 lifecycle events.

## State model

`PROPOSED` → `ACTIVE` → `SUSPENDED` → `ACTIVE`
  
Any lifecycle state may transition to `RETIRED` through an explicit retire command. Active or suspended policies may be rolled back to `PROPOSED`.

## Safety invariants

- No automatic activation.
- No source-policy mutation.
- No automatic belief updates.
- No mission creation.
- Lifecycle changes are append-only events.
- Expired active policies fail closed as suspended when state is derived.
