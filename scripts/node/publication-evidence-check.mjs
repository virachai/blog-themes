#!/usr/bin/env node
/**
 * Publication evidence invariants — regression gate.
 *
 * Usage: node scripts/node/publication-evidence-check.mjs   (exit 0 ok, 1 fail)
 *
 * Asserts the four invariants the editorial pipeline depends on:
 *
 *     EMAIL_SENT   ≠ PUBLISHED
 *     EDITOR_URL   ≠ PUBLIC_POST_URL
 *     OBSERVED     ≠ VERIFIED
 *     VERIFIED     ≠ PUBLISHED
 *
 * Each assertion below corresponds to a defect that shipped in the stage 58-62
 * pipeline: a PUBLISHED receipt mintable from an unpublished editor page, and an
 * evidence ledger whose content_hash was a constant because every caller passed
 * field names createEvidence() never read.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createEvidence, hashText } from './cdp-runtime/evidence.mjs';
import { verifyEvidenceLedger } from './cdp-runtime/adversarial-verifier.mjs';
import { classifyBloggerPage, assertPublishable, externalIdFor } from './blogger-page-state.mjs';

const ROOT = process.cwd();
const errors = [];
const fail = message => errors.push(message);

const EDITOR_URL = 'https://www.blogger.com/blog/post/edit/6973756749045108777/6268864657932604137';
const PUBLIC_URL = 'https://meeprompt.blogspot.com/2026/08/blog-post.html';
const CONSTANT_HASH = '7e09b49294dd7a7a5e3180ff2cf1ddcb1476bf368df6539aa65ec40ca6bcf4c9';

const source = rel => existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), 'utf8') : null;

// --- A. Evidence records must vary with what was observed -------------------
// The shipped bug: every caller passed {type, run_id, verified, target,
// fingerprint, observed_at} to a function reading {claim, sourceUrl, snapshot,
// ...}, so all fields were undefined and content_hash was constant.

const observationA = createEvidence({
  claim: 'blogger publication observed for VLM-001',
  sourceUrl: PUBLIC_URL,
  snapshot: '{"url":"' + PUBLIC_URL + '","title":"Post A"}',
  screenshot: null,
  observedAt: '2026-09-28T15:00:00.000Z',
  metadata: { run_id: 'VLM-001-20260928085443', page_state: 'PUBLISHED_CANDIDATE' },
});
const observationB = createEvidence({
  claim: 'blogger publication observed for VLM-001',
  sourceUrl: 'https://meeprompt.blogspot.com/2026/08/a-different-post.html',
  snapshot: '{"url":"https://meeprompt.blogspot.com/2026/08/a-different-post.html","title":"Post B"}',
  screenshot: null,
  observedAt: '2026-09-28T15:05:00.000Z',
  metadata: { run_id: 'VLM-001-20260928085443', page_state: 'PUBLISHED_CANDIDATE' },
});

if (observationA.content_hash === observationB.content_hash) {
  fail('A1 evidence content_hash does not vary with content — two different observations produced the same hash (' + observationA.content_hash.slice(0, 16) + '…)');
}
if (observationA.content_hash === CONSTANT_HASH) {
  fail('A2 evidence content_hash is the known-constant value ' + CONSTANT_HASH.slice(0, 16) + '… — evidence fields are being dropped again');
}
for (const key of ['claim', 'source_url', 'observed_at', 'selector', 'snapshot', 'screenshot', 'content_hash', 'metadata']) {
  if (!(key in observationA)) fail('A3 evidence record is missing the "' + key + '" field');
  else if (observationA[key] === undefined) fail('A4 evidence field "' + key + '" is undefined — the caller and createEvidence() disagree on field names');
}
if (observationA.observed_at !== '2026-09-28T15:00:00.000Z') {
  fail('A5 observed_at was replaced (' + observationA.observed_at + ') — pass observedAt, not observed_at, or the real observation time is lost');
}
if (observationA.metadata?.run_id !== 'VLM-001-20260928085443') {
  fail('A6 metadata does not carry observer-specific data (run_id) through to the record');
}

// The verifier already encodes this defect: E003 BLOCKs evidence with no claim
// or observed_at. It shipped unused, so nothing caught the original bug.
const verifierFindings = verifyEvidenceLedger([{ ...observationA, id: 'evt-1' }]);
const blocking = verifierFindings.filter(f => f.severity === 'BLOCK');
if (blocking.length) {
  fail('A7 evidence for a valid observation does not pass the adversarial verifier: ' + blocking.map(f => f.id + '/' + f.check).join(', '));
}
const legacyShaped = verifyEvidenceLedger([{
  id: 'legacy-1',
  observed_at: '2026-09-28T15:00:00.000Z',
  selector: null, snapshot: null, screenshot: null,
  content_hash: CONSTANT_HASH,
  metadata: {},
}]);
if (!legacyShaped.some(f => f.id === 'E003')) {
  fail('A8 the verifier no longer catches the legacy field-mismatch shape — the guard that would detect this regression is gone');
}

// --- B. Editor URLs are not published posts ---------------------------------
// EDITOR_URL ≠ PUBLIC_POST_URL. The editor path contains "/post/" and its
// document title contains the post title, so both naive checks passed on it.

const editorClass = classifyBloggerPage(EDITOR_URL);
if (editorClass.state !== 'EDITING') {
  fail('B1 the Blogger editor URL classifies as ' + editorClass.state + ', not EDITING — the /blog/post/edit/ path is an unpublished draft surface');
}
if (editorClass.post_url) {
  fail('B2 the editor URL yielded a post_url (' + editorClass.post_url + ') — an editing surface has no public post URL');
}
const publicClass = classifyBloggerPage(PUBLIC_URL);
if (publicClass.state !== 'PUBLISHED_CANDIDATE') {
  fail('B3 a public blogspot post classifies as ' + publicClass.state + ', not PUBLISHED_CANDIDATE');
}
if (publicClass.post_url !== PUBLIC_URL) {
  fail('B4 the public post URL was not preserved as post_url');
}
if (classifyBloggerPage('https://www.blogger.com/blog/posts/123').state === 'PUBLISHED_CANDIDATE') {
  fail('B5 a Blogger admin list page classified as a published post');
}

// --- C. No PUBLISHED claim without a real external identity -----------------

let editorRefused = false;
try { assertPublishable(editorClass); } catch { editorRefused = true; }
if (!editorRefused) fail('C1 assertPublishable accepted the Blogger editor URL as publishable');

if (externalIdFor(editorClass) !== null) fail('C2 the editor URL produced an external id');
if (!externalIdFor(publicClass)) fail('C3 the public post produced no external id — a PUBLISHED receipt would carry an empty external_id');
if (!assertPublishable(publicClass)) fail('C4 assertPublishable returned no external id for a valid public post');

// --- D. Source guards against reintroduction --------------------------------
// Static guards: these are the checks that fail if someone re-adds the removed
// code paths. They assert absence, so they are deliberately blunt.

const observerSrc = source('scripts/node/email-to-blogger-publication-observer.mjs');
if (observerSrc === null) fail('D0 observer source not found');
else {
  // The observer may *reference* the receipt (it refuses to run when one already
  // exists) but must never *write* it. Check the write call sites, not the name.
  let writesReceipt = false;
  for (const m of observerSrc.matchAll(/(?:save|writeFileSync)\(/g)) {
    if (/RECEIPT_FILE|publication-receipt\.json/.test(observerSrc.slice(m.index, m.index + 200))) { writesReceipt = true; break; }
  }
  if (writesReceipt) {
    fail('D1 the observer writes publication-receipt.json — the observer is observation-only; the receipt belongs to the gated stage 60/61 transaction path');
  }
  if (!/RECEIPT_FILE|publication-receipt\.json/.test(observerSrc)) {
    fail('D1b the observer no longer checks whether a publication receipt already exists — it could overwrite or race the transaction path');
  }
  if (/['"]PUBLISHED['"]/.test(observerSrc)) {
    fail('D1c the observer contains a "PUBLISHED" status — observation vocabulary is OBSERVED / OBSERVATION_PENDING only');
  }
  if (!observerSrc.includes('./blogger-page-state.mjs')) {
    fail('D2 the observer does not use the shared page-state classifier');
  }
  if (!observerSrc.includes('BLOGGER_TARGET_ID')) {
    fail('D3 the observer does not reference BLOGGER_TARGET_ID — an unforced target can inspect the wrong tab');
  }
}

const adapterSrc = source('scripts/node/blogger-publication-adapter.mjs');
if (adapterSrc === null) fail('D0 adapter source not found');
else {
  if (adapterSrc.includes('/\\/post\\/') || adapterSrc.includes('/published|post/i')) {
    fail('D4 the stage 61 adapter still decides publication with a /post/ regex — that matches the editor URL and any title containing "post"');
  }
  if (!adapterSrc.includes('./blogger-page-state.mjs')) {
    fail('D5 the stage 61 adapter does not use the shared page-state classifier');
  }
  if (!adapterSrc.includes('assertPublishable')) {
    fail('D6 the stage 61 adapter does not gate its PUBLISHED receipt through assertPublishable');
  }
}

// --- Report -----------------------------------------------------------------

if (errors.length) {
  console.log('PUBLICATION-EVIDENCE-CHECK: FAIL');
  errors.forEach(e => console.log('- ' + e));
} else {
  console.log('PUBLICATION-EVIDENCE-CHECK: PASS (evidence varies with content, verifier wired, editor ≠ public post, external id required, source guards hold)');
}
process.exitCode = errors.length ? 1 : 0;
