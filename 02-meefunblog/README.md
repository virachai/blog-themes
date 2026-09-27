# MeeFun Staging

[meefunblog.blogspot.com](https://meefunblog.blogspot.com/) is the staging blog for Mee Prompt. Theme and layout changes are tried here before they go live on Mee Prompt.

| File | Purpose |
| :-- | :-- |
| [01-theme-staging.xml](01-theme-staging.xml) | Mee Prompt theme v2 with meefunblog URLs, `noindex,nofollow` and a `[STAGING]` title prefix |
| [02-staging-post.html](02-staging-post.html) | Test post in the LipsCode article shape: lead image + `mp-caption`, intro, auto table of contents, H2/H3 sections with `title=` short labels, every `mp-` component, a wide table, code and Thai text. Live copy: [2026/08/blog-post.html](https://meefunblog.blogspot.com/2026/08/blog-post.html) |
| [03-theme.css](03-theme.css) | Staging stylesheet. Edit CSS here first; once it passes, copy it to [../01-meeprompt/01-theme.css](../01-meeprompt/01-theme.css) (keep that file's first comment line) |
| [04-theme-base.css](04-theme-base.css) | Every theme style that used to live in the XML, in original cascade order: head `<style>` blocks, the Blogger-rendered `<b:skin>` (variables resolved), and the widget `<style>` blocks (HTML1–HTML6, Header1, Blog1 tooltip, end of body). The home-page-only block is scoped with `body.home-view` (a `b:class` in the XML). The XML keeps only `<b:template-skin>`, the `<b:skin>` variable declarations (`data:skin.vars` needs them), the SVG logo's own `<style>` and 25 inline `style=` attributes. Loaded in `<head>`; `03-theme.css` loads again at the end and wins |

Staging has its own stylesheet so a CSS change can be tested without touching the live blog. The release

## Changes waiting to be promoted to Mee Prompt

- Detail polish (layout unchanged), build `meefun-staging 2026-09-27.3`:
  - Typefaces: IBM Plex Sans Thai for UI and headings, IBM Plex Sans Thai Looped for post body text, loaded by a Google Fonts `<link>` in the XML `<head>`. The base theme's `* { font-family: Lobster !important }` is removed from `04-theme-base.css` (Lobster never loaded; the rule only forced the fallback).
  - Colour: links, read-more and the CTA button use `--mp-accent` #a3281f (the page red deepened, 7.3:1 on white) instead of three different blues; focus rings use the logo orange.
  - Post text: the base `.post-body.entry-content * { font-size: 15px; color: #000 }` is removed from `04-theme-base.css`, so paragraphs and lists are 17px in `--mp-text`; blockquotes no longer use the skin's centred x-large italic.
  - Post cards on listing pages (Blockdit-inspired, approved 2026-09-27): image first, bold title clamped to 3 lines, author and date only, 2-line snippet, the whole card is the link and "Read more" is hidden; two cards per row below 800px. CSS only (`display: contents` + `order`).
  - Long-article structure from LipsCode: edge-to-edge lead image with an `mp-caption` line, section H2s with a rule, the auto table of contents (`<div id="toc_container"><h2>สารบัญ</h2></div>`, built by `autoGenTocv11()`) as a numbered panel in brand colours, and the Popular list numbered as a ranking.
  - Details: post title larger than its H2s, card titles 19px with Thai line-height, quieter byline without the colour-cycling author link, sentence-case "Read more", red-tinted card shadow, dark code blocks, no synthetic italics on Thai.
- Moving theme CSS out of the XML (`04-theme-base.css`) is staging-only until verified.

The release procedure is in [docs/01-runbooks/01-01-theme-release.md](../docs/01-runbooks/01-01-theme-release.md).
