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
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createEvidence, hashText } from './cdp-runtime/evidence.mjs';
import { verifyEvidenceLedger, assertEvidenceSupportsPublication } from './cdp-runtime/adversarial-verifier.mjs';
import { classifyBloggerPage, assertPublishable, externalIdFor } from './blogger-page-state.mjs';
import { resolvePublicationTitle, assertPublicationPayload } from './publication-payload.mjs';
import { AUTHORITATIVE_WRITER_FILE, isAuthoritativeReceipt, buildPublicationReceipt, assertAuthoritativeReceipt } from './publication-receipt.mjs';

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

// --- E. Publication payload: the title has a declared source -----------------
// The asset spec derived from a mission block with no title field, so
// `run.asset?.title` was always '' and the stage 61 publish path threw a generic
// "requires title and body" on every asset shaped like VLM-001.

const untitled = resolvePublicationTitle({ mission: { issue: 'Define the real user problem' } });
if (untitled.title !== null) fail('E1 a mission with no title field produced a title out of nowhere');
if (untitled.source !== null) fail('E2 a mission with no title reported a title source');
const titled = resolvePublicationTitle({ mission: { title: '  A real declared title  ' } });
if (titled.title !== 'A real declared title') fail('E3 the declared title was not resolved and trimmed');
if (titled.source !== 'mission.title') fail('E4 the title source was misreported as ' + titled.source);
if (resolvePublicationTitle({ mission: { title: 'a' }, asset: { title: 'b' } }).title !== 'b') fail('E5 asset.title does not take precedence over mission.title');
if (resolvePublicationTitle({ mission: { title: 'a' }, override: 'c' }).title !== 'c') fail('E6 the explicit override does not win');

let gateNamesSource = false;
try { assertPublicationPayload({ title: null, body: 'body' }); } catch (error) { gateNamesSource = /mission\.title/.test(error.message); }
if (!gateNamesSource) fail('E7 the payload gate does not name where the title must come from — the operator sees a generic payload error');

const assetRuntimeSrc = source('scripts/node/value-mission-asset-runtime.mjs');
if (!assetRuntimeSrc?.includes('resolvePublicationTitle')) fail('E8 the asset runtime does not derive the title through the shared resolver');
if (!assetRuntimeSrc?.includes('title_missing')) fail('E9 the asset runtime does not record a title blocker when no title is declared');
if (source('scripts/node/blogger-publication-adapter.mjs')?.includes('requires title and body')) fail('E10 the adapter still throws the generic payload error instead of naming the missing source');

// --- F. Legacy evidence cannot be revived ------------------------------------
// The VLM-001 record predates the field-mismatch fix: no claim, no snapshot, and
// a content_hash that is a constant. Its hash is preserved for audit and it is
// rejected on its marker, so a later edit cannot quietly make it valid again.

const legacyLedgerPath = '04-revenue-system/07-intelligence/runs/VLM-001-20260928085443/ledger.json';
const legacyRecord = existsSync(join(ROOT, legacyLedgerPath)) ? JSON.parse(readFileSync(join(ROOT, legacyLedgerPath), 'utf8')).records?.[0] : null;
if (!legacyRecord) {
  fail('F0 the VLM-001 legacy ledger record is missing — it is kept for audit, not deleted');
} else {
  if (legacyRecord.content_hash !== CONSTANT_HASH) fail('F1 the legacy record content_hash was rewritten; it must be preserved unchanged for audit');
  if (!legacyRecord.legacy_status) fail('F2 the legacy record carries no legacy_status marker');
  const legacyFindings = verifyEvidenceLedger([legacyRecord]);
  if (!legacyFindings.some(f => f.id === 'E003')) fail('F3 the verifier no longer flags the legacy record as incomplete');
  if (!legacyFindings.some(f => f.id === 'E006')) fail('F4 the verifier does not reject the record on its legacy marker');

  let legacyAccepted = false;
  try { assertEvidenceSupportsPublication(legacyRecord); legacyAccepted = true; } catch { legacyAccepted = false; }
  if (legacyAccepted) fail('F5 a LEGACY_INVALID record was accepted as publication evidence');

  // The important one: repairing the shape must not revive it.
  const revived = { ...legacyRecord, claim: 'a claim added later', observed_at: '2026-09-28T15:00:00.000Z' };
  let revivedAccepted = false;
  try { assertEvidenceSupportsPublication(revived); revivedAccepted = true; } catch { revivedAccepted = false; }
  if (revivedAccepted) fail('F6 a legacy-marked record was accepted once a claim was added — the legacy marker must block regardless of shape');
}

// --- G. publication-receipt.json has exactly one writer ----------------------
// Three runtimes used to write this path with incompatible shapes, and two
// consumers read different fields of whichever shape was on disk.

function receiptWriters() {
  const found = [];
  for (const dir of ['scripts/node', 'scripts/node/cdp-runtime']) {
    for (const name of readdirSync(join(ROOT, dir))) {
      if (!name.endsWith('.mjs')) continue;
      const rel = dir + '/' + name;
      const src = source(rel);
      if (!src) continue;
      for (const m of src.matchAll(/(?:save|writeFileSync)\(/g)) {
        if (/RECEIPT_FILE|publication-receipt\.json/.test(src.slice(m.index, m.index + 200))) { found.push(rel); break; }
      }
    }
  }
  return found.sort();
}

const writers = receiptWriters();
if (writers.length !== 1) {
  fail('G1 ' + writers.length + ' files write publication-receipt.json (' + writers.join(', ') + ') — exactly one authoritative writer is allowed');
} else if (writers[0] !== AUTHORITATIVE_WRITER_FILE) {
  fail('G2 publication-receipt.json is written by ' + writers[0] + ', not the authoritative writer ' + AUTHORITATIVE_WRITER_FILE);
}

// A foreign writer's output must be rejected on read.
const legacyReceipt = { runtime: 'value-mission-publication-runtime-v1', run_id: 'VLM-001-20260928085443', status: 'BLOCKED', publication: { status: 'NOT_EXECUTED', url: '', published_at: '', external_id: '' } };
if (isAuthoritativeReceipt(legacyReceipt)) fail('G3 a receipt from a non-authoritative runtime was accepted as authoritative');
let foreignAccepted = false;
try { assertAuthoritativeReceipt(legacyReceipt); foreignAccepted = true; } catch { foreignAccepted = false; }
if (foreignAccepted) fail('G4 assertAuthoritativeReceipt accepted a foreign writer receipt');

// The receipt builder only accepts facts from a verified public post.
const goodVerification = { status: 'PASS', page_state: 'PUBLISHED_CANDIDATE', external_id: PUBLIC_URL, url: PUBLIC_URL, published_at: '2026-08-01T00:00:00.000Z' };
const goodReceipt = buildPublicationReceipt({ runId: 'r', verification: goodVerification, verifiedAt: '2026-09-28T15:00:00.000Z' });
if (goodReceipt.publication.url !== PUBLIC_URL) fail('G5 the receipt url does not come from the verified public post');
if (goodReceipt.publication.external_id !== PUBLIC_URL) fail('G6 the receipt external_id does not come from the verified public post');
if (goodReceipt.publication.published_at !== '2026-08-01T00:00:00.000Z') fail('G7 the receipt dropped the post page publication date');
if (assertAuthoritativeReceipt(goodReceipt) !== goodReceipt) fail('G8 a well-formed authoritative receipt was rejected');

for (const [label, verification] of [
  ['an editor page', { status: 'PASS', page_state: 'EDITING', external_id: 'x', url: 'https://www.blogger.com/blog/post/edit/1/2', published_at: null }],
  ['a failed verification', { status: 'BLOCKED', page_state: 'PUBLISHED_CANDIDATE', external_id: 'x', url: PUBLIC_URL, published_at: null }],
  ['a missing external id', { status: 'PASS', page_state: 'PUBLISHED_CANDIDATE', external_id: '', url: PUBLIC_URL, published_at: null }],
  ['a missing url', { status: 'PASS', page_state: 'PUBLISHED_CANDIDATE', external_id: 'x', url: '', published_at: null }],
]) {
  let built = false;
  try { buildPublicationReceipt({ runId: 'r', verification, verifiedAt: 'now' }); built = true; } catch { built = false; }
  if (built) fail('G9 the receipt builder accepted ' + label);
}

// published_at is never invented from local time.
const noDate = buildPublicationReceipt({ runId: 'r', verification: { status: 'PASS', page_state: 'PUBLISHED_CANDIDATE', external_id: PUBLIC_URL, url: PUBLIC_URL, published_at: null }, verifiedAt: '2026-09-28T15:00:00.000Z' });
if (noDate.publication.published_at !== null) fail('G10 published_at was filled in without a post page date — it must stay null and say so');
if (noDate.publication.published_at_source !== 'unknown') fail('G11 published_at_source does not record that the date was unknown');

// --- H. Every evidence write goes through the declared schema ----------------
// Section D guards the observer and the adapter by name, which is how stage 59
// and stage 60 kept passing raw {type, run_id, observed_at} objects after the
// fix landed: nothing looked at them. This scans every call site instead.

const SELF = 'scripts/node/publication-evidence-check.mjs';
for (const dir of ['scripts/node', 'scripts/node/cdp-runtime']) {
  for (const name of readdirSync(join(ROOT, dir))) {
    if (!name.endsWith('.mjs')) continue;
    const rel = dir + '/' + name;
    // The scanner necessarily contains the patterns it searches for. It writes
    // no evidence itself, so it is the one file excluded from its own scan.
    if (rel === SELF) continue;
    const src = source(rel);
    if (!src) continue;
    for (const m of src.matchAll(/ledger\.add\(/g)) {
      const call = src.slice(m.index, m.index + 600);
      if (!call.startsWith('ledger.add(createEvidence(')) {
        fail('H1 ' + rel + ' calls ledger.add() with a raw object; evidence fields must be built by createEvidence() so the hash varies with content');
        continue;
      }
      if (!/\bclaim\s*:/.test(call)) fail('H2 ' + rel + ': a createEvidence() call omits claim — the verifier BLOCKs such a record (E003)');
      if (!/\bobservedAt\s*:/.test(call)) fail('H3 ' + rel + ': a createEvidence() call omits observedAt — the caller\'s observed_at would be dropped and replaced with the current time');
    }
  }
}

// The three modules that previously carried raw evidence writes must use the
// schema now. Named explicitly because each was a shipped defect.
for (const rel of ['scripts/node/editorial-production-execution-adapter.mjs']) {
  const src = source(rel);
  if (!src) { fail('H4 ' + rel + ' not found'); continue; }
  if (!src.includes("from './cdp-runtime/evidence.mjs'")) fail('H5 ' + rel + ' does not import createEvidence');
}

// --- Report -----------------------------------------------------------------

if (errors.length) {
  console.log('PUBLICATION-EVIDENCE-CHECK: FAIL');
  errors.forEach(e => console.log('- ' + e));
} else {
  console.log('PUBLICATION-EVIDENCE-CHECK: PASS (evidence varies with content, every evidence write uses the declared schema, verifier wired, editor ≠ public post, external id required, legacy evidence cannot be revived, receipt has one writer, title has a declared source, source guards hold)');
}
process.exitCode = errors.length ? 1 : 0;
