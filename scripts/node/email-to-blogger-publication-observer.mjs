#!/usr/bin/env node
/**
 * Stage 62 — Email-to-Blogger Publication Observer.
 *
 * Observation only. This runtime records what is on screen and nothing more.
 * It never writes `publication-receipt.json` — that receipt belongs to the
 * gated stage 60/61 transaction path, which enforces release readiness,
 * approval, idempotency and fencing before any publication claim.
 *
 *     EMAIL_SENT ≠ PUBLISHED
 *     EDITOR_URL ≠ PUBLIC_POST_URL
 *     OBSERVED   ≠ VERIFIED
 *     VERIFIED   ≠ PUBLISHED
 *
 * A previous version minted a PUBLISHED receipt whenever the target host was
 * blogger.com and the page text contained the title — both true of the Blogger
 * *editor*, so an unpublished draft could be recorded as published. It also
 * wrote evidence through a field schema createEvidence() does not read, so the
 * ledger stored no claim, no snapshot and a constant content_hash.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CdpSession } from './cdp-runtime/cdp-session.mjs';
import { EvidenceLedger } from './cdp-runtime/evidence-ledger.mjs';
import { createEvidence } from './cdp-runtime/evidence.mjs';
import { classifyBloggerPage } from './blogger-page-state.mjs';
import { loadDotEnv } from './dotenv.mjs';
import { getBloggerPosts } from './blogger-feed-last-url.mjs';

loadDotEnv();

const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');
const RECEIPT_FILE = 'publication-receipt.json';
const MAX_EMBEDDED_SCREENSHOT = 262144; // 256 KiB of base64 before it stops being evidence and starts being repo bloat

const json = file => existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
const save = (dir, name, value) => writeFileSync(join(dir, name), JSON.stringify(value, null, 2) + '\n');
const env = key => (process.env[key] || '').trim();

function load(runId) {
  const dir = join(RUNS, runId);
  const manifest = json(join(dir, 'manifest.json'));
  if (!manifest) throw new Error('run not found: ' + runId);
  return {
    dir,
    manifest,
    release: json(join(dir, 'release-candidate.json')),
    asset: json(join(dir, 'asset-spec.json')),
    email: json(join(dir, 'email-publication-result.json')),
  };
}

function expectedTitle(run) {
  return run.email?.subject || run.asset?.title || '';
}

const normalise = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

/** In-page title probe. Compares normalised title text for exact equality — a
 *  substring test matches a short title against almost any page. */
function titleProbeScript(title) {
  return `(() => {
    const expected = ${JSON.stringify(normalise(title))};
    const norm = s => (s || '').replace(/\\s+/g, ' ').trim().toLowerCase();
    const selectors = ['.post-title', '.entry-title', 'h1.entry-title', 'h3.post-title', 'h1', 'h2', '.post h3'];
    const seen = new Set();
    const candidates = [];
    for (const selector of selectors) {
      for (const el of document.querySelectorAll(selector)) {
        const text = norm(el.innerText || el.textContent);
        if (text && !seen.has(text)) { seen.add(text); candidates.push({ selector, text }); }
      }
    }
    const matched = candidates.find(c => c.text === expected) || null;
    return JSON.stringify({
      url: location.href,
      document_title: document.title,
      expected_title: ${JSON.stringify(title)},
      title_candidates: candidates.slice(0, 10),
      title_elements_found: candidates.length,
      title_match: !!matched,
      matched_selector: matched ? matched.selector : null,
      observed_at: new Date().toISOString()
    });
  })()`;
}

async function observe(session, title) {
  const probe = JSON.parse(await session.evaluate(titleProbeScript(title)));
  const classification = classifyBloggerPage(probe.url, { publicHost: env('BLOGGER_PUBLIC_HOST') || null });
  const snapshot = await session.snapshot();

  let screenshot = null;
  let screenshotBytes = null;
  let screenshotHash = null;
  try {
    const captured = await session.screenshot();
    if (captured) {
      screenshotBytes = captured.length;
      screenshotHash = session.fingerprint({ html: captured });
      if (screenshotBytes <= MAX_EMBEDDED_SCREENSHOT && env('BLOGGER_OBSERVATION_EMBED_SCREENSHOT') === 'YES') screenshot = captured;
    }
  } catch {
    screenshotBytes = -1; // attempted but failed — recorded rather than silently absent
  }

  return { probe, classification, snapshot, screenshot, screenshotBytes, screenshotHash };
}

function preflight(run, runId, { feed = false } = {}) {
  const blockers = [];
  if (run.email?.status !== 'EMAIL_SENT') blockers.push('email_not_sent');
  if (env('EMAIL_PUBLISH_CONFIRM') !== 'YES') blockers.push('operator_consent_missing');
  if (!feed && !env('BLOGGER_TARGET_ID')) blockers.push('BLOGGER_TARGET_ID_missing');
  if (existsSync(join(run.dir, RECEIPT_FILE))) blockers.push('receipt_already_exists');
  return { status: blockers.length ? 'BLOCKED' : 'PASS', blockers, run_id: runId };
}

async function observeFeed(run, runId) {
  const expected = normalise(expectedTitle(run));
  const marker = 'data-run-id="' + runId + '"';
  const timeoutMs = Number(env('BLOGGER_FEED_TIMEOUT_MS') || 60000);
  const intervalMs = Number(env('BLOGGER_FEED_POLL_MS') || 3000);
  const started = Date.now();
  let lastTitles = [];

  while (Date.now() - started <= timeoutMs) {
    const result = await getBloggerPosts();
    const candidates = result.posts.filter(post => normalise(post.title) === expected);
    lastTitles = result.posts.slice(0, 5).map(post => post.title);

    for (const candidate of candidates) {
      const response = await fetch(candidate.url, { headers: { accept: 'text/html' }, redirect: 'follow' });
      if (!response.ok) continue;
      const html = await response.text();
      if (!html.includes(marker)) continue;
      const classification = classifyBloggerPage(candidate.url, { publicHost: env('BLOGGER_PUBLIC_HOST') || null });
      if (classification.state !== 'PUBLISHED_CANDIDATE') throw new Error('feed returned a non-public post URL');
      const observation = {
        runtime: 'email-to-blogger-publication-observer-v1', stage: 62, run_id: runId,
        status: 'OBSERVED', source: 'blogger-public-feed',
        page_state: classification.state, page_state_reason: classification.reason,
        public_post_url: classification.post_url, title_match: true, correlation: 'title+run-marker',
        run_marker: marker, expected_title: expectedTitle(run), observed_title: candidate.title,
        published_at: candidate.published_at, updated_at: candidate.updated_at,
        blogger_entry_id: candidate.id, feed_url: result.feed_url,
        entries_checked: result.entries_checked, observed_at: result.fetched_at,
        boundary: 'Public feed observation. It does not itself write publication-receipt.json.'
      };
      save(run.dir, 'email-publication-observation.json', observation);
      console.log(JSON.stringify(observation, null, 2));
      return;
    }
    if (Date.now() - started + intervalMs > timeoutMs) break;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error('Blogger feed did not expose the expected title+run-marker within timeout; recent titles: ' + lastTitles.join(' | '));
}

async function main() {
  const [command, runId] = process.argv.slice(2);
  if (!runId || !['observe', 'observe-feed'].includes(command)) throw new Error('usage: email-to-blogger-publication-observer.mjs observe|observe-feed <run_id>');

  if (command === 'observe-feed') {
    const run = load(runId);
    const pf = preflight(run, runId, { feed: true });
    if (pf.status !== 'PASS') {
      console.log(JSON.stringify({ runtime: 'email-to-blogger-publication-observer-v1', stage: 62, run_id: runId, status: 'BLOCKED', preflight: pf, action: 'NO_OBSERVATION_ATTEMPTED' }, null, 2));
      process.exitCode = 2;
      return;
    }
    await observeFeed(run, runId);
    return;
  }

  const run = load(runId);
  const pf = preflight(run, runId);
  if (pf.status !== 'PASS') {
    console.log(JSON.stringify({
      runtime: 'email-to-blogger-publication-observer-v1', stage: 62, run_id: runId,
      status: 'BLOCKED', preflight: pf, action: 'NO_OBSERVATION_ATTEMPTED', external_side_effect: false,
      publication_receipt: 'NOT_CREATED_BY_OBSERVER',
    }, null, 2));
    process.exitCode = 2;
    return;
  }

  const endpoint = env('CDP_ENDPOINT') || 'http://127.0.0.1:9222';
  const session = new CdpSession({ endpoint, targetId: env('BLOGGER_TARGET_ID') });

  try {
    await session.connect();
    const observationUrl = env('BLOGGER_OBSERVATION_URL');
    if (observationUrl) await session.navigate(observationUrl);
    await new Promise(r => setTimeout(r, Number(env('BLOGGER_OBSERVATION_DELAY_MS') || 1500)));

    const { probe, classification, snapshot, screenshot, screenshotBytes, screenshotHash } = await observe(session, expectedTitle(run));

    if (session.targetResolvedBy !== 'targetId') throw new Error('target identity was not forced; refusing to record evidence for an unverified tab');

    // OBSERVED ≠ VERIFIED: an exact title match on a public post URL is the
    // strongest thing this observer can say, and it is still not a publication
    // claim. Only the transaction path may promote a candidate to PUBLISHED.
    const pageState = classification.state;
    const observedOnPublicPost = pageState === 'PUBLISHED_CANDIDATE' && probe.title_match;

    const ledger = await EvidenceLedger.load(run.dir);
    const evidence = ledger.add(createEvidence({
      claim: 'blogger page observed for ' + runId + ' (page_state=' + pageState + ', title_match=' + probe.title_match + ')',
      sourceUrl: probe.url,
      selector: probe.matched_selector,
      snapshot: JSON.stringify({ url: probe.url, document_title: probe.document_title, title_candidates: probe.title_candidates, page_state: pageState }),
      screenshot,
      observedAt: probe.observed_at,
      metadata: {
        run_id: runId,
        page_state: pageState,
        page_state_reason: classification.reason,
        title_match: probe.title_match,
        title_elements_found: probe.title_elements_found,
        cdp_target_id: session.targetId,
        cdp_target_resolved_by: session.targetResolvedBy,
        snapshot_fingerprint: session.fingerprint(snapshot),
        screenshot_sha256: screenshotHash,
        screenshot_bytes: screenshotBytes,
        screenshot_embedded: !!screenshot,
        email_fingerprint: run.email?.fingerprint || null,
        email_sent_at: run.email?.sent_at || null,
      },
    }));
    await ledger.save();

    save(run.dir, 'email-publication-observation.json', {
      runtime: 'email-to-blogger-publication-observer-v1',
      stage: 62,
      run_id: runId,
      // Observation vocabulary only. A publication status is not this runtime's to write.
      status: observedOnPublicPost ? 'OBSERVED' : 'OBSERVATION_PENDING',
      page_state: pageState,
      page_state_reason: classification.reason,
      public_post_url: classification.post_url,
      title_match: probe.title_match,
      expected_title: probe.expected_title,
      observed_url: probe.url,
      document_title: probe.document_title,
      title_candidates: probe.title_candidates,
      cdp_target_id: session.targetId,
      cdp_target_resolved_by: session.targetResolvedBy,
      evidence_id: evidence.id,
      snapshot_fingerprint: session.fingerprint(snapshot),
      screenshot_sha256: screenshotHash,
      screenshot_bytes: screenshotBytes,
      observed_at: probe.observed_at,
      boundary: 'This runtime records an observation. It does not create a publication receipt; publication is claimed only by the gated stage 60/61 transaction path.',
    });

    console.log(JSON.stringify({
      runtime: 'email-to-blogger-publication-observer-v1', stage: 62, run_id: runId,
      status: observedOnPublicPost ? 'OBSERVED' : 'OBSERVATION_PENDING',
      page_state: pageState,
      page_state_reason: classification.reason,
      title_match: probe.title_match,
      evidence_id: evidence.id,
      external_side_effect: false,
      publication_receipt: 'NOT_CREATED_BY_OBSERVER',
    }, null, 2));
  } finally {
    session.close();
  }
}

main().catch(error => {
  console.error('EMAIL-BLOGGER-OBSERVER: ERROR ' + error.message);
  process.exitCode = 1;
});
