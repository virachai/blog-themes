#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { assertAuthoritativeReceipt } from './publication-receipt.mjs';

const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');
const json = f => existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
const save = (d,n,v) => writeFileSync(join(d,n), JSON.stringify(v,null,2)+'\n');

function load(id) {
  const dir=join(RUNS,id), manifest=json(join(dir,'manifest.json'));
  if(!manifest) throw new Error('run not found: '+id);
  return {dir,manifest,intake:json(join(dir,'publication-measurement-intake.json')),outcome:json(join(dir,'outcome.json')),receipt:json(join(dir,'publication-receipt.json')),plan:json(join(dir,'measurement-plan.json'))};
}
function receiptOK(r){try{assertAuthoritativeReceipt(r);return true}catch{return false}}
function inspect(id) {
  const r=load(id), blockers=[];
  if(r.intake?.status!=='READY_FOR_MEASUREMENT') blockers.push('measurement_intake_not_ready');
  if(!receiptOK(r.receipt)) blockers.push('authoritative_publication_receipt_missing');
  if(!r.plan?.metric || !(Number(r.plan.observation_days)>0)) blockers.push('measurement_plan_invalid');
  if(!r.outcome) blockers.push('outcome_not_recorded');
  else {
    if(!Array.isArray(r.outcome.observations)||!r.outcome.observations.length) blockers.push('observations_missing');
    if(r.outcome.observations?.some(o=>String(o.value??'').trim()==='')) blockers.push('measured_value_missing');
    if(r.outcome.observations?.some(o=>String(o.checked_at??'').trim()==='')) blockers.push('checked_at_missing');
    if(r.outcome.observations?.some(o=>!Array.isArray(o.sources)||!o.sources.length||o.sources.some(s=>!/^https:\/\//i.test(String(s))))) blockers.push('source_missing_or_invalid');
    if(String(r.outcome.baseline??'').trim()==='') blockers.push('baseline_missing');
    if(String(r.outcome.target??'').trim()==='') blockers.push('target_missing');
  }
  return {runtime:'measurement-observation-runtime-v1',stage:65,run_id:id,mission_id:r.manifest.mission_id,status:blockers.length?'BLOCKED':'MEASURED',blockers,measurement_authority:false,external_side_effect:false};
}
function delegate(id,args) {
  const p=spawnSync(process.execPath,['scripts/node/value-mission-measurement-runtime.mjs',...args,id],{cwd:ROOT,encoding:'utf8'});
  process.stdout.write(p.stdout||''); process.stderr.write(p.stderr||''); return p.status??1;
}
function init(id) {
  const r=load(id);
  if(r.intake?.status!=='READY_FOR_MEASUREMENT') throw new Error('Stage 64 is not READY_FOR_MEASUREMENT');
  if(r.outcome) throw new Error('outcome.json already exists; use the existing measurement artifact');
  const status=delegate(id,['init']);
  if(status!==0) process.exitCode=status;
}
function check(id) {
  const result=inspect(id); save(load(id).dir,'measurement-observation-status.json',result);
  console.log(JSON.stringify(result,null,2)); if(result.status!=='MEASURED') process.exitCode=2;
}
function report(id) {
  const result=inspect(id);
  if(result.status!=='MEASURED'){save(load(id).dir,'measurement-observation-status.json',result);console.log(JSON.stringify(result,null,2));process.exitCode=2;return;}
  const status=delegate(id,['report']);
  if(status===0) save(load(id).dir,'measurement-observation-status.json',{...result,status:'MEASUREMENT_COMPLETE',report:'measurement-report.json'});
}
const [cmd,id]=process.argv.slice(2);
try { if(!id||!['init','check','report'].includes(cmd)) throw new Error('usage: measurement-observation-runtime.mjs init|check|report <run_id>'); ({init,check,report}[cmd])(id); }
catch(e){ console.error('MEASUREMENT-OBSERVATION: ERROR '+e.message); process.exitCode=1; }
