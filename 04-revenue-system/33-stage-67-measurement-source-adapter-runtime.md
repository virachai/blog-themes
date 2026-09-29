# Stage 67 - Measurement Source Adapter & Evidence Capture Runtime

Stage 67 defines a **read-only measurement evidence boundary** for Stage 65. It accepts an operator-supplied observation from an authoritative source and validates provenance, timing, metric identity, and publication linkage before Stage 65 can consume it.

## Boundary

```text
Stage 66 READY_TO_MEASURE
  -> source evidence capture
  -> Stage 67 validation
  -> MEASUREMENT_EVIDENCE_READY
  -> Stage 65 outcome validation
```

The runtime does not fetch analytics, log in to third-party services, alter Blogger, or invent values.

## Commands

```bash
node scripts/node/measurement-source-adapter-runtime.mjs init <run_id>
node scripts/node/measurement-source-adapter-runtime.mjs validate <run_id>
```

`init` creates an empty capture contract. `validate` refuses incomplete, future-dated, wrong-metric, non-HTTPS, or unlinked evidence.

## Required evidence

- metric exactly matches `measurement-plan.json`
- observation date/time is present and not before publication
- source is HTTPS
- source identifies the measurement system/page used by the operator
- measured value and unit are present
- publication URL matches the authoritative receipt
- baseline and target are explicit
- evidence is marked operator-captured; runtime does not claim direct API access

## Safety

Stage 67 is read-side only. A valid capture is evidence, not a claim of causality or success. Stage 65 remains the final measurement gate.
