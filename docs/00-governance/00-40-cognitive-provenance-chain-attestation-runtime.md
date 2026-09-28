# Stage 56 — Cognitive Provenance Chain Attestation Runtime

## Purpose
Convert verified Stage 55 provenance integrity into an append-only attestation record.

## Contract
An attestation is allowed only when the latest Stage 55 integrity record for the provenance is PASS and has a valid source digest. The attestation binds the provenance id, commit id, chain and integrity digest, then hashes that payload with SHA-256.

## States
- ATTESTED: integrity verified and attestation recorded.
- ATTESTATION_BLOCKED: integrity is absent, invalid, or not PASS.

Stage 56 never mutates Stage 39–55 source ledgers and cannot create learning commits, update beliefs, edit/activate policies, or create missions.

## CLI
node scripts/node/cognitive-provenance-attestation-runtime.mjs init
node scripts/node/cognitive-provenance-attestation-runtime.mjs status
node scripts/node/cognitive-provenance-attestation-runtime.mjs attest <provenance_id>
node scripts/node/cognitive-provenance-attestation-runtime.mjs audit
node scripts/node/cognitive-provenance-attestation-runtime.mjs review [id]

## Ledger
learning-provenance-attestations.jsonl
