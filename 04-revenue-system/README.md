# Meefunblog Revenue System — Manual Mode

A six-layer, human-runnable operating system for turning blog assets into measurable revenue.

**No AI agent is required.** Every layer is file-based, inspectable, and executable with ordinary Node commands and a text editor.

## Six layers

| Layer | Purpose | Primary artifact |
| :-- | :-- | :-- |
| 01 Discovery | Find opportunities worth testing | opportunity |
| 02 Asset Factory | Turn an opportunity into a publishable asset | asset |
| 03 Distribution | Publish and distribute the asset | distribution run |
| 04 Monetization | Attach a revenue mechanism | monetization plan |
| 05 Measurement | Record traffic, conversion and revenue | metric snapshot |
| 06 Optimization | Decide keep / improve / stop / expand | experiment decision |

## Operating loop

`Discovery → Asset → Distribution → Monetization → Measurement → Optimization → Discovery`

The system is intentionally **manual-first**:

1. Edit the templates in this directory.
2. Run the CLI checks.
3. Publish using your normal Blogger/GitHub workflow.
4. Record measured outcomes.
5. Make the next decision from evidence.

AI can later assist with individual steps, but it is not a runtime dependency.

## CLI

From the repository root:

```bash
node scripts/node/revenue-system.mjs status
node scripts/node/revenue-system.mjs check
node scripts/node/revenue-system.mjs next
node scripts/node/revenue-system.mjs dashboard
node scripts/node/editorial-production-loop-runtime.mjs check <run_id>
node scripts/node/editorial-production-loop-runtime.mjs prepare <run_id>
```

Stage 58 connects the six execution layers and intelligence runtime into a resumable production loop. Stage 59 adds the execution adapter for preflight, evidence, and CDP target verification. Stage 60 wraps publication attempts in an approval-gated transaction boundary with idempotency, verification, rollback, and evidence. Stage 61 binds that boundary to a Blogger-specific CDP adapter with UI intent verification and post-publish receipt creation. See [23-stage-58-editorial-production-loop.md](23-stage-58-editorial-production-loop.md), [24-stage-59-production-execution-adapter.md](24-stage-59-production-execution-adapter.md), [25-stage-60-publication-transaction-runtime.md](25-stage-60-publication-transaction-runtime.md), and [26-stage-61-blogger-publication-adapter.md](26-stage-61-blogger-publication-adapter.md). Stage 62 adds an Email-to-Blogger transport that separates SMTP delivery from publication proof. See [27-stage-62-email-to-blogger-publication-transport.md](27-stage-62-email-to-blogger-publication-transport.md).

## Rules

- Never treat traffic as revenue. Revenue must be recorded from the actual monetization source.
- Never publish a large batch without a measurable hypothesis.
- Every experiment gets an owner, start date, success metric, and stop condition.
- Keep credentials and secrets outside this repository.
- Prefer small reversible tests over irreversible bulk changes.
