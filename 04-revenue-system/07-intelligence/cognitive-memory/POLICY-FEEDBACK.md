# Cognitive Policy Feedback

Stage 38 closes the evidence loop from policy execution to reviewable learning feedback.

## Safety invariants

- Feedback requires a real execution and at least one recorded outcome.
- Feedback references the exact policy version.
- Feedback is a proposal, not an automatic belief update.
- Policy activation/editing remains outside Stage 38.
- Mission creation remains outside Stage 38.

## Learning loop

Observed outcome -> evaluation -> feedback proposal -> review -> downstream cognitive learning.
