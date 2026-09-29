/**
 * publication-receipt.json — authority, single writer, and field provenance.
 *
 * The receipt path previously had three producers writing incompatible shapes:
 *
 *   - blogger-publication-adapter.mjs (61)   write after verified publish
 *   - email-to-blogger-publication-observer  write whenever a title matched (removed)
 *
 * Two consumers then read *different fields* of whichever shape happened to be on
 * disk — editorial-production-loop-runtime.mjs reads the top-level `status`,
 * for a run that had never been published.
 *
 * Stage 61 is now the only writer, and a receipt is only authoritative when it
 * came from stage 61. Everything else at that path is a legacy artifact and is
 * rejected on its `runtime` field.
 */

export const RECEIPT_FILE = 'publication-receipt.json';

/** The one runtime permitted to write a receipt. */
export const AUTHORITATIVE_RUNTIME = 'blogger-publication-adapter-v1';

/** The one file permitted to write it — asserted by the regression check. */
export const AUTHORITATIVE_WRITER_FILE = 'scripts/node/blogger-publication-adapter.mjs';

/** True only for a receipt stage 61 produced. Legacy shapes return false. */
export function isAuthoritativeReceipt(receipt) {
  return !!receipt && receipt.runtime === AUTHORITATIVE_RUNTIME;
}

/**
 * Build the receipt for a verified publication.
 *
 * Every publication fact is taken from the verification of the live public post.
 * `published_at` is read from the post page when the theme exposes it and is
 * otherwise null — it is never filled in from local wall-clock time, because
 * that would state a publication time the evidence does not support. The time
 * this process confirmed the post is recorded separately as `verified_at`.
 */
export function buildPublicationReceipt({ runId, verification, evidenceId = null, transactionId = null, verifiedAt }) {
  if (verification?.status !== 'PASS') {
    throw new Error('refusing to build a receipt from a verification that did not pass (status: ' + (verification?.status ?? 'MISSING') + ')');
  }
  if (verification.page_state !== 'PUBLISHED_CANDIDATE') {
    throw new Error('refusing to build a receipt: page_state is ' + (verification.page_state ?? 'MISSING') + ', not a verified public post');
  }
  const externalId = String(verification.external_id ?? '').trim();
  if (!externalId) throw new Error('refusing to build a receipt without an external id');
  const postUrl = String(verification.url ?? '').trim();
  if (!postUrl) throw new Error('refusing to build a receipt without a public post URL');
  const publishedAt = String(verification.published_at ?? '').trim() || null;

  return {
    runtime: AUTHORITATIVE_RUNTIME,
    run_id: runId,
    status: 'PUBLISHED',
    publication: {
      status: 'PUBLISHED',
      url: postUrl,
      external_id: externalId,
      page_state: verification.page_state,
      verified_at: verifiedAt,
      published_at: publishedAt,
      published_at_source: publishedAt ? 'public-post-page' : 'unknown',
    },
    evidence_id: evidenceId,
    transaction_id: transactionId,
  };
}

/**
 * Read-side gate. A PUBLISHED claim is accepted only from an authoritative
 * writer, with the three fields that must come from a verified public post.
 */
export function assertAuthoritativeReceipt(receipt) {
  if (!receipt) throw new Error('no ' + RECEIPT_FILE + ' present');
  if (!isAuthoritativeReceipt(receipt)) {
    throw new Error('receipt is not authoritative: runtime is "' + (receipt.runtime ?? 'MISSING') + '", expected "' + AUTHORITATIVE_RUNTIME + '" (legacy or foreign writer)');
  }
  if (receipt.status !== 'PUBLISHED' || receipt.publication?.status !== 'PUBLISHED') {
    throw new Error('receipt does not claim PUBLISHED');
  }
  for (const field of ['url', 'external_id']) {
    if (!String(receipt.publication?.[field] ?? '').trim()) throw new Error('receipt publication.' + field + ' is empty — it must come from the verified public post');
  }
  if (receipt.publication.page_state !== 'PUBLISHED_CANDIDATE') {
    throw new Error('receipt publication.page_state is ' + (receipt.publication.page_state ?? 'MISSING') + ', not a verified public post');
  }
  return receipt;
}
