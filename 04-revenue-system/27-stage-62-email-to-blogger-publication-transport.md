# Stage 62 — Email-to-Blogger Publication Transport

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

`EMAIL_SENT` is intentionally not treated as `PUBLISHED`. A later observation/verification step must confirm the Blogger post URL before the publication receipt is created.

## Safety

- `.env` is ignored by git.
- `EMAIL_FOR_POSTING` is never logged.
- SMTP credentials are never logged.
- Sending requires an explicit `send` command plus `EMAIL_PUBLISH_CONFIRM=YES`.
- Idempotency must be handled at the publication transaction layer before enabling automated sends.
- The current Stage 62 adapter does not claim publication success from SMTP delivery alone.
