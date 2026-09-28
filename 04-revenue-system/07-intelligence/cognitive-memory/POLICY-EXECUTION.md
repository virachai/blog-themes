# Cognitive Policy Execution & Outcome Measurement

Stage 37 turns an explicitly ACTIVE policy into auditable execution and outcome records.

## Sources

- Stage 35: `policies.jsonl`
- Stage 36: `policy-events.jsonl`
- Stage 37: `policy-executions.jsonl`, `policy-outcomes.jsonl`

## Safety invariants

- Only ACTIVE policies can execute.
- Every execution records the policy version and context.
- Outcomes are observed records, not inferred success claims.
- No automatic policy activation.
- No automatic policy edits.
- No automatic belief updates.
- No mission creation.

The resulting evidence can later be consumed by the cognitive evaluation and learning runtimes.
