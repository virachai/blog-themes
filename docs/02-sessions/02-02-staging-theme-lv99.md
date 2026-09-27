# 02-02 Staging theme polish, content protocol and pages

## Overview

Over 2026-09-27/28 the MeeFun staging theme was moved to a repo-debuggable setup and polished to the owner's satisfaction ("ธีมกับโครงสร้างอยู่ระดับดี"). All CSS and theme JS now live in `02-meefunblog/` on GitHub Pages; the XML is structure only. Live Mee Prompt (`01-meeprompt/`) is unchanged.

## Key Changes

1. **CSS/JS out of XML:** `04-theme-base.css` (all former XML styles, entity-decoded, rendered `<b:skin>`), `05-theme.js` (theme scripts, deferred), `03-theme.css` (overrides, loaded last).
2. **Design:** IBM Plex Sans Thai / Looped, brand accent `#a3281f`, Blockdit-style post cards (image first, whole card clickable, 2 columns on mobile), shorter red-graded hero, numbered TOC panel and popular list, dark code blocks.
3. **Menu and footer:** LipsCode leftovers replaced with prompts / workflows / ai-tools; broken `#/p/` links fixed.
4. **Static pages:** category, tags, contact, about, privacy, form (`06`–`12-page-*.html`), each with a centred title banner; setup guides in `docs/03-pages/`.
5. **Form:** in-page form posting to the existing Mee Prompt Google Form via a hidden iframe.
6. **Images:** Pexels photos in `02-meefunblog/11-images/` with credits; API key only in untracked `.env`.
7. **Content protocol:** `docs/04-content/04-01-post-protocol.md` (Thai + English title, hidden `mp-id` marker, `#NNNN` links, summary-first body for meta description). Post 0001 published at `/2026/09/3-low-light-condo-plants.html`.
8. **SEO in XML (build .8):** `lang="th"`, H1 = post/page title, server-side meta description, large Twitter card, Pexels share image.

## Verification

| Check | Result |
| --- | --- |
| `build-index.mjs --check` | pass on every commit |
| CDP at 390/1366 on home, post 0001 and all 6 pages | no overflow, images load, 0 JS errors, titles/H1/meta description correct |
| Cache experiment (`&ts=`) build .7b vs .6 | repeat visit FCP 308 ms vs 264 ms; ~30 KB re-downloaded vs 7 KB revalidated |

## Open Items

- Blogger → Settings → Description is empty; the home meta description falls back to the blog title (owner).
- JSON-LD author shows "UserXP" (Blogger profile name); skipped by the owner for now.
- Post via email not yet tested end to end (owner sends one post).
- Site niche undecided: categories, H1 and hero text still say Prompt/AI while post 0001 is about plants (owner).
- `ts` cache-busting: recommended for staging only, not for live (owner to confirm).
- Promotion to live Mee Prompt needs 04/05/images equivalents in `01-meeprompt/` and an updated release runbook.
