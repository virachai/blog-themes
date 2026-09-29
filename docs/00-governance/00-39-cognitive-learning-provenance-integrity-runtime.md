# Stage 55 - Cognitive Learning Provenance Integrity Runtime

## Status

**Superseded by the Lean Cognitive Learning Commit Runtime v3.**

Stage 55 remains as historical governance documentation. Integrity verification is now part of the single learning commit authority.

## Current authority

`scripts/node/cognitive-learning-commit-runtime.mjs`

The v3 runtime resolves the complete provenance snapshot, computes a deterministic SHA-256 digest, and records baseline, verified, broken, or tamper-detected states.

Use:

```
node scripts/node/cognitive-learning-commit-runtime.mjs provenance <commit_id>
node scripts/node/cognitive-learning-commit-runtime.mjs audit
```

## Boundary

Do not recreate a standalone Stage 55 runtime. New integrity behavior belongs in the Lean Cognitive Learning Commit Runtime.
