# Blog Themes Project Guidance

This file provides architectural, operational, and workflow instructions for AI agents (Gemini CLI) working in this repository.

## Agent Protocol Contract

Before non-trivial work, read `AGENTS.md`, `docs/00-governance/00-42-agent-protocol-contract.md`, and `docs/00-governance/00-03-sovereign-agent-enterprise-protocol.md`. The repository contract applies to Gemini CLI and all other agents: classify changes, preserve human authorization boundaries, verify before claiming completion, and stop on failed critical gates.

## Editing Rules

- **No Em-dash:** Do not use em-dashes (-) when editing or creating files in this repository.

## Project Overview

This repository contains static CSS and Blogger theme XML files for the owner's Blogger blogs, served as-is by GitHub Pages (`https://virachai.github.io/blog-themes/...`, `.nojekyll`). Live Blogger themes `<link>` directly to stylesheets in this repository. A pushed commit updates live sites within ~10 minutes (`Cache-Control: max-age=600`; bump `?v=` in theme XML for immediate effect).

The repository is public. Never commit secrets, API tokens, or personal data. Theme XML may contain public IDs only (Google Analytics, AdSense publisher ID).

## Repository Structure

- `01-meeprompt/` - Live blog (Mee Prompt): `01-theme.css`, `02-theme-v2.xml`, backup XML.
- `02-meefunblog/` - Staging blog: `01-theme-staging.xml`, `02-staging-post.html` (test post), `03-theme.css`.
- `03-lipscode/` - Backup only.
- `docs/` - Documentation (`00-governance/` for naming/structure rules, `01-runbooks/` for theme release runbook).
- `scripts/` - Utility scripts (`scripts/node/build-index.mjs`).
- `.githooks/` - Git hooks (`pre-commit` structure gate).
- `.github/workflows/` - CI workflows (`structure.yml`).

## Key Commands

```bash
node scripts/node/build-index.mjs           # Regenerate all INDEX.md files
node scripts/node/build-index.mjs --check   # Structure gate (must print STRUCTURE-CHECK: PASS)
git config core.hooksPath .githooks          # Enable pre-commit gate (run once per clone)
```

Before every commit, the structure check must pass, and rerunning `build-index.mjs` must report `0 written`. CI (`.github/workflows/structure.yml`) enforces this check on every push and pull request.

## Structure & Naming Rules (Enforced by `--check`)

1. **README & INDEX:** Every non-hidden folder must have a hand-written `README.md` starting with `# Title` and a generated `INDEX.md`. Never edit `INDEX.md` by hand.
2. **Blog Folders & Files:** Root blog folders are `NN-slug/`. Files inside are `NN-slug.ext`, numbered in order of use (stylesheet, live theme, backups, test content).
3. **Docs Folders & Files:** `docs/` holds only section folders `NN-slug/` (`00` = governance). Items are `NN-MM-slug.md` with `NN` matching the section.
4. **Numbering:** Numbers are unique within a folder, never reused, and never renumbered to close gaps. New entries take the highest number plus one.
5. **Published Paths:** Renaming a published file breaks live themes. Always update every theme XML `<link>` referencing the file in the same commit.

## Theme Change Workflow

All theme changes follow the staging workflow (see `docs/01-runbooks/01-01-theme-release.md`):
1. Edit staging files in `02-meefunblog/` only (e.g., `03-theme.css`).
2. Run `node scripts/node/build-index.mjs` and `node scripts/node/build-index.mjs --check`.
3. Commit, push, and test on the staging blog (`meefunblog.blogspot.com`).
4. For production rollout (Mee Prompt), copy the CSS body into `01-meeprompt/01-theme.css` (keeping its first comment line), verify checks, commit, and push.

## CSS Guidelines

- Scope CSS rules to existing Blogger classes (`.post-body`, `.widget`) or the `mp-` component prefix (`mp-summary`, `mp-evidence`, `mp-note`, `mp-cta`) to prevent breaking Blogger's default layout.
- Content is in Thai: preserve line-height/spacing (`line-height: 1.85` or higher) so stacked vowels do not collide. Wide tables must scroll horizontally on mobile without causing page overflow.
