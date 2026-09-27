---
name: improve-prototype-incrementally
description: The staging blog is a prototype to improve gradually, one small verified change at a time
metadata:
  pinned: false
---

The owner treats the meefunblog staging site as a prototype ("ต้นแบบ") to be improved gradually rather than redesigned in big jumps. Work should come in small, self-contained rounds: one improvement, previewed on the real staging pages with CDP at 390px and 1366px, committed and pushed, then reported with what is still open. Prefer CSS/JS changes in the repo, which go live without the owner pasting XML, and batch any XML edits so the owner pastes the theme as rarely as possible.

This matters because each round so far surfaced side effects only visible on the live pages (cache, base-theme floats, Blogger markup), and small rounds kept them easy to find and undo.
