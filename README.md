# Blog Themes

Shared CSS and Blogger theme files for the owner's Blogger blogs, served by GitHub Pages. Each blog's Blogger theme loads its stylesheet from this repository, so layout changes ship with a commit instead of a theme edit.

## Structure

- One numbered folder per blog: `NN-slug/`. Numbers are unique, never reused, and a new blog takes the highest number plus one.
- Files inside a blog folder are `NN-slug.ext`, numbered in the order they are used (stylesheet, live theme, backups).
- Every folder has a hand-written `README.md` that starts with `# Title` and a generated `INDEX.md`. Never edit `INDEX.md` by hand.
- Renaming a published file breaks live themes: update the `<link>` in every theme XML in the same commit.

| Blog | Folder | Stylesheet URL |
| :-- | :-- | :-- |
| Mee Prompt (meeprompt.blogspot.com) | [01-meeprompt/](01-meeprompt/README.md) | `https://virachai.github.io/blog-themes/01-meeprompt/01-theme.css` |
| MeeFun staging (meefunblog.blogspot.com) | [02-meefunblog/](02-meefunblog/README.md) | Uses the Mee Prompt stylesheet |
| LipsCode (backup only) | [03-lipscode/](03-lipscode/README.md) | — |

Contents are listed in [INDEX.md](INDEX.md).

## Commands

```bash
node scripts/node/build-index.mjs           # regenerate every INDEX.md
node scripts/node/build-index.mjs --check   # structure gate: prints STRUCTURE-CHECK: PASS/FAIL
```

Run both before every commit: the check must pass and a rerun of `build-index.mjs` must report `0 written`.

## Updating a theme

1. Edit the blog's stylesheet, run the commands above, commit and push.
2. GitHub Pages redeploys in about a minute and serves files with `Cache-Control: max-age=600`, so visitors see the change within about 10 minutes.
3. For a change that must show immediately, raise the `?v=` number in the Blogger theme.
4. Try every change on the staging blog (02-meefunblog) before Mee Prompt.

## Rules

- Scope CSS to the blog's existing classes (`.post-body`, `.widget`) or the `mp-` component prefix, so a stylesheet cannot break Blogger's own layout.
- This repository is public. Never commit secrets, API tokens or personal data. Theme XML may contain public IDs only (Analytics, AdSense publisher ID).
- `.nojekyll` keeps GitHub Pages from running Jekyll, so files are served as-is.
