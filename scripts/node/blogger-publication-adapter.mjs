#!/usr/bin/env node
/** Stage 61 — Blogger Publication Adapter. Explicit approval + intent verification + receipt. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CdpSession } from '../../.tmp/cdp/runtime/cdp-session.mjs';
import { EvidenceLedger } from '../../.tmp/cdp/runtime/evidence-ledger.mjs';
import { IdempotencyLedger, DistributedCommitCoordinator } from '../../.tmp/cdp/runtime/commit-coordinator.mjs';
import { ReleaseTransaction } from '../../.tmp/cdp/runtime/release-transaction.mjs';

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

function bloggerUrl(url) {
  try { return new URL(url).hostname.endsWith('blogger.com'); } catch { return false; }
}

function buildAdapter(run, session, mode) {
  return {
    async execute({ payload }) {
      const before = await inspectTarget(session);
      if (!bloggerUrl(before.info.url)) throw new Error('active target is not Blogger');
      if (mode !== 'publish') return { status: 'TARGET_INSPECTED_ONLY', target: before.info, fingerprint: session.fingerprint(before.snapshot) };

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

      const title = payload.title || run.asset?.title || '';
      const body = payload.body || process.env.BLOGGER_BODY || '';
      if (!title || !body) throw new Error('publication payload requires title and body');

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
      await new Promise(r => setTimeout(r, Number(process.env.BLOGGER_VERIFY_DELAY_MS || 1500)));
      const post = await inspectTarget(session);
      const published = /\/post\//i.test(post.info.url) || /published|post/i.test(post.info.title);
      return { status: published ? 'PASS' : 'BLOCKED', published, url: post.info.url, title: post.info.title, fingerprint: session.fingerprint(post.snapshot) };
    },
    async rollback({ reason }) {
      return { status: 'MANUAL_ROLLBACK_REQUIRED', reason, note: 'Blogger publication is externally committed; adapter does not delete content automatically.' };
    }
  };
}

async function main() {
  const [command, runId, mode = 'inspect'] = process.argv.slice(2);
  if (!runId || !['plan','inspect','execute'].includes(command)) throw new Error('usage: blogger-publication-adapter.mjs plan|inspect|execute <run_id> [inspect|publish]');
  const run = load(runId);
  const pf = preflight(run);
  const plan = {
    runtime: 'blogger-publication-adapter-v1', stage: 61, run_id: runId, status: pf.status,
    preflight: pf, mode, target_contract: { host: 'blogger.com', selectors, intent_verification: true, post_publish_verification: true },
    external_side_effect: command === 'execute' && mode === 'publish',
    receipt: 'NOT_CREATED_UNTIL_VERIFIED'
  };
  save(run.dir, 'blogger-publication-plan.json', plan);
  if (command === 'plan') { console.log(JSON.stringify(plan, null, 2)); return; }

  const session = new CdpSession({ endpoint: process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222', targetId: process.env.BLOGGER_TARGET_ID || null });
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
    const tx = new ReleaseTransaction({
      auditPath: join(run.dir, 'blogger-publication.ndjson'),
      adapter: buildAdapter(run, session, mode),
      commitCoordinator: new DistributedCommitCoordinator({ ledger: new IdempotencyLedger(join(run.dir, 'blogger-publication-idempotency.ndjson')) })
    });
    const result = await tx.run({
      taskId: run.manifest.run_id, operation: 'blogger.publish',
      payload: { run_id: run.manifest.run_id, title: run.asset?.title || '', body: process.env.BLOGGER_BODY || '' },
      preflight: pf, requireApproval: true, approved: run.release?.approval?.status === 'APPROVED',
      idempotencyKey: 'blogger-publication:' + run.manifest.run_id,
      fencingToken: process.env.BLOGGER_FENCING_TOKEN || 'manual-stage61'
    });
    const ledger = await EvidenceLedger.load(run.dir);
    const evidence = ledger.add({ type: 'blogger-publication', run_id: runId, result, observed_at: new Date().toISOString() });
    await ledger.save();
    if (result.status === 'COMMITTED' && result.verification?.status === 'PASS') {
      save(run.dir, 'publication-receipt.json', {
        runtime: 'blogger-publication-adapter-v1', run_id: runId, status: 'PUBLISHED',
        publication: { status: 'PUBLISHED', url: result.verification.url, published_at: new Date().toISOString(), external_id: '' },
        evidence_id: evidence.id, transaction_id: result.tx_id
      });
    }
    console.log(JSON.stringify({ ...result, evidence_id: evidence.id }, null, 2));
  } finally { session.close(); }
}
main().catch(error => { console.error('BLOGGER-ADAPTER: ERROR ' + error.message); process.exitCode = 1; });
