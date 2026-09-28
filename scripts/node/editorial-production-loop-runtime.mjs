#!/usr/bin/env node
/** Stage 58 — Editorial Production Loop Runtime. Manual-first, fail-closed orchestration. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RECEIPT_FILE, assertAuthoritativeReceipt } from './publication-receipt.mjs';

const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');

function fail(message) { console.error('PRODUCTION-LOOP: ERROR ' + message); process.exitCode = 1; }
function readJson(file) { return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null; }
function load(runId) {
  const dir = join(RUNS, runId);
  const manifest = readJson(join(dir, 'manifest.json'));
  if (!manifest) throw new Error('run not found: ' + runId);
  return { dir, manifest };
}
function gate(id, status, reason) { return { id, status, reason }; }

function inspect(runId) {
  const run = load(runId);
  const asset = readJson(join(run.dir, 'asset-spec.json'));
  const release = readJson(join(run.dir, 'release-candidate.json'));
  const receipt = readJson(join(run.dir, RECEIPT_FILE));
  const outcome = readJson(join(run.dir, 'outcome.json'));
  // A legacy or foreign file at the receipt path is not a publication record.
  let publicationRecorded = false;
  try { assertAuthoritativeReceipt(receipt); publicationRecorded = true; } catch { publicationRecorded = false; }

  const gates = [
    gate('opportunity', run.manifest.validation?.status === 'READY' ? 'READY' : 'BLOCKED', 'mission contract must be validated'),
    gate('research', existsSync(join(run.dir, 'research-brief.md')) ? 'READY' : 'BLOCKED', 'research brief is the evidence handoff'),
    gate('asset', asset?.status === 'RELEASE_CANDIDATE' ? 'READY' : 'BLOCKED', 'asset must be a release candidate'),
    gate('release', release?.status === 'READY_FOR_RELEASE_APPROVAL' ? 'READY_FOR_APPROVAL' : 'BLOCKED', 'release runtime prepares but never grants authority'),
    gate('publication', publicationRecorded ? 'RECORDED' : 'PENDING_APPROVAL', 'publication is external and must be recorded from an authoritative receipt written by the stage 61 adapter'),
    gate('measurement', outcome?.status === 'MEASURED' ? 'RECORDED' : 'PENDING', 'measurement requires observed outcome data'),
    gate('learning', outcome?.decision ? 'READY' : 'PENDING', 'optimization/learning decision follows measurement'),
  ];

  const firstAction = gates.find((g) => !['READY', 'READY_FOR_APPROVAL', 'RECORDED'].includes(g.status));
  const status = firstAction ? (firstAction.id === 'release' || firstAction.id === 'publication' ? 'AWAITING_EXTERNAL_ACTION' : 'INCOMPLETE') : 'LOOP_COMPLETE';
  return {
    runtime: 'editorial-production-loop-runtime-v1',
    stage: 58,
    run_id: runId,
    mission_id: run.manifest.mission_id,
    status,
    gates,
    next_action: firstAction ? { gate: firstAction.id, instruction: nextInstruction(firstAction.id) } : { gate: 'learning', instruction: 'Create the next opportunity from measured evidence.' },
    authority: { research: false, editorial: false, publish: false, monetization: false, measurement: false, learning: false },
    boundary: 'This runtime coordinates state and evidence only. It does not invent evidence, publish externally, or claim outcomes without recorded receipts.'
  };
}
function nextInstruction(id) {
  const map = {
    opportunity: 'Repair and validate the mission/run contract.',
    research: 'Collect real evidence and update research-brief.md.',
    asset: 'Create and validate asset-spec.json and asset-package.md.',
    release: 'Obtain explicit human release approval; do not treat READY_FOR_RELEASE_APPROVAL as publication.',
    publication: 'Publish through the normal external workflow and record publication-receipt.json from actual evidence.',
    measurement: 'Record observed metrics and outcome.json; keep estimates separate from actuals.',
    learning: 'Record an evidence-backed optimization/learning decision and feed the next opportunity.'
  };
  return map[id];
}
function prepare(runId) {
  const state = inspect(runId);
  const run = load(runId);
  writeFileSync(join(run.dir, 'production-loop-state.json'), JSON.stringify(state, null, 2) + '\n');
  console.log('PRODUCTION-LOOP: ' + state.status);
  console.log('MISSION: ' + state.mission_id);
  console.log('RUN: ' + state.run_id);
  console.log('NEXT: ' + state.next_action.instruction);
  console.log('ARTIFACT: ' + join('04-revenue-system/07-intelligence/runs', runId, 'production-loop-state.json'));
  if (state.status === 'INCOMPLETE') process.exitCode = 2;
}
function check(runId) {
  const state = inspect(runId);
  console.log(JSON.stringify(state, null, 2));
  if (state.status === 'INCOMPLETE') process.exitCode = 2;
}
const [command, runId] = process.argv.slice(2);
try {
  if (!command || !runId || !['check', 'prepare'].includes(command)) throw new Error('usage: editorial-production-loop-runtime.mjs check|prepare <run_id>');
  if (command === 'check') check(runId);
  else prepare(runId);
} catch (error) { fail(error instanceof Error ? error.message : String(error)); }
