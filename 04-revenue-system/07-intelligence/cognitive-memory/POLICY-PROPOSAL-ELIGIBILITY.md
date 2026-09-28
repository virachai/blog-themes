# Policy Proposal Eligibility

Stage 44 separates evidence lineage from permission to enter the policy proposal lifecycle.

`EVIDENCE_BOUND → CANDIDATE → PROPOSAL_ELIGIBLE`

Required upstream state:
- Stage 43 evidence binding;
- `EVIDENCE_BOUND` gate;
- explicit reviewer assessment;
- explicit approval.

A `PROPOSAL_ELIGIBLE` record is not a policy and cannot activate a policy. It is a gate result that a downstream policy-proposal runtime may consume.
