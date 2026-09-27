# 02-01 Staging theme readability and TOC

## Overview

Commit `5c06245` (2026-09-27) reworked the MeeFun staging theme for post readability and an auto-generated table of contents. The change is on staging only; `01-meeprompt/` (live) is untouched, so nothing reaches the live blog until the release runbook is followed.

## Key Changes

1. **Staging CSS:** `02-meefunblog/03-theme.css` was rewritten from the "Premium Editorial" layout overrides (header, homepage cards, featured story, sidebar, footer) down to three sections: post readability, horizontally scrolling tables on narrow screens, and the `mp-` components. The header comment now states the staging→live copy step.
2. **Staging theme XML:** `02-meefunblog/01-theme-staging.xml` gained TOC handling in the `#HTML6` widget: a floating "show TOC" button on item pages, a bottom TOC container toggled per breakpoint, and a script that clones `#toc_container` lists into it.
3. **Index:** `02-meefunblog/INDEX.md` regenerated.

## Verification

| Check                                               | Result                                     |
| --------------------------------------------------- | ------------------------------------------ |
| `node scripts/node/build-index.mjs --check`         | pass after this report's changes (see log) |
| Staging blog render (Thai post, mobile tables, TOC) | skipped — not verified in this session     |

## Open Items

- Verify on the staging blog with `02-meefunblog/02-staging-post.html`, then promote the CSS to `01-meeprompt/01-theme.css` per `docs/01-runbooks/01-01-theme-release.md` — owner decides.
- `02-meefunblog/INDEX.md` had uncommitted changes before this session; regenerated here.
