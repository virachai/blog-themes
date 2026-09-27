---
name: hidden-widget-title-labels
description: HTML3 and HTML4 widget titles are editor-only labels and must stay hidden on the blog
metadata:
  pinned: false
---

In the Mee Prompt theme and its MeeFun staging clone, the `title` of the HTML3 widget ("มาทำความรู้จักมีพร้อม") and the HTML4 widget ("menu-footer-menu-container") is only a label so the owner can recognise the widget in Blogger's Layout editor. The theme hides these titles with `#HTML3 > h3.title {display:none}` and `#HTML4.widget.HTML > h3.title {display:none}`. If either title shows on the page, treat it as a regression.

This came up on 2026-09-27, when theme CSS was moved out of the XML into `02-meefunblog/04-theme-base.css`. The moved blocks were still XML-encoded (`&gt;`), so the browser dropped those rules and both labels appeared. When moving CSS out of Blogger XML, decode `&gt; &lt; &quot; &#39; &amp;` first, then check the desktop layout for visible HTML3/HTML4 titles.
