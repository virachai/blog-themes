# Value Mission Template

A value mission is an executable decision record, not a content request.

## Runtime

Run:

    node scripts/node/value-mission-runtime.mjs run <mission_id>

The runtime validates the mission and creates an auditable run package under 04-revenue-system/07-intelligence/runs/<run_id>.

It may prepare deterministic artifacts, but it must not fabricate research, analytics, publication results, monetization results, or causal conclusions.

## Gates

1. Mission gate - required fields and value path are valid.
2. Evidence gate - real sources/observations must be recorded.
3. Asset gate - an actual useful asset must exist.
4. Release gate - publication requires explicit approval or a trusted adapter.
5. Measurement gate - outcome data must exist for the observation window.
6. Learning gate - only measured evidence may create durable learning.

A blocked gate stops downstream claims rather than silently passing them.