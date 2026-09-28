---
name: publication-evidence-invariants
description: Four invariants separating delivery, editing, observation and publication in the editorial pipeline; never relax them to make a check pass
metadata:
  pinned: true
---

The owner's publication pipeline (stages 58–62 in `04-revenue-system/`) is built so that no stage can claim more than it actually proved. On 2026-09-28 they stated the invariants that must hold:

```text
EMAIL_SENT   ≠ PUBLISHED
EDITOR_URL   ≠ PUBLIC_POST_URL
OBSERVED     ≠ VERIFIED
VERIFIED     ≠ PUBLISHED
```

These exist because the failure mode is a receipt that claims publication for a post that is still a draft. A Blogger editor URL has the form `https://www.blogger.com/blog/post/edit/<blogId>/<postId>` — it matches a `blogger.com` host check and its `innerText` contains the post title, so a naive "hostname + title present" test passes on a completely unpublished post. Any check must classify `/blog/post/edit/...` as `EDITING`, never `PUBLISHED`, and a `PUBLISHED` claim must carry a non-empty `external_id`.

The owner's standing instruction on how to fix such defects: do not make the check pass by weakening it. They said explicitly that they would not fix the observer "by making it pass the test", but by preserving the invariants — so prefer failing closed, distinguishing published from editing states, and adding a regression test that asserts genuinely different observations produce genuinely different evidence hashes.

This matters beyond the observer: the evidence ledger is only worth anything if its `content_hash` varies with content. A hash that is constant across observations proves nothing, and the owner treats evidence integrity as the thing being protected, not the test outcome.
