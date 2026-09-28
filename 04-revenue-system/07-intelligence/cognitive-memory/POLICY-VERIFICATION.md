# Policy Adversarial Verification

Stage 46 tests a policy proposal before activation.

Required lineage:

`policy → proposal eligibility → evidence binding → knowledge`

Required operational fields:
- condition;
- action;
- rollback.

Results:
- `VERIFIED` with `PASS`;
- `REGRESSION_FLAG` with `BLOCK`.

A BLOCK is fail-closed. The runtime does not automatically repair, mutate, or activate the proposal.
