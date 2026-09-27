# Theme Release Runbook

Date: 2026-09-27

Every theme or stylesheet change goes to the staging blog first, then to the live blog.

## 1. Prepare

1. Edit the **staging** files only: [02-meefunblog/03-theme.css](../../02-meefunblog/03-theme.css) or the staging theme XML.
2. Run `node scripts/node/build-index.mjs`, then `node scripts/node/build-index.mjs --check` (must print `STRUCTURE-CHECK: PASS`).
3. Commit and push. Wait about a minute for GitHub Pages, then open the stylesheet URL and confirm it shows CSS, not a 404.

## 2. Staging (meefunblog)

1. Blogger → meefunblog → Theme → ▾ → **Backup** (download the current theme).
2. Theme → ▾ → **Restore** → upload [02-meefunblog/01-theme-staging.xml](../../02-meefunblog/01-theme-staging.xml).
3. New post → HTML view → paste [02-meefunblog/02-staging-post.html](../../02-meefunblog/02-staging-post.html) → Publish.
4. Check on a phone and on a desktop:
   - Thai text: vowels above and below do not collide; lines are comfortable to read.
   - The wide table scrolls sideways on the phone; the page itself does not.
   - `mp-summary`, `mp-evidence`, `mp-note` and `mp-cta` render with their colours; the button is readable.
   - Header, sidebar and home page look as before.
   - View source: `noindex,nofollow` and the `02-meefunblog/03-theme.css` link are present.

## 3. Live (Mee Prompt)

1. CSS change: copy the body of `02-meefunblog/03-theme.css` into `01-meeprompt/01-theme.css` (keep its first comment line), run the checks, commit and push.
2. Theme XML change (first rollout or later): Blogger → Mee Prompt → Theme → **Backup**, then **Restore** [01-meeprompt/02-theme-v2.xml](../../01-meeprompt/02-theme-v2.xml).
3. Open the home page and one post; repeat the checks from step 2.4 (without noindex).

## Rollback

Restore the backup from step 1 of the affected blog. For Mee Prompt, the 2026-09-27 backup is also kept at [01-meeprompt/03-theme-backup-20260927.xml](../../01-meeprompt/03-theme-backup-20260927.xml).
