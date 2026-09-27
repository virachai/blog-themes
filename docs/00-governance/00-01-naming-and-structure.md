# Naming and Structure Rules

Date: 2026-09-27
Status: Enforced by [build-index.mjs --check](../../scripts/node/build-index.mjs)

## Every folder

- Every non-hidden folder has a hand-written `README.md` that starts with `# Title`, and a generated `INDEX.md`.
- Never edit `INDEX.md` by hand. After adding, renaming or retitling anything, run `node scripts/node/build-index.mjs`.
- Dot-folders (`.git`, `.githooks`, `.github`) are skipped.

## Blog folders (repository root)

- One folder per blog: `NN-slug/` (for example `01-meeprompt/`).
- Files inside are `NN-slug.ext`, numbered in the order they are used: stylesheet, live theme, backups, test content.

## Docs

- `docs/` holds only section folders `NN-slug/`. `00` is reserved for governance.
- Items in a section are `NN-MM-slug.md`, and `NN` must match the section number.

## Numbers

- Numbers are unique within a folder and never reused. A new entry takes the highest number plus one.
- A gap left by a retired number stays. Never renumber to close it.

## Published paths

- Files under a blog folder are served by GitHub Pages and loaded by live Blogger themes. A rename breaks those themes: update every theme XML `<link>` in the same commit, and apply the updated theme in Blogger.

## Other folders

- `scripts/<language>/kebab-case.ext`.
- Do not create empty placeholder folders.
