---
name: redact-mail2blogger-address
description: Redact the blog's Mail2Blogger address from run artifacts before committing them to this public repo
metadata:
  pinned: false
---

The email-to-blogger publication transport (stage 62, `scripts/node/email-to-blogger-publication-transport.mjs`) writes the composed message into the run folder as `email-publication-message.eml` and `email-publication-message.json`. Both contain the blog's Mail2Blogger posting address, read from `EMAIL_FOR_POSTING` in `.env`. That address is effectively a publishing credential - anyone holding it can attempt to post to the blog by email - and this repository is public, so a committed address stays indexed even if it is deleted later.

The owner's decision, given on 2026-09-28, is to redact the address rather than drop the artifacts or commit it in the clear: replace the address with `[REDACTED]@blogger.com` in both the `.eml` and the `.json`, so the run still records that the transport composed a message and the workflow stays reproducible (a re-run reads the real address from `.env`).

The `.json` carries a `fingerprint` field that is the SHA-256 of the `.eml` file bytes, so redacting the message invalidates it. Recompute the fingerprint over the redacted `.eml` and write the new value into the `.json`; otherwise the artifact contradicts itself. Since no email has actually been sent in these runs (`status: BLOCKED`, `external_side_effect: false`), the fingerprint is plan-time data, not a receipt of a real send, so recomputing it is honest rather than a cover-up. Verify by hashing the file with Node's `crypto` and comparing to the stored value.

This applies to every future run whose artifacts get committed. `.env` itself is already gitignored and stays untracked.
