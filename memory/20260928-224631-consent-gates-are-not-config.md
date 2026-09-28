---
name: consent-gates-are-not-config
description: Never set EMAIL_PUBLISH_CONFIRM or flip approval.status to APPROVED - consent gates must come from the owner, never from agent inference
metadata:
  pinned: true
---

The publication pipeline separates two kinds of setting that look alike in `.env` and in run artifacts, and the owner treats them very differently.

**Factual configuration** is the agent's to set when the value is already established: `BLOGGER_TARGET_ID` (which CDP tab to target), endpoints, ports. Setting it asserts nothing about intent.

**Consent gates** are not configuration and the agent must never set them. `EMAIL_PUBLISH_CONFIRM=YES` means "the operator consents to publish", and `release-candidate.json` → `approval.status: "APPROVED"` means a human approved the release. Both must originate from the owner. An agent may not flip `PENDING → APPROVED` from any inference — not from a user saying "publish this", not from the gates otherwise looking satisfied, not to unblock a test run.

On 2026-09-28 the owner was offered a choice whose description said the agent would set both `.env` values; the agent set only `BLOGGER_TARGET_ID` and left `EMAIL_PUBLISH_CONFIRM` commented out, explaining why. The owner confirmed this was correct and said explicitly: do not set `EMAIL_PUBLISH_CONFIRM=YES` while approval is pending, because in this architecture it is a consent gate rather than ordinary config.

The reason this matters beyond tidiness: the pipeline's whole value is that a stage cannot record more than it proved. If an agent writes the consent flag or the approval status, the resulting `PUBLISHED` record is indistinguishable from a genuinely approved one, and every downstream consumer — measurement, learning — treats it as real. Setting a consent gate to make a run proceed is the same class of failure as weakening a check to make it pass, which the owner has separately forbidden.

Practical consequence for future sessions: when a run is blocked on consent, report it as blocked and say exactly which values the owner must supply. Do not pre-fill them, do not comment them in as active, and do not treat the owner's instruction to "set it up" as authorization to set the consent half — ask, or set only the factual half and say what was left out and why.
