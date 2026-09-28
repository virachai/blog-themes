#!/usr/bin/env node
/** Stage 23 — Editorial Opportunity & Portfolio Runtime. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const INTEL = join(ROOT, '04-revenue-system/07-intelligence');
const SIGNALS = join(INTEL, 'signals.csv');
const MISSIONS = join(INTEL, 'value-missions.csv');

function csv(path) {
  if (!existsSync(path)) throw new Error('missing ledger: ' + path);
  const lines = readFileSync(path, 'utf8').trim().split(/\r?\n/);
  const headers = lines.shift().split(',');
  return lines.filter(Boolean).map(line => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}
function scoreSignal(s) {
  const confidence = {high:3,medium:2,low:1}[s.confidence] ?? 0;
  const status = s.status === 'open' ? 1 : 0;
  return confidence + status;
}
function inspect() {
  const signals = csv(SIGNALS);
  const missions = csv(MISSIONS);
  const active = new Set(missions.filter(m => ['planned','running','published'].includes(m.status)).map(m => m.signal_id));
  const candidates = signals.map(s => ({
    signal_id:s.signal_id, topic:s.topic, signal_type:s.signal_type, confidence:s.confidence,
    status:s.status, score:scoreSignal(s), covered_by_active_mission:active.has(s.signal_id),
    next_action:s.next_action, evidence:s.evidence
  })).sort((a,b)=>b.score-a.score);
  return {runtime:'editorial-opportunity-runtime-v1',generated_at:new Date().toISOString(),candidate_count:candidates.length,candidates};
}
function run() {
  const result=inspect();
  const eligible=result.candidates.filter(c=>c.status==='open'&&!c.covered_by_active_mission);
  const proposal={runtime:result.runtime,generated_at:result.generated_at,status:eligible.length?'OPPORTUNITIES_READY':'NO_UNCOVERED_OPPORTUNITIES',opportunities:eligible,authority:{ranking:false,mission_creation:false},boundary:'Score is an operational prioritization signal, not a claim of business value or outcome.'};
  writeFileSync(join(INTEL,'opportunity-portfolio.json'),JSON.stringify(proposal,null,2)+'\n');
  console.log('OPPORTUNITY-PORTFOLIO: '+proposal.status);
  console.log('CANDIDATES: '+result.candidate_count);
  console.log('UNASSIGNED: '+eligible.length);
  console.log('ARTIFACT: 04-revenue-system/07-intelligence/opportunity-portfolio.json');
}
const [command]=process.argv.slice(2);
try { if(command==='run') run(); else throw new Error('usage: editorial-opportunity-runtime.mjs run'); }
catch(e){ console.error('OPPORTUNITY-PORTFOLIO: ERROR '+e.message); process.exitCode=1; }
