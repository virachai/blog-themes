# 02-01 Staging theme revert and re-clone

## Overview

Commit `5c06245` (2026-09-27), titled "refine staging theme and css styling for readability and TOC auto-generation", was in fact a full revert of the MeeFun staging theme to its `19a0119` content. It also converted `01-theme-staging.xml` to CRLF, so its diff showed ~15,000 changed lines and hid the revert. Restoring `1775126` (`5d92dea`) left too much broken, so staging was re-cloned from the live Mee Prompt theme instead. Live (`01-meeprompt/`) was never affected.

## Key Changes

1. **Diagnosis:** `git diff --ignore-cr-at-eol 19a0119 5c06245 -- 02-meefunblog/` is empty, so `5c06245` discarded all of `16d0e3c` (editorial `mf-` classes, visible PageList nav, `?v=2`) and `1775126` (Featured Story, Label1 and PopularPosts2 sidebar, legacy HTML2/3/5 hidden). The `#HTML6` TOC code it appeared to add already existed.
2. **Restore:** `02-meefunblog/01-theme-staging.xml` and `02-meefunblog/03-theme.css` checked out from `1775126`.
3. **Cache-buster:** both `03-theme.css` links in the staging XML changed from `?v=2` to `?v=3`, because the revert had served `?v=1` and a lower version could hit stale cache.
4. **Re-clone:** `01-theme-staging.xml` rebuilt from `01-meeprompt/02-theme-v2.xml` with the `afcdb11` staging recipe (domain `meefunblog.blogspot.com`, `noindex,nofollow`, `[STAGING]` title, CSS link `02-meefunblog/03-theme.css?v=4`); `03-theme.css` copied from `01-meeprompt/01-theme.css` with a staging first comment line. SEO head (`19a0119`) and editorial layout (`16d0e3c`, `1775126`) are dropped.
5. **CSS out of XML:** head `<style>` blocks and the Blogger-rendered `<b:skin>` moved to `02-meefunblog/04-theme-base.css` (`201cd46`). The head blocks were copied XML-encoded, so `#HTML3 > h3.title` and `#HTML4.widget.HTML > h3.title` were dropped and both widget labels showed on desktop; entities decoded in `b0fc907`. The XML now carries `<meta name='theme-build'>` for curl rechecks.

## Verification

| Check | Result |
| --- | --- |
| `diff 01-meeprompt/02-theme-v2.xml 02-meefunblog/01-theme-staging.xml` | only domain, noindex, title and `?v=4` CSS links differ |
| `grep -c 'theme.css?v=4' 02-meefunblog/01-theme-staging.xml` | 2 |
| `node scripts/node/build-index.mjs --check` | pass (see log) |
| CDP 390px / 1366px after `b0fc907` | pass: no page overflow, table scrolls, Thai line-height 27.75px, HTML3/HTML4 titles hidden |
| Staging blog render (Thai post, mobile tables) | skipped — owner must paste the XML into the staging blog |

## Open Items

- Owner: upload `02-meefunblog/01-theme-staging.xml` to the staging blog and confirm the layout, then decide on promotion per `docs/01-runbooks/01-01-theme-release.md`.
- Find what rewrote the file with CRLF and old content, likely an agent or editor saving a stale Blogger export, before it happens again.
