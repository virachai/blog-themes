#!/usr/bin/env node
/** Stage 59 — Editorial Production Execution Adapter. Bridges Stage 58 state to external execution primitives. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { CdpSession } from './cdp-runtime/cdp-session.mjs';
import { EvidenceLedger } from './cdp-runtime/evidence-ledger.mjs';

const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');

function fail(message) { console.error('EXECUTION-ADAPTER: ERROR ' + message); process.exitCode = 1; }
function json(file) { return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null; }
function load(runId) {
  const dir = join(RUNS, runId);
  const manifest = json(join(dir, 'manifest.json'));
  const state = json(join(dir, 'production-loop-state.json'));
  if (!manifest) throw new Error('run not found: ' + runId);
  if (!state) throw new Error('Stage 58 state missing; run prepare first');
  return { dir, manifest, state };
}
function sha(value) { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }

function preflight(run) {
  const release = json(join(run.dir, 'release-candidate.json'));
  const asset = json(join(run.dir, 'asset-spec.json'));
  const blockers = [];
  if (run.state.status === 'INCOMPLETE') blockers.push(run.state.next_action.gate);
  if (!asset) blockers.push('asset');
  if (release?.status !== 'READY_FOR_RELEASE_APPROVAL') blockers.push('release');
  if (release?.approval?.status !== 'APPROVED') blockers.push('human_approval');
  return {
    status: blockers.length ? 'BLOCKED' : 'PASS',
    blockers: [...new Set(blockers)],
    authority: { publish: false, measurement: false },
    idempotency_key: 'editorial:' + run.manifest.run_id + ':publication',
    artifact_hash: asset ? sha(asset) : null
  };
}

function plan(run, mode) {
  const pf = preflight(run);
  return {
    runtime: 'editorial-production-execution-adapter-v1',
    stage: 59,
    run_id: run.manifest.run_id,
    mission_id: run.manifest.mission_id,
    mode,
    status: pf.status === 'PASS' ? 'READY_FOR_EXTERNAL_EXECUTION' : 'BLOCKED',
    preflight: pf,
    adapters: {
      asset: { status: existsSync(join(run.dir, 'asset-package.md')) ? 'AVAILABLE' : 'MISSING', source: 'asset-package.md' },
      publication: { type: 'CDP', status: mode === 'cdp' ? 'ARMED_AFTER_APPROVAL' : 'HANDOFF_ONLY' },
      measurement: { type: 'RECEIPT', status: 'NOT_EXECUTED' }
    },
    safety: {
      dry_run_default: true,
      approval_required: true,
      idempotency_required: true,
      evidence_required: true,
      rollback_required: true
    },
    boundary: 'Adapter coordinates execution and evidence. It does not invent publication receipts, metrics, or approval.'
  };
}

async function dryRun(run, output) {
  const ledger = await EvidenceLedger.load(run.dir);
  const record = ledger.add({
    type: 'execution-preflight',
    source: 'editorial-production-execution-adapter-v1',
    run_id: run.manifest.run_id,
    status: output.status,
    preflight: output.preflight,
    observed_at: new Date().toISOString()
  });
  await ledger.save();
  writeFileSync(join(run.dir, 'execution-plan.json'), JSON.stringify(output, null, 2) + '\n');
  console.log('EXECUTION-ADAPTER: ' + output.status);
  console.log('MODE: dry-run');
  console.log('RUN: ' + run.manifest.run_id);
  console.log('PREFLIGHT: ' + output.preflight.status);
  console.log('BLOCKERS: ' + (output.preflight.blockers.join(', ') || 'none'));
  console.log('EVIDENCE: ' + record.id);
}

async function cdpProbe(run, output) {
  if (output.status !== 'READY_FOR_EXTERNAL_EXECUTION') throw new Error('CDP execution blocked by preflight: ' + output.preflight.blockers.join(', '));
  const endpoint = process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222';
  // Connectivity check only — this adapter makes no claim about page identity,
  // so it explicitly accepts whichever tab is first.
  const session = new CdpSession({ endpoint, targetPolicy: 'first-page' });
  try {
    const target = await session.connect();
    const snapshot = await session.snapshot();
    const ledger = await EvidenceLedger.load(run.dir);
    const evidence = ledger.add({
      type: 'cdp-preflight-observation',
      source: 'editorial-production-execution-adapter-v1',
      run_id: run.manifest.run_id,
      target: { id: target.id, url: target.url, title: target.title },
      snapshot_fingerprint: session.fingerprint(snapshot),
      observed_at: snapshot.capturedAt
    });
    await ledger.save();
    writeFileSync(join(run.dir, 'execution-plan.json'), JSON.stringify({ ...output, cdp: { endpoint, target, evidence_id: evidence.id, status: 'CONNECTED_NOT_PUBLISHED' } }, null, 2) + '\n');
    console.log('EXECUTION-ADAPTER: CDP_CONNECTED_NOT_PUBLISHED');
    console.log('TARGET: ' + target.url);
    console.log('EVIDENCE: ' + evidence.id);
    console.log('NEXT: invoke an explicit publication operation only after verifying target, payload, approval, and rollback path.');
  } finally { session.close(); }
}

async function main() {
  const [command, runId, mode = 'dry-run'] = process.argv.slice(2);
  if (!runId || !['plan', 'execute'].includes(command)) throw new Error('usage: editorial-production-execution-adapter.mjs plan|execute <run_id> [dry-run|cdp]');
  const run = load(runId);
  const output = plan(run, mode);
  if (command === 'plan') {
    writeFileSync(join(run.dir, 'execution-plan.json'), JSON.stringify(output, null, 2) + '\n');
    console.log(JSON.stringify(output, null, 2));
    return;
  }
  if (mode === 'dry-run') return dryRun(run, output);
  if (mode === 'cdp') return cdpProbe(run, output);
  throw new Error('unsupported mode: ' + mode);
}
main().catch(error => fail(error instanceof Error ? error.message : String(error)));
