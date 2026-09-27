# Blogger Pages

What to enter in Blogger for each static page of the staging blog (meefunblog). One file per page. The page body HTML lives in `02-meefunblog/`; styles come from `02-meefunblog/03-theme.css`, so paste the HTML as-is and do not add inline styles.

Contents are listed in [INDEX.md](INDEX.md).

## Post IDs (`#NNNN`)

Every post title ends with a four-digit ID, for example `ต้นไม้ในคอนโดแสงน้อย: 3 ต้นที่เลี้ยงรอด #0001`. IDs are unique and never reused; the next post takes the highest ID + 1. To link another post, type only its ID (`#0001`) in the post body: `05-theme.js` finds the post in the blog feed and turns the ID into a link with that post's title. An ID with no matching post stays plain text. The ID after a title is shown small and muted by `03-theme.css`.

| ID | Post | Body file |
| --- | --- | --- |
| #0001 | ต้นไม้ในคอนโดแสงน้อย: 3 ต้นที่เลี้ยงรอด | [02-meefunblog/13-post-condo-plants.html](../../02-meefunblog/13-post-condo-plants.html) |
