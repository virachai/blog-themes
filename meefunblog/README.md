# MeeFun Staging

[meefunblog.blogspot.com](https://meefunblog.blogspot.com/) is the staging blog for Mee Prompt. Theme and layout changes are tried here before they go live on Mee Prompt.

- It loads the Mee Prompt stylesheet directly (`../meeprompt/theme.css`), so no copy is kept in this folder.
- Its theme carries `<meta name="robots" content="noindex,nofollow">` so search engines do not index it as a duplicate of Mee Prompt.

## Release check

1. Restore the staging theme on meefunblog and publish the test post.
2. Check the post on a phone and on a desktop: Thai line height, the wide table scrolls sideways, and every `mp-` component renders.
3. When everything passes, apply the same change to Mee Prompt.
