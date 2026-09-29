# Stage 62 - Email-to-Blogger Publication Transport

Stage 62 adds an email transport for Blogger's email-posting address. It is a transport layer, not publication proof: sending an email does not create a publication receipt.

## Configuration

Only the Blogger posting recipient is required for planning/preparation:

```env
EMAIL_FOR_POSTING=...
```

Actual SMTP delivery additionally requires a configured sender and SMTP transport:

```env
EMAIL_FROM=...
EMAIL_SMTP_HOST=...
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=...
EMAIL_SMTP_PASSWORD=...
EMAIL_SMTP_SECURE=false
```

These values remain in `.env`; the runtime never prints secrets.

## Commands

```bash
node scripts/node/email-to-blogger-publication-transport.mjs plan <run_id>
node scripts/node/email-to-blogger-publication-transport.mjs prepare <run_id>
node scripts/node/email-to-blogger-publication-transport.mjs send <run_id>
node scripts/node/email-to-blogger-publication-observer.mjs observe <run_id>
```

`plan` is filesystem-only. `prepare` creates the deterministic `.eml` payload and performs no external side effect. `send` is the only command that sends mail and requires `EMAIL_PUBLISH_CONFIRM=YES`, release readiness, explicit approval, and a ready asset.

## Publication boundary

```text
asset
  -> email message
  -> SMTP delivery
  -> Blogger ingestion
  -> published URL observed
  -> publication receipt
```

`EMAIL_SENT` is intentionally not treated as `PUBLISHED`. After delivery, the observer connects through CDP, classifies the target page, records evidence, and writes `email-publication-observation.json` - **it never creates `publication-receipt.json`**.

The observer is observation-only. Its vocabulary is `OBSERVED` and `OBSERVATION_PENDING`; it has no publication status to write. The publication receipt belongs to the gated stage 60/61 transaction path, which requires release readiness, `approval.status = APPROVED`, idempotency and fencing before it will claim anything. An observer that could mint that receipt would bypass every one of those gates.

Three boundaries the observer enforces:

- `EDITOR_URL ≠ PUBLIC_POST_URL` - the Blogger editor at `/blog/post/edit/<blogId>/<postId>` classifies as `EDITING`, never as a published post. Its path contains `/post/` and its title contains the post title, so hostname-plus-substring tests pass on an unpublished draft.
- `OBSERVED ≠ VERIFIED` - a title match on a public post URL is recorded as an observation, not as publication.
- `VERIFIED ≠ PUBLISHED` - only the transaction path may promote a candidate post to `PUBLISHED`, and only with a non-empty `external_id`.

The observer also fails closed: it requires `EMAIL_PUBLISH_CONFIRM=YES`, an explicit `BLOGGER_TARGET_ID`, and no pre-existing `publication-receipt.json` in the run folder. Evidence is written through `createEvidence()`'s real schema, so `content_hash` varies with what was observed; the previous field-name mismatch produced a constant hash that proved nothing.

## Safety

- `.env` is ignored by git.
- `EMAIL_FOR_POSTING` is never logged.
- SMTP credentials are never logged.
- Sending requires an explicit `send` command plus `EMAIL_PUBLISH_CONFIRM=YES`.
- Idempotency must be handled at the publication transaction layer before enabling automated sends.
- The current Stage 62 adapter does not claim publication success from SMTP delivery alone.
