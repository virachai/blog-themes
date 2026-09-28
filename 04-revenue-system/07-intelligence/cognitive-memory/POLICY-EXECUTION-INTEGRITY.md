# Cognitive Policy Execution Integrity

Stage 48 protects the boundary between a verified/activated policy and execution.

## Evidence chain

Policy Proposal → Adversarial Verification → Activation Gate → Execution Authorization → Version-bound Execution → Integrity Check → Outcome

The authorization ledger is append-only. Policy activation remains owned by Stage 36 and execution measurement remains owned by Stage 37.

## Fail-closed conditions

- inactive or expired policy
- activation gate not PASS
- missing verification lineage
- missing knowledge/evidence lineage
- policy version mismatch
- missing matching execution authorization

No failure silently degrades to execution.
