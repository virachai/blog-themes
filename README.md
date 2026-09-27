# Blog Themes

Shared CSS and JS for the owner's Blogger blogs, served by GitHub Pages. Each blog's Blogger theme loads its stylesheet from this repository, so layout changes ship with a commit instead of a theme edit.

## URL pattern

```
https://virachai.github.io/blog-themes/<blog>/theme.css
```

| Blog | Folder | Stylesheet |
| :-- | :-- | :-- |
| Mee Prompt (meeprompt.blogspot.com) | [meeprompt/](meeprompt/README.md) | `https://virachai.github.io/blog-themes/meeprompt/theme.css` |
| MeeFun staging (meefunblog.blogspot.com) | [meefunblog/](meefunblog/README.md) | Uses the Mee Prompt stylesheet |

## Setup (once)

1. Create the public repository `virachai/blog-themes` on GitHub and push this folder.
2. Open Settings → Pages, choose **Deploy from a branch**, then `main` / `(root)`.
3. In the blog's theme, load the stylesheet in `<head>` (the Mee Prompt theme v2 already does this):

   ```html
   <link href='https://virachai.github.io/blog-themes/meeprompt/theme.css?v=1' rel='stylesheet'/>
   ```

## Updating a theme

1. Edit `<blog>/theme.css` and commit.
2. Push. GitHub Pages redeploys in about a minute and serves the file with `Cache-Control: max-age=600`, so visitors see the change within about 10 minutes.
3. For a change that must show immediately, raise the `?v=` number in the Blogger theme.

## Rules

- One folder per blog. Each folder has its own README.
- Scope every rule to the blog's existing classes (`.post-body`, `.widget`) or to the `mp-` component prefix, so a stylesheet cannot break Blogger's own layout.
- Do not put secrets, tracking IDs or personal data in this public repository.
- `.nojekyll` keeps GitHub Pages from running Jekyll, so files are served as-is.
