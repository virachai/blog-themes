#!/usr/bin/env node
/** Stage 60 — Publication Transaction Runtime. Real publication is opt-in and fail-closed. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CdpSession } from './cdp-runtime/cdp-session.mjs';
import { EvidenceLedger } from './cdp-runtime/evidence-ledger.mjs';
import { IdempotencyLedger, DistributedCommitCoordinator } from './cdp-runtime/commit-coordinator.mjs';
import { ReleaseTransaction } from './cdp-runtime/release-transaction.mjs';
import { createEvidence } from './cdp-runtime/evidence.mjs';

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

function transaction(run, approved, cdp) {
  const approval = approved === true && run.release?.approval?.status === 'APPROVED';
  const adapter = {
    async execute({ payload }) {
      if (!cdp) throw new Error('publication adapter is not armed; use --cdp');
      // Connectivity check only — no page-identity claim, so an explicit opt-in
      // to the first-page fallback rather than a silent default.
      const session = new CdpSession({ endpoint: process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222', targetPolicy: 'first-page' });
      const target = await session.connect();
      const snapshot = await session.snapshot();
      session.close();
      return { status: 'TARGET_VERIFIED_ONLY', target: { id: target.id, url: target.url, title: target.title }, fingerprint: session.fingerprint(snapshot), payload };
    },
    async verify({ execution }) {
      return { status: execution?.status === 'TARGET_VERIFIED_ONLY' ? 'PASS' : 'BLOCKED', verified: execution?.status === 'TARGET_VERIFIED_ONLY' };
    },
    async rollback({ reason }) { return { status: 'NO_EXTERNAL_PUBLICATION_PERFORMED', reason }; }
  };
  return new ReleaseTransaction({
    auditPath: join(run.dir, 'publication-transaction.ndjson'),
    adapter,
    commitCoordinator: new DistributedCommitCoordinator({ ledger: new IdempotencyLedger(join(run.dir, 'publication-idempotency.ndjson')) })
  }).run({
    taskId: run.manifest.run_id,
    operation: 'publish',
    payload: { run_id: run.manifest.run_id, asset_hash: run.asset ? run.asset : null },
    preflight: preflight(run),
    requireApproval: true,
    approved: approval,
    idempotencyKey: 'publication:' + run.manifest.run_id,
    fencingToken: process.env.PUBLICATION_FENCING_TOKEN || 'manual-stage60'
  });
}

async function main() {
  const [command, runId, mode = 'dry-run'] = process.argv.slice(2);
  if (!runId || !['plan', 'execute'].includes(command)) throw new Error('usage: editorial-publication-transaction-runtime.mjs plan|execute <run_id> [dry-run|cdp]');
  const run = load(runId);
  const pf = preflight(run);
  const plan = { runtime: 'editorial-publication-transaction-runtime-v1', stage: 60, run_id: runId, status: pf.status, preflight: pf, mode, publication_receipt: 'NOT_CREATED', safety: { approval_required: true, idempotency_required: true, verification_required: true, rollback_required: true } };
  save(run.dir, 'publication-transaction-plan.json', plan);
  if (command === 'plan') { console.log(JSON.stringify(plan, null, 2)); return; }
  if (mode === 'dry-run') { console.log(JSON.stringify({ ...plan, action: 'NO_EXTERNAL_SIDE_EFFECT' }, null, 2)); return; }
  if (mode !== 'cdp') throw new Error('unsupported mode');
  const result = await transaction(run, run.release?.approval?.status === 'APPROVED', true);
  const ledger = await EvidenceLedger.load(run.dir);
  const evidence = ledger.add(createEvidence({
    claim: 'publication transaction for ' + runId + ' completed with status ' + result.status,
    sourceUrl: result?.verification?.url || null,
    selector: null,
    snapshot: result?.verification ? JSON.stringify(result.verification) : null,
    screenshot: null,
    observedAt: new Date().toISOString(),
    metadata: {
      run_id: runId,
      tx_id: result.tx_id || null,
      transaction_status: result.status,
      verification_status: result.verification?.status || null,
      idempotent: result.idempotent === true,
    },
  }));
  await ledger.save();
  save(run.dir, 'publication-transaction-result.json', { ...result, evidence_id: evidence.id });
  console.log(JSON.stringify({ ...result, evidence_id: evidence.id }, null, 2));
}
main().catch(error => { console.error('PUBLICATION-TX: ERROR ' + error.message); process.exitCode = 1; });
