# Stage 57 - Cognitive Provenance Attestation Enforcement Runtime

## Purpose
Enforce Stage 56 attestation as the downstream usability gate for Stage 54 learning provenance.

## Contract
A provenance chain is downstream-authorized only when its latest Stage 56 attestation is ATTESTED / PASS and the attestation commit lineage matches the provenance commit. Otherwise it is fail-closed as DOWNSTREAM_BLOCKED.

Stage 57 records enforcement decisions only. It does not mutate learning commits, beliefs, policies, or missions.

## CLI
node scripts/node/cognitive-provenance-attestation-enforcement-runtime.mjs init
node scripts/node/cognitive-provenance-attestation-enforcement-runtime.mjs status
node scripts/node/cognitive-provenance-attestation-enforcement-runtime.mjs check <provenance_id>
node scripts/node/cognitive-provenance-attestation-enforcement-runtime.mjs audit
node scripts/node/cognitive-provenance-attestation-enforcement-runtime.mjs review [id]

## Ledger
learning-provenance-enforcement.jsonl
