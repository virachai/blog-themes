# Node Scripts

- [build-index.mjs](build-index.mjs): regenerates every `INDEX.md`. With `--check` it changes nothing and fails on a missing README, a bad or duplicate number, or a stale index.
- [publication-evidence-check.mjs](publication-evidence-check.mjs): regression gate for the publication invariants - evidence hashes must vary with content, the Blogger editor is never a published post, a PUBLISHED claim needs a real external id, and the observer never writes a receipt. Run by CI and the pre-commit hook.
- [blogger-page-state.mjs](blogger-page-state.mjs): shared classifier deciding whether a URL is the Blogger editor (`EDITING`), a public post (`PUBLISHED_CANDIDATE`), or neither. Used by the stage 61 adapter and the stage 62 observer so they cannot disagree.
- [dotenv.mjs](dotenv.mjs): loads `.env` into `process.env` for runtimes that read operator configuration, with existing environment variables taking precedence. Previously only the email transport read `.env`, so a value like `BLOGGER_TARGET_ID` never reached any other runtime.
- [publication-payload.mjs](publication-payload.mjs): one definition of where a post title and body come from (`mission.title` → `asset.title` → override). Fails closed naming the missing source instead of a generic payload error.
- [publication-receipt.mjs](publication-receipt.mjs): authority and field provenance for `publication-receipt.json`. Stage 61 is the only writer; receipts from any other runtime are rejected on read, and `published_at` is never filled in from local wall-clock time.
- [cdp-runtime/](cdp-runtime/README.md): the CDP session, evidence ledger and transaction/idempotency modules shared by the stage 58–62 publication pipeline.
