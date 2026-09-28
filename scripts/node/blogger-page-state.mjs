/**
 * Blogger page-state classification — one shared answer to "what page is this?"
 *
 * The stage 61 adapter and the stage 62 observer both need to decide whether the
 * browser target they hold is a published post or something else. They previously
 * answered it separately and disagreed: the adapter accepted only `blogger.com`
 * (rejecting real posts on blogspot.com), while both paths treated any URL
 * matching /post/ as published — which includes the Blogger editor at
 * https://www.blogger.com/blog/post/edit/<blogId>/<postId>.
 *
 * Invariant this module exists to protect:
 *
 *     EDITOR_URL ≠ PUBLIC_POST_URL
 *
 * A Blogger admin surface is never a published post, no matter what its path
 * contains or what its document title says.
 */

export const PAGE_STATES = Object.freeze(['EDITING', 'PUBLISHED_CANDIDATE', 'UNKNOWN']);

const BLOGGER_ADMIN_HOST = /(^|\.)blogger\.com$/i;
const BLOGSPOT_HOST = /(^|\.)blogspot\.com$/i;

/** Blogger's post editor: /blog/post/edit/<blogId>/<postId> — an unpublished draft surface. */
const EDITOR_PATH = /^\/blog\/post\/edit\//i;

/** A public Blogger post path: /YYYY/MM/slug.html (same shape on blogspot.com and custom domains). */
const PUBLIC_POST_PATH = /^\/\d{4}\/\d{2}\/[^/]+\.html$/;

/**
 * Classify a URL as an editing surface, a public post, or neither.
 *
 * @param {string} rawUrl
 * @param {{ publicHost?: string|null }} [options] custom domain treated as a public publication host
 * @returns {{ state: string, reason: string, post_url: string|null, host: string|null }}
 */
export function classifyBloggerPage(rawUrl, { publicHost = null } = {}) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { state: 'UNKNOWN', reason: 'unparseable-url', post_url: null, host: null };
  }

  const host = url.hostname;
  const path = url.pathname;

  // Blogger's own admin surface comes first: it must never fall through to the
  // public-post branch, whatever its path happens to contain.
  if (BLOGGER_ADMIN_HOST.test(host)) {
    if (EDITOR_PATH.test(path)) return { state: 'EDITING', reason: 'blogger-editor-path', post_url: null, host };
    return { state: 'UNKNOWN', reason: 'blogger-admin-surface', post_url: null, host };
  }

  const isBlogspot = BLOGSPOT_HOST.test(host);
  const isCustom = !!publicHost && host.toLowerCase() === String(publicHost).toLowerCase();
  if (isBlogspot || isCustom) {
    if (PUBLIC_POST_PATH.test(path)) return { state: 'PUBLISHED_CANDIDATE', reason: 'public-post-path', post_url: url.href, host };
    return { state: 'UNKNOWN', reason: 'public-host-without-post-path', post_url: null, host };
  }

  return { state: 'UNKNOWN', reason: 'host-not-blogger', post_url: null, host };
}

/**
 * True when the URL is on a Blogger publication or admin host. Replaces the
 * narrower `hostname.endsWith('blogger.com')` check that rejected blogspot.com.
 * This says "we are talking to Blogger", NOT "this post is published" — use
 * classifyBloggerPage() for that.
 */
export function isBloggerHost(rawUrl, { publicHost = null } = {}) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (BLOGGER_ADMIN_HOST.test(url.hostname) || BLOGSPOT_HOST.test(url.hostname)) return true;
  return !!publicHost && url.hostname.toLowerCase() === String(publicHost).toLowerCase();
}

/**
 * The external identity of a public post, derived only from its public URL.
 * A blogspot post URL carries no numeric post id, so the canonical URL is the
 * identity. Returns null when there is no public post to point at.
 */
export function externalIdFor(classification) {
  return classification?.state === 'PUBLISHED_CANDIDATE' ? classification.post_url : null;
}

/**
 * Fail-closed gate: only a classified public post with a real external identity
 * may be recorded as PUBLISHED. Returns the external id, or throws.
 */
export function assertPublishable(classification) {
  const state = classification?.state;
  if (state === 'EDITING') throw new Error('publication refused: target is the Blogger editor, not a published post');
  if (state !== 'PUBLISHED_CANDIDATE') throw new Error('publication refused: target is not a recognised public Blogger post (state: ' + (state || 'MISSING') + ')');
  const externalId = externalIdFor(classification);
  if (!externalId) throw new Error('publication refused: no external id can be derived from the public post URL');
  return externalId;
}
