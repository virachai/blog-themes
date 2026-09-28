#!/usr/bin/env node
/** Stage 29 — Editorial Mission Runtime. Mission-level orchestration contract. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadJson(file) {
  const path = resolve(file);
  if (!existsSync(path)) throw new Error('file not found: ' + file);
  return JSON.parse(readFileSync(path, 'utf8'));
}
function required(value) { return value !== undefined && value !== null && String(value).trim() !== ''; }
function checkMission(mission) {
  const requiredFields = ['mission_id', 'signal', 'brief', 'article', 'measurement'];
  const checks = requiredFields.map(id => ({ id, pass: required(mission[id]), target: 'mission field is present' }));
  if (mission.brief && typeof mission.brief === 'object') {
    for (const key of ['intent', 'audience', 'required_subtopics', 'evidence_requirements', 'success_criteria']) {
      const value = mission.brief[key];
      checks.push({ id: 'brief.' + key, pass: Array.isArray(value) ? value.length > 0 : required(value), target: 'brief contract field is populated' });
    }
  }
  if (mission.article && typeof mission.article === 'object') {
    for (const key of ['path', 'status']) checks.push({ id: 'article.' + key, pass: required(mission.article[key]), target: 'article execution field is present' });
  }
  if (mission.measurement && typeof mission.measurement === 'object') {
    for (const key of ['success_metric', 'observation_window']) checks.push({ id: 'measurement.' + key, pass: required(mission.measurement[key]), target: 'measurement contract field is present' });
  }
  const blockers = checks.filter(x => !x.pass).map(x => x.id);
  return { runtime:'editorial-mission-runtime-v1', mission_id:mission.mission_id || null, stage:'mission-contract', checks, blocker_count:blockers.length, blockers, status:blockers.length ? 'REVISE' : 'READY', mission_authority:false, editorial_authority:false, release_authority:false, release_gate:'seo-quality-gate' };
}
const [command='check', file, ...rest] = process.argv.slice(2);
const json = rest.includes('--json');
const outputPath = rest.find(x => x.startsWith('--write='))?.slice(8);
try {
  if (command !== 'check' || !file) throw new Error('usage: editorial-mission-runtime.mjs check <mission.json> [--json] [--write=<report.json>]');
  const report = checkMission(loadJson(file));
  if (outputPath) writeFileSync(resolve(outputPath), JSON.stringify(report, null, 2) + '\n');
  if (json) console.log(JSON.stringify(report, null, 2)); else { console.log('EDITORIAL-MISSION: ' + report.status); console.log('MISSION: ' + (report.mission_id || 'missing')); console.log('BLOCKERS: ' + (report.blockers.join(', ') || 'none')); }
  if (report.status !== 'READY') process.exitCode = 2;
} catch (error) { console.error('EDITORIAL-MISSION: ERROR ' + (error instanceof Error ? error.message : String(error))); process.exitCode = 1; }
