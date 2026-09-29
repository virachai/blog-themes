# Stage 56 - Cognitive Provenance Chain Attestation Runtime

## Status

**Superseded by the Lean Cognitive Learning Commit Runtime v3.**

Stage 56 remains as historical governance documentation. Attestation is now part of the single learning commit authority.

## Current authority

`scripts/node/cognitive-learning-commit-runtime.mjs`

The v3 runtime records an attestation only after provenance integrity is verified and binds the provenance id, commit id, source digest, and chain.

Use:

```
node scripts/node/cognitive-learning-commit-runtime.mjs provenance <commit_id>
node scripts/node/cognitive-learning-commit-runtime.mjs audit
```

## Boundary

Do not recreate a standalone Stage 56 runtime. New attestation behavior belongs in the Lean Cognitive Learning Commit Runtime.
