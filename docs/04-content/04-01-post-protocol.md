# 04-01 Post Protocol

Every post follows these rules, whether it is created in the Blogger editor or sent by **Post via email** (which cannot set a custom permalink, labels or a search description).

## 1. Title: Thai first, English keywords in brackets

```
{Thai title} ({3–5 English keywords})
ต้นไม้ในคอนโดแสงน้อย: 3 ต้นที่เลี้ยงรอด (Low Light Condo Plants)
```

- Blogger builds the permalink from the ASCII part of the title only, so the English keywords become the URL, e.g. `/2026/09/3-low-light-condo-plants.html`. Thai-only titles give meaningless URLs such as `/3-0001.html`.
- Keep the English part to 3–5 words; Blogger truncates long slugs.
- Do not put the post ID in the title. It shows up in Google results and the URL.
- Blogger adds a suffix itself if two posts end up with the same URL, so the ID is not needed for uniqueness.

## 2. Post ID: a hidden marker as the first line of the body

```html
<div class="mp-id" data-id="0002"></div>
```

- Four digits, unique, never reused. The next post takes the highest ID + 1. The register is below.
- The marker has no text, so it never appears in snippets, cards or feeds.
- Legacy: post #0001 was published with `#0001` at the end of its title; `05-theme.js` still reads that.

## 3. Linking another post: type its ID

Write `#0001` anywhere in the body text. `05-theme.js` reads the blog feed and replaces it with a link whose text is that post's title. Unknown IDs and the post's own ID stay plain text; IDs inside code blocks or existing links are left alone. This works for email posts because the target URL does not need to be known when writing.

## 4. Body structure

1. Lead image: `<div class="separator"><img ...></div>` then `<p class="mp-caption">ภาพ: {photographer} / Pexels</p>`.
2. `<div class="mp-summary">` with a 1–2 sentence summary. With email posting there is no search description, so Google and the home-page card use this first text.
3. Intro paragraph, then `<div id="toc_container"><h2>สารบัญ</h2></div>`.
4. `<h2 title="{short TOC label}">` sections, optional `<h3>`, images with captions, `mp-note` / `mp-evidence` boxes.
5. Images come from Pexels, are stored in `02-meefunblog/11-images/` with credits in its README, and are linked from GitHub Pages.
6. Facts that could harm a reader (health, pets, money) cite a source; never invent numbers.

## 5. After publishing (Blogger editor, a few minutes)

Email posting cannot set these, so add them afterwards if possible: labels, and a search description (the summary sentence). Then ask for a CDP check of the post URL at 390px and 1366px.

## Post register

| ID | Title | Body file | URL |
| --- | --- | --- | --- |
| 0001 | ต้นไม้ในคอนโดแสงน้อย: 3 ต้นที่เลี้ยงรอด | [13-post-condo-plants.html](../../02-meefunblog/13-post-condo-plants.html) | https://meefunblog.blogspot.com/2026/09/3-0001.html (legacy ID in title) |
