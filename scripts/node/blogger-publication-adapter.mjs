#!/usr/bin/env node
/** Stage 61 — Blogger Publication Adapter. Explicit approval + intent verification + receipt. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CdpSession } from './cdp-runtime/cdp-session.mjs';
import { EvidenceLedger } from './cdp-runtime/evidence-ledger.mjs';
import { IdempotencyLedger, DistributedCommitCoordinator } from './cdp-runtime/commit-coordinator.mjs';
import { ReleaseTransaction } from './cdp-runtime/release-transaction.mjs';
import { createEvidence } from './cdp-runtime/evidence.mjs';
import { classifyBloggerPage, isBloggerHost, assertPublishable } from './blogger-page-state.mjs';
import { resolvePublicationTitle, resolvePublicationBody, assertPublicationPayload } from './publication-payload.mjs';
import { RECEIPT_FILE, buildPublicationReceipt } from './publication-receipt.mjs';

const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');
const json = file => existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
const load = runId => {
  const dir = join(RUNS, runId);
  const manifest = json(join(dir, 'manifest.json'));
  const release = json(join(dir, 'release-candidate.json'));
  const asset = json(join(dir, 'asset-spec.json'));
  if (!manifest) throw new Error('run not found: ' + runId);
  return { dir, manifest, release, asset };
};
const save = (dir, name, value) => writeFileSync(join(dir, name), JSON.stringify(value, null, 2) + '\n');

const preflight = run => {
  const blockers = [];
  if (run.release?.status !== 'READY_FOR_RELEASE_APPROVAL') blockers.push('release_not_ready');
  if (run.release?.approval?.status !== 'APPROVED') blockers.push('human_approval_required');
  if (!run.asset) blockers.push('asset_missing');
  return { status: blockers.length ? 'BLOCKED' : 'PASS', blockers };
};

const selectors = Object.freeze({
  title: process.env.BLOGGER_TITLE_SELECTOR || '[contenteditable="true"], input[aria-label*="Title" i], textarea[aria-label*="Title" i]',
  body: process.env.BLOGGER_BODY_SELECTOR || '[contenteditable="true"]',
  publish: process.env.BLOGGER_PUBLISH_SELECTOR || 'button[aria-label*="Publish" i], button:has-text("Publish")'
});

async function inspectTarget(session) {
  const snapshot = await session.snapshot();
  const info = await session.evaluate(`(() => {
    const q = s => { try { return [...document.querySelectorAll(s)].map((e,i) => ({
      i, tag:e.tagName, text:(e.innerText||e.value||'').trim().slice(0,120),
      aria:e.getAttribute('aria-label'), role:e.getAttribute('role'), disabled:!!e.disabled
    })).slice(0,10); } catch { return []; } };
    return {
      url: location.href, title: document.title,
      titleCandidates: q(${JSON.stringify(selectors.title)}),
      bodyCandidates: q(${JSON.stringify(selectors.body)}),
      publishCandidates: q(${JSON.stringify(selectors.publish)})
    };
  })()`);
  return { snapshot, info };
}

function buildAdapter(run, session, mode) {
  // Records what actually happened, so evidence is written only for a real
  // publication attempt — not for a transaction that rolled back at preflight.
  const trace = { publish_attempted: false, publish_clicked: false, target_before: null, target_after: null, verification: null };
  return {
    trace,
    async execute({ payload }) {
      const before = await inspectTarget(session);
      trace.target_before = before.info;
      if (!isBloggerHost(before.info.url, { publicHost: process.env.BLOGGER_PUBLIC_HOST || null })) throw new Error('active target is not Blogger');
      if (mode !== 'publish') return { status: 'TARGET_INSPECTED_ONLY', target: before.info, fingerprint: session.fingerprint(before.snapshot) };
      trace.publish_attempted = true;

      const intent = await session.evaluate(`(() => {
        const find = s => document.querySelector(s);
        const title = find(${JSON.stringify(selectors.title)});
        const body = find(${JSON.stringify(selectors.body)});
        const publish = find(${JSON.stringify(selectors.publish)});
        return {
          title_found: !!title, body_found: !!body, publish_found: !!publish,
          publish_enabled: !!publish && !publish.disabled
        };
      })()`);
      if (!intent.title_found || !intent.body_found || !intent.publish_found || !intent.publish_enabled) {
        throw new Error('Blogger publication intent contract not satisfied');
      }

      if (process.env.BLOGGER_PUBLISH_CONFIRM !== 'YES') throw new Error('BLOGGER_PUBLISH_CONFIRM=YES is required for external publication');

      const resolvedTitle = resolvePublicationTitle({ mission: run.manifest?.mission, asset: run.asset, override: payload.title });
      const resolvedBody = resolvePublicationBody({ override: payload.body || process.env.BLOGGER_BODY });
      const { title, body } = assertPublicationPayload({ title: resolvedTitle.title, body: resolvedBody.body });

      const fill = await session.evaluate(`(async () => {
        const titleEl = document.querySelector(${JSON.stringify(selectors.title)});
        const bodyEl = document.querySelector(${JSON.stringify(selectors.body)});
        const set = (el, value) => {
          el.focus();
          if ('value' in el) { el.value = value; el.dispatchEvent(new Event('input',{bubbles:true})); }
          else { el.textContent = value; el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:value})); }
        };
        set(titleEl, ${JSON.stringify(title)});
        set(bodyEl, ${JSON.stringify(body)});
        return { title_set: true, body_set: true };
      })()`);
      const afterFill = await inspectTarget(session);
      return { status: 'READY_TO_PUBLISH', intent, fill, target: afterFill.info, fingerprint_before: session.fingerprint(before.snapshot), fingerprint_after_fill: session.fingerprint(afterFill.snapshot) };
    },
    async verify({ execution }) {
      if (execution?.status !== 'READY_TO_PUBLISH') return { status: 'BLOCKED', reason: 'publish_action_not_completed' };
      const clicked = await session.evaluate(`(() => {
        const el = document.querySelector(${JSON.stringify(selectors.publish)});
        if (!el || el.disabled) return false;
        el.click(); return true;
      })()`);
      if (!clicked) return { status: 'BLOCKED', reason: 'publish_button_unavailable' };
      trace.publish_clicked = true;
      await new Promise(r => setTimeout(r, Number(process.env.BLOGGER_VERIFY_DELAY_MS || 1500)));
      const post = await inspectTarget(session);
      trace.target_after = post.info;

      // PUBLISHED is claimed only from a public post URL.
      //
      // This previously tested the URL for a "post" path segment and the document
      // title for "published" or "post" as substrings. The Blogger *editor* at
      // .../blog/post/edit/<blogId>/<postId> passed on both counts — its path
      // contains that segment and its title contains the post title. So an
      // unpublished draft could be recorded as published. assertPublishable()
      // classifies the editor as EDITING and refuses.
      const classification = classifyBloggerPage(post.info.url, { publicHost: process.env.BLOGGER_PUBLIC_HOST || null });
      let externalId = null;
      try {
        externalId = assertPublishable(classification);
      } catch (error) {
        trace.verification = { status: 'BLOCKED', reason: error.message, page_state: classification.state };
        return {
          status: 'BLOCKED', reason: error.message, published: false,
          page_state: classification.state, page_state_reason: classification.reason,
          url: post.info.url, title: post.info.title, fingerprint: session.fingerprint(post.snapshot),
        };
      }
      // Read the publication date off the post page. It is left null when the
      // theme exposes none, rather than substituted with local wall-clock time.
      const pageDate = await session.evaluate(`(() => {
        const el = document.querySelector('time[datetime], .published, .post-timestamp, abbr.published, .post-date');
        if (!el) return '';
        return ((el.getAttribute && el.getAttribute('datetime')) || el.textContent || '').trim();
      })()`);

      trace.verification = { status: 'PASS', page_state: classification.state, external_id: externalId };
      return {
        status: 'PASS', published: true, external_id: externalId,
        page_state: classification.state,
        url: classification.post_url, observed_url: post.info.url,
        published_at: pageDate || null,
        title: post.info.title, fingerprint: session.fingerprint(post.snapshot),
      };
    },
    async rollback({ reason }) {
      return { status: 'MANUAL_ROLLBACK_REQUIRED', reason, note: 'Blogger publication is externally committed; adapter does not delete content automatically.' };
    }
  };
}

async function main() {
  const [command, runId, mode = 'inspect'] = process.argv.slice(2);
  if (!runId || !['plan','inspect','execute','adopt'].includes(command)) throw new Error('usage: blogger-publication-adapter.mjs plan|inspect|execute <run_id> [inspect|publish] | adopt <run_id>');
  const run = load(runId);
  const pf = preflight(run);
  const plan = {
    runtime: 'blogger-publication-adapter-v1', stage: 61, run_id: runId, status: pf.status,
    preflight: pf, mode, target_contract: { host: 'blogger.com or blogspot.com (or BLOGGER_PUBLIC_HOST)', selectors, intent_verification: true, post_publish_verification: 'public post URL required' },
    external_side_effect: command === 'execute' && mode === 'publish',
    receipt: 'NOT_CREATED_UNTIL_VERIFIED'
  };

  if (command === 'plan') { console.log(JSON.stringify(plan, null, 2)); return; }

  // A publication claim must name its target. `inspect` only reports what is on
  // screen and claims nothing, so it explicitly opts into the first-page fallback
  // rather than relying on a silent default.
  const willPublish = command === 'execute' && mode === 'publish';
  if (command === 'adopt') {
    const observation = json(join(run.dir, 'email-publication-observation.json'));
    if (!observation || observation.status !== 'OBSERVED') throw new Error('adoption refused: Stage 62 observation is missing or not OBSERVED');
    if (observation.page_state !== 'PUBLISHED_CANDIDATE' || observation.title_match !== true) throw new Error('adoption refused: CDP observation is not a verified public-post candidate with exact title match');
    const targetId = process.env.BLOGGER_TARGET_ID || observation.cdp_target_id;
    const session = new CdpSession({ endpoint: process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222', targetId, targetPolicy: 'required' });
    try {
      await session.connect();
      await session.navigate(observation.public_post_url);
      await new Promise(r => setTimeout(r, 1200));
      const live = await inspectTarget(session);
      const classification = classifyBloggerPage(live.info.url, { publicHost: process.env.BLOGGER_PUBLIC_HOST || null });
      const externalId = assertPublishable(classification);
      if (classification.post_url !== observation.public_post_url) throw new Error('adoption refused: live public URL does not match observed publication URL');
      const expectedTitle = observation.expected_title || '';
      if (live.info.title.trim() !== expectedTitle.trim()) throw new Error('adoption refused: live document title does not match observed expected title');
      const verification = {
        status: 'PASS', page_state: classification.state, external_id: externalId,
        url: classification.post_url, observed_url: live.info.url, published_at: null,
        title: live.info.title, fingerprint: session.fingerprint(live.snapshot)
      };
      const evidenceId = observation.evidence_id || null;
      const adoptionId = 'adoption:' + evidenceId;
      save(run.dir, RECEIPT_FILE, buildPublicationReceipt({ runId, verification, evidenceId, transactionId: adoptionId, verifiedAt: new Date().toISOString() }));
      console.log(JSON.stringify({ runtime: 'blogger-publication-adapter-v1', stage: 61, mode: 'ADOPT_EXTERNAL_PUBLICATION', run_id: runId, status: 'ADOPTED', external_side_effect: false, adoption_id: adoptionId, receipt: RECEIPT_FILE, source: { stage_62_observation: 'email-publication-observation.json', evidence_id: evidenceId, transport: 'email-to-blogger' }, verification: { url: classification.post_url, title: live.info.title, page_state: classification.state, cdp_target_id: session.targetId, snapshot_fingerprint: verification.fingerprint } }, null, 2));
    } finally { session.close(); }
    return;
  }
  const session = new CdpSession({
    endpoint: process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222',
    targetId: process.env.BLOGGER_TARGET_ID || null,
    targetPolicy: willPublish ? 'required' : 'first-page',
  });
  try {
    await session.connect();
    const inspected = await inspectTarget(session);
    if (command === 'inspect' || mode === 'inspect') {
      console.log(JSON.stringify({ ...plan, target: inspected.info, fingerprint: session.fingerprint(inspected.snapshot), action: 'NO_EXTERNAL_SIDE_EFFECT' }, null, 2));
      return;
    }
    if (pf.status !== 'PASS') {
      console.log(JSON.stringify({ ...plan, action: 'BLOCKED', external_side_effect: false }, null, 2));
      return;
    }
    const adapter = buildAdapter(run, session, mode);
    const tx = new ReleaseTransaction({
      auditPath: join(run.dir, 'blogger-publication.ndjson'),
      adapter,
      commitCoordinator: new DistributedCommitCoordinator({ ledger: new IdempotencyLedger(join(run.dir, 'blogger-publication-idempotency.ndjson')) })
    });
    const result = await tx.run({
      taskId: run.manifest.run_id, operation: 'blogger.publish',
      payload: { run_id: run.manifest.run_id, title: resolvePublicationTitle({ mission: run.manifest?.mission, asset: run.asset }).title || '', body: process.env.BLOGGER_BODY || '' },
      preflight: pf, requireApproval: true, approved: run.release?.approval?.status === 'APPROVED',
      idempotencyKey: 'blogger-publication:' + run.manifest.run_id,
      fencingToken: process.env.BLOGGER_FENCING_TOKEN || 'manual-stage61'
    });
    // Evidence only for a real attempt. A transaction that rolled back at
    // preflight never touched the browser, so recording evidence for it would
    // put a record in the ledger for something that did not happen.
    let evidence = null;
    if (adapter.trace.publish_attempted) {
      const ledger = await EvidenceLedger.load(run.dir);
      evidence = ledger.add(createEvidence({
        claim: 'blogger publication attempt for ' + runId + ' (result=' + result.status + ', page_state=' + (adapter.trace.verification?.page_state || 'UNKNOWN') + ')',
        sourceUrl: adapter.trace.target_after?.url || adapter.trace.target_before?.url || '',
        selector: selectors.publish,
        snapshot: JSON.stringify({ before: adapter.trace.target_before, after: adapter.trace.target_after }),
        screenshot: null,
        observedAt: new Date().toISOString(),
        metadata: {
          run_id: runId,
          tx_id: result.tx_id || null,
          transaction_status: result.status,
          verification_status: result.verification?.status || adapter.trace.verification?.status || null,
          page_state: adapter.trace.verification?.page_state || null,
          external_id: result.verification?.external_id || null,
          publish_clicked: adapter.trace.publish_clicked,
          cdp_target_id: session.targetId,
          cdp_target_resolved_by: session.targetResolvedBy,
        },
      }));
      await ledger.save();
    }

    // An idempotent replay returns the stored verification, so re-writing here
    // would re-stamp published_at and make the receipt look newly issued for an
    // event that happened earlier. The first commit already recorded it.
    if (result.idempotent === true) {
      console.log(JSON.stringify({ ...result, evidence_id: evidence?.id || null, receipt: 'ALREADY_RECORDED_BY_PRIOR_COMMIT' }, null, 2));
      return;
    }

    if (result.status === 'COMMITTED' && result.verification?.status === 'PASS') {
      // The single authoritative receipt write. Every field is derived from the
      // verified public post; buildPublicationReceipt refuses the rest.
      save(run.dir, RECEIPT_FILE, buildPublicationReceipt({
        runId,
        verification: result.verification,
        evidenceId: evidence?.id || null,
        transactionId: result.tx_id,
        verifiedAt: new Date().toISOString(),
      }));
    }
    console.log(JSON.stringify({ ...result, evidence_id: evidence?.id || null }, null, 2));
  } finally { session.close(); }
}
main().catch(error => { console.error('BLOGGER-ADAPTER: ERROR ' + error.message); process.exitCode = 1; });
