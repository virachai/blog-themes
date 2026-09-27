# MeeFun Staging

[meefunblog.blogspot.com](https://meefunblog.blogspot.com/) is the staging blog for Mee Prompt. Theme and layout changes are tried here before they go live on Mee Prompt.

| File | Purpose |
| :-- | :-- |
| [01-theme-staging.xml](01-theme-staging.xml) | Mee Prompt theme v2 with meefunblog URLs, `noindex,nofollow` and a `[STAGING]` title prefix |
| [02-staging-post.html](02-staging-post.html) | Test post using every `mp-` component, a wide table, code and Thai text |
| [03-theme.css](03-theme.css) | Staging stylesheet. Edit CSS here first; once it passes, copy it to [../01-meeprompt/01-theme.css](../01-meeprompt/01-theme.css) (keep that file's first comment line) |
| [04-theme-base.css](04-theme-base.css) | Every theme style that used to live in the XML, in original cascade order: head `<style>` blocks, the Blogger-rendered `<b:skin>` (variables resolved), and the widget `<style>` blocks (HTML1–HTML6, Header1, Blog1 tooltip, end of body). The home-page-only block is scoped with `body.home-view` (a `b:class` in the XML). The XML keeps only `<b:template-skin>`, the `<b:skin>` variable declarations (`data:skin.vars` needs them), the SVG logo's own `<style>` and 25 inline `style=` attributes. Loaded in `<head>`; `03-theme.css` loads again at the end and wins |

Staging has its own stylesheet so a CSS change can be tested without touching the live blog. The release

## Changes waiting to be promoted to Mee Prompt

- None. Staging was re-cloned from Mee Prompt v2 on 2026-09-27 (see [docs/02-sessions/02-01-staging-readability-toc.md](../docs/02-sessions/02-01-staging-readability-toc.md)); the earlier SEO head and editorial changes were dropped and must be redone if still wanted.
- Moving theme CSS out of the XML (`04-theme-base.css`) is staging-only until verified.

The release procedure is in [docs/01-runbooks/01-01-theme-release.md](../docs/01-runbooks/01-01-theme-release.md).
