# MeeFun Staging

[meefunblog.blogspot.com](https://meefunblog.blogspot.com/) is the staging blog for Mee Prompt. Theme and layout changes are tried here before they go live on Mee Prompt.

| File | Purpose |
| :-- | :-- |
| [01-theme-staging.xml](01-theme-staging.xml) | Mee Prompt theme v2 with meefunblog URLs, `noindex,nofollow` and a `[STAGING]` title prefix |
| [02-staging-post.html](02-staging-post.html) | Test post using every `mp-` component, a wide table, code and Thai text |
| [03-theme.css](03-theme.css) | Staging stylesheet. Edit CSS here first; once it passes, copy it to [../01-meeprompt/01-theme.css](../01-meeprompt/01-theme.css) (keep that file's first comment line) |
| [04-theme-base.css](04-theme-base.css) | Every other theme style, moved out of the XML so it can be debugged from this repo: the head `<style>` blocks and the Blogger-rendered `<b:skin>` (variables resolved). The XML keeps only the `<b:skin>` variable declarations, which `data:skin.vars` still needs. Loaded in `<head>` before the skin position; `03-theme.css` loads again at the end and wins |

Staging has its own stylesheet so a CSS change can be tested without touching the live blog. The release

## Changes waiting to be promoted to Mee Prompt

- None. Staging was re-cloned from Mee Prompt v2 on 2026-09-27 (see [docs/02-sessions/02-01-staging-readability-toc.md](../docs/02-sessions/02-01-staging-readability-toc.md)); the earlier SEO head and editorial changes were dropped and must be redone if still wanted.
- Moving theme CSS out of the XML (`04-theme-base.css`) is staging-only until verified.

The release procedure is in [docs/01-runbooks/01-01-theme-release.md](../docs/01-runbooks/01-01-theme-release.md).
