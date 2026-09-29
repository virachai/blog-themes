# Stage 50 - Cognitive Policy Outcome Attribution & Learning Integrity Runtime

Stage 50 determines whether an observed outcome has sufficient evidence to be attributed to the exact policy execution before learning is considered eligible.

## Flow

Execution → Outcome → Evidence → Attribution → Learning Eligibility → Feedback / Commit

## Runtime

`scripts/node/cognitive-policy-execution-runtime.mjs`

Ledger: `04-revenue-system/07-intelligence/cognitive-memory/policy-outcome-attributions.jsonl`

## Attribution levels

- `DIRECT` - explicit evidence supports attribution; confounder assessment required.
- `LIKELY` - evidence supports a probable relationship; confounder assessment required.
- `UNCERTAIN` - preserved for review but not learning-eligible.
- `NOT_ATTRIBUTABLE` - preserved as evidence but not learning-eligible.

## Invariants

- No outcome means no attribution.
- No bound evidence means no attribution pass.
- Direct/likely attribution requires explicit rationale and confounder assessment.
- Only PASS attribution becomes learning-eligible.
- Stage 50 never commits learning, edits policy, or updates beliefs.
