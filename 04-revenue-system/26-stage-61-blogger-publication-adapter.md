# Stage 61 - Blogger Publication Adapter

Stage 61 owns the approval-gated publication transaction boundary and binds it to the real Blogger UI without treating CDP connectivity as publication success.

## Commands

```bash
node scripts/node/blogger-publication-adapter.mjs plan <run_id>
node scripts/node/blogger-publication-adapter.mjs inspect <run_id>
node scripts/node/blogger-publication-adapter.mjs execute <run_id> publish
```

## Safety boundary

- plan is filesystem-only.
- inspect connects to CDP but performs no external write.
- execute ... publish requires release readiness, approval.status=APPROVED, a Blogger target, intent verification, and BLOGGER_PUBLISH_CONFIRM=YES.
- Idempotency and fencing use the existing transaction runtime.
- A publication receipt is created only after post-publish verification passes.
- Automatic deletion/rollback is disabled because a successfully published Blogger post is an external commit.

## Target contract

The adapter verifies the active target is Blogger, required title/body/publish controls exist, the publish control is enabled, content is filled before the irreversible action, and the resulting page looks published.

Selectors can be overridden with BLOGGER_TITLE_SELECTOR, BLOGGER_BODY_SELECTOR, BLOGGER_PUBLISH_SELECTOR, and BLOGGER_TARGET_ID.

Default selectors must be validated with inspect against the current Blogger UI before publishing.

## Definition of done

The publication boundary is now bound directly to the Blogger-specific adapter with explicit UI intent verification, post-action verification, idempotency, evidence, and a real receipt. The current run remains blocked and no publication is attempted.
