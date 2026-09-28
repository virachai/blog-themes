# Cognitive Learning Commits

Stage 39 creates the explicit commit boundary for durable learning.

## Safety invariants

- A commit requires an existing Stage 38 feedback record.
- Belief updates are append-only versions.
- Confidence is bounded to 0..1.
- Lessons preserve the feedback source.
- Rollback creates a compensating version; it does not delete history.
- No policy activation or mission creation occurs here.

The source-of-truth trail is:

feedback -> commit -> belief/lesson version -> future retrieval and graph consolidation.
