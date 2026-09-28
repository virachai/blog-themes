# Cognitive Policy Proposal

Stage 45 is the controlled bridge from evidence eligibility into the policy system.

Every proposal carries explicit lineage:

`POLICY → proposal_eligibility_id → binding_id → knowledge_id`

Required proposal fields include:
- name;
- scope;
- condition;
- action;
- confidence;
- source;
- preconditions;
- rollback;
- evidence lineage.

A proposal remains `PROPOSED` until the existing policy lifecycle runtime explicitly activates it.
