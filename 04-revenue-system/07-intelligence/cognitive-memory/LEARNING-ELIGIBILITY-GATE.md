# Cognitive Learning Eligibility Gate

Stage 51 separates **eligibility** from **learning mutation**.

The runtime checks attribution, feedback, and regression evidence before issuing `LEARNING_ELIGIBLE`.

`LEARNING_ELIGIBLE` is an authorization boundary for the next explicit learning commit. It is not itself a belief or lesson update.

Fail-closed conditions include missing attribution, non-eligible attribution, missing feedback, invalid feedback state, and regression blocks.
