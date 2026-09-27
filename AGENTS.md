# AGENTS.md

Guidance for coding agents working in this repository.

## What this repo is

Static CSS and Blogger theme XML for the owner's Blogger blogs, served as-is by GitHub Pages (`https://virachai.github.io/blog-themes/...`, `.nojekyll`). Live Blogger themes `<link>` to stylesheets here, so a pushed commit changes live sites within ~10 minutes (`Cache-Control: max-age=600`; bump `?v=` in the theme XML for immediate effect). The repo is public.

- `01-meeprompt/` — live blog (Mee Prompt): `01-theme.css`, `02-theme-v2.xml`, backup XML.
- `02-meefunblog/` — staging blog: `01-theme-staging.xml`, `02-staging-post.html` (test post), `03-theme.css` (overrides, loaded last), `04-theme-base.css` (all CSS moved out of the XML), `05-theme.js` (theme scripts moved out of the XML).
- `03-lipscode/` — backup only.
- `docs/` — `00-governance/` (naming rules), `01-runbooks/` (theme release).
- `scripts/node/build-index.mjs` — generates every `INDEX.md` and enforces structure.

## Commands

```bash
node scripts/node/build-index.mjs           # regenerate all INDEX.md files
node scripts/node/build-index.mjs --check   # structure gate; must print STRUCTURE-CHECK: PASS
git config core.hooksPath .githooks          # enable pre-commit gate (once per clone)
```

Before every commit: the check passes and rerunning `build-index.mjs` reports `0 written`. CI (`.github/workflows/structure.yml`) runs the same check on push/PR. There is no build, lint, or test suite.

## Structure rules (enforced by `--check`)

- Every non-hidden folder has a hand-written `README.md` starting with `# Title` and a generated `INDEX.md`. Never edit `INDEX.md` by hand.
- Blog folders are `NN-slug/`; files inside are `NN-slug.ext`, numbered in order of use (stylesheet, live theme, backups, test content).
- `docs/` contains only `NN-slug/` sections (`00` = governance); items are `NN-MM-slug.md` with `NN` matching the section.
- Numbers are unique per folder, never reused, never renumbered to close gaps; new entries take highest + 1.
- Scripts live at `scripts/<language>/kebab-case.ext`. No empty placeholder folders.
- Renaming a published file breaks live themes: update every theme XML `<link>` in the same commit.

## Theme change workflow

See `docs/01-runbooks/01-01-theme-release.md`. In short: edit staging files (`02-meefunblog/`) only, verify on the staging blog, then copy the CSS body into `01-meeprompt/01-theme.css` (keep its first comment line).

## CSS rules

- Scope CSS to existing Blogger classes (`.post-body`, `.widget`) or the `mp-` component prefix (`mp-summary`, `mp-evidence`, `mp-note`, `mp-cta`) so it cannot break Blogger's layout.
- Content is Thai: preserve line-height/spacing so stacked vowels don't collide; wide tables must scroll horizontally on mobile without page overflow.
- Theme XML may contain only public IDs (Analytics, AdSense publisher ID). No secrets or personal data.
