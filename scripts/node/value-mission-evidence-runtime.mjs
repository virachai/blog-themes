#!/usr/bin/env node
/** Stage 22B — Value Mission Evidence Runtime. Evidence intake and gate for executable missions. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');

function fail(message) { console.error('MISSION-EVIDENCE: ERROR ' + message); process.exitCode = 1; }
function loadRun(runId) {
  const dir = join(RUNS, runId);
  const manifest = join(dir, 'manifest.json');
  if (!existsSync(manifest)) throw new Error('run not found: ' + runId);
  return { dir, manifest: JSON.parse(readFileSync(manifest, 'utf8')) };
}
function urls(text) { return [...new Set((text.match(/https:\/\/[^\s"'<>]+/gi) || []).map(x => x.replace(/[),.;]+$/,'')))]; }
function inspect(runId) {
  const run = loadRun(runId);
  const evidenceFile = join(run.dir, 'evidence.json');
  const evidence = existsSync(evidenceFile) ? JSON.parse(readFileSync(evidenceFile, 'utf8')) : { observations: [] };
  const observations = Array.isArray(evidence.observations) ? evidence.observations : [];
  const checks = [
    { id:'evidence_file', pass:existsSync(evidenceFile), target:'evidence.json exists' },
    { id:'observations_present', pass:observations.length > 0, value:observations.length, target:'>= 1 observation' },
    { id:'traceable_sources', pass:observations.length > 0 && observations.every(x => Array.isArray(x.sources) && x.sources.length > 0), target:'every observation has sources' },
    { id:'https_sources', pass:observations.length > 0 && observations.every(x => x.sources.every(s => /^https:\/\//i.test(String(s)))), target:'all sources use HTTPS' },
    { id:'claim_recorded', pass:observations.length > 0 && observations.every(x => String(x.claim ?? '').trim() !== ''), target:'every observation records a claim' },
    { id:'uncertainty_recorded', pass:observations.length > 0 && observations.every(x => String(x.uncertainty ?? '').trim() !== ''), target:'every observation records uncertainty' }
  ];
  const blockers = checks.filter(x => !x.pass).map(x => x.id);
  return { runtime:'value-mission-evidence-runtime-v1', run_id:runId, mission_id:run.manifest.mission_id, observation_count:observations.length, source_count:[...new Set(observations.flatMap(x=>x.sources||[]))].length, checks, status:blockers.length?'BLOCKED':'EVIDENCE_READY', blockers, evidence_authority:false, release_authority:false };
}
function init(runId) {
  const run = loadRun(runId);
  const file = join(run.dir, 'evidence.json');
  if (existsSync(file)) throw new Error('evidence.json already exists; edit it instead of overwriting evidence');
  writeFileSync(file, JSON.stringify({ mission_id:run.manifest.mission_id, run_id:runId, observations:[{ observation:'', claim:'', sources:[], checked_at:'', uncertainty:'', notes:'' }] }, null, 2)+'\n');
  console.log('MISSION-EVIDENCE: INITIALIZED');
  console.log('FILE: ' + file.replace(ROOT + '/', ''));
  console.log('NEXT: replace the empty observation with real, traceable evidence');
}
const [command='check', runId] = process.argv.slice(2);
try {
  if ((command==='init'||command==='check') && runId) {
    if (command==='init') init(runId); else console.log(JSON.stringify(inspect(runId), null, 2));
  } else throw new Error('usage: value-mission-evidence-runtime.mjs init|check <run_id>');
} catch (error) { fail(error instanceof Error ? error.message : String(error)); }
