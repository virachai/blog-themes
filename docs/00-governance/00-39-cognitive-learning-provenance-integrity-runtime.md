# Stage 55 - Cognitive Learning Provenance Integrity & Tamper Detection Runtime

## Purpose
Continuously verify that Stage 54 provenance records still resolve to the same append-only learning lineage, and detect post-build drift or tampering.

## Integrity contract
For each Stage 54 provenance record, verify the learning commit, feedback/execution lineage, Stage 51 eligibility gate, Stage 50 attribution, referenced outcomes, bound evidence, and canonical chain. A deterministic SHA-256 digest is computed from the resolved source snapshot.

## Tamper detection
The first check establishes a baseline digest. Later checks compare the fresh digest with the latest integrity record. Unchanged valid lineage is INTEGRITY_VERIFIED; changed source state is TAMPER_DETECTED; missing/inconsistent lineage is PROVENANCE_BROKEN. All records are append-only and source ledgers are never mutated.

## CLI
node scripts/node/cognitive-learning-provenance-integrity-runtime.mjs init
node scripts/node/cognitive-learning-provenance-integrity-runtime.mjs status
node scripts/node/cognitive-learning-provenance-integrity-runtime.mjs check <provenance_id>
node scripts/node/cognitive-learning-provenance-integrity-runtime.mjs audit
node scripts/node/cognitive-learning-provenance-integrity-runtime.mjs review [id]

## Authority
Verification and tamper detection only. No learning commits, belief updates, policy edits/activation, or mission creation.
