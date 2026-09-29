#!/usr/bin/env node
/** Read the newest public Blogger post URL from the public Atom/JSON feed. */
import { loadDotEnv } from './dotenv.mjs';

loadDotEnv();

const DEFAULT_FEED = 'https://meefunblog.blogspot.com/feeds/posts/default?alt=json&max-results=10';

function textValue(value) {
  return value && typeof value === 'object' && '$t' in value ? String(value.$t) : String(value || '');
}

function normaliseUrl(value) {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) throw new Error('feed entry URL must be http(s)');
  return url.toString();
}

export async function getBloggerPosts(feedUrl = process.env.BLOGGER_FEED_URL || DEFAULT_FEED) {
  const response = await fetch(feedUrl, { headers: { accept: 'application/json, application/atom+xml;q=0.9, text/xml;q=0.8' }, redirect: 'follow' });
  if (!response.ok) throw new Error('Blogger feed request failed: HTTP ' + response.status);
  const raw = await response.text();
  let feed;
  try { feed = JSON.parse(raw); } catch { throw new Error('Blogger feed did not return JSON; use ?alt=json'); }
  const entries = feed?.feed?.entry;
  if (!Array.isArray(entries) || entries.length === 0) throw new Error('Blogger feed contains no posts');
  const posts = entries.map(entry => {
    const alternate = (entry.link || []).find(link => link.rel === 'alternate' && link.href);
    if (!alternate?.href) throw new Error('Blogger feed entry has no alternate URL');
    return { url: normaliseUrl(alternate.href), title: textValue(entry.title), published_at: textValue(entry.published) || null, updated_at: textValue(entry.updated) || null, id: textValue(entry.id) || null };
  });
  posts.sort((a, b) => new Date(b.published_at || b.updated_at || 0) - new Date(a.published_at || a.updated_at || 0));
  return { feed_url: feedUrl, posts, entries_checked: posts.length, fetched_at: new Date().toISOString() };
}

export async function getLastBloggerPost(feedUrl = process.env.BLOGGER_FEED_URL || DEFAULT_FEED) {
  const result = await getBloggerPosts(feedUrl);
  return { feed_url: result.feed_url, last: result.posts[0], entries_checked: result.entries_checked, fetched_at: result.fetched_at };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await getLastBloggerPost(process.argv[2]);
  console.log(JSON.stringify(result, null, 2));
}
