# MeeFun Staging

[meefunblog.blogspot.com](https://meefunblog.blogspot.com/) is the staging blog for Mee Prompt. Theme and layout changes are tried here before they go live on Mee Prompt.

| File | Purpose |
| :-- | :-- |
| [01-theme-staging.xml](01-theme-staging.xml) | Mee Prompt theme v2 with meefunblog URLs, `noindex,nofollow` and a `[STAGING]` title prefix |
| [02-staging-post.html](02-staging-post.html) | Test post using every `mp-` component, a wide table, code and Thai text |
| [03-theme.css](03-theme.css) | Staging stylesheet. Edit CSS here first; once it passes, copy it to [../01-meeprompt/01-theme.css](../01-meeprompt/01-theme.css) (keep that file's first comment line) |

Staging has its own stylesheet so a CSS change can be tested without touching the live blog. The release

## Changes waiting to be promoted to Mee Prompt

Tested here first; once they pass, apply the same edits to `01-meeprompt/02-theme-v2.xml` and `01-meeprompt/01-theme.css`.

- Theme XML:
  - Posts get a server-side `meta description` (`data:view.description`) when no Search Description is set. This replaces the old client-side script that crawlers never ran.
  - Search and archive pages get `noindex,follow`.
  - The home page description is output only when Settings has none.
  - Twitter cards use `summary_large_image`, with the view description as fallback.
  - Posts without a Search Description get an `og:description` fallback of the post title + tagline, placed before `all-head-content` so it wins.
  - The home page identity is hardcoded: `lang='th'`, and the title, `og:title`, `og:description` and twitter tags. On Mee Prompt, use `Mee Prompt` without `[STAGING]`.
- CSS:
  - The labels "สรุปสั้น" and "ทดสอบจริง" are drawn by CSS, so posts no longer need `<p class="mp-label">`, and Blogger's auto snippet starts with the real summary.
  - `mp-figure` adds full-width images with captions.

The release procedure is in [docs/01-runbooks/01-01-theme-release.md](../docs/01-runbooks/01-01-theme-release.md).
