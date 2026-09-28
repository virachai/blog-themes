#!/usr/bin/env node
/** Stage 22F — Value Mission Outcome & Measurement Runtime. Measurement intake and decision gate. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RECEIPT_FILE, assertAuthoritativeReceipt } from './publication-receipt.mjs';
const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');
function fail(message){ console.error('MISSION-MEASURE: ERROR '+message); process.exitCode=1; }
function load(runId){ const dir=join(RUNS,runId); const manifest=join(dir,'manifest.json'); if(!existsSync(manifest)) throw new Error('run not found: '+runId); return {dir,manifest:JSON.parse(readFileSync(manifest,'utf8'))}; }
function readJson(file){ return existsSync(file)?JSON.parse(readFileSync(file,'utf8')):null; }
function inspect(runId){
  const run=load(runId), receipt=readJson(join(run.dir,RECEIPT_FILE)), plan=readJson(join(run.dir,'measurement-plan.json')), outcome=readJson(join(run.dir,'outcome.json'));
  // Existence alone is not evidence of publication — a legacy file at this path,
  // or a readiness record from another runtime, used to satisfy this check.
  let receiptStatus='not present';
  let receiptOk=false;
  try { assertAuthoritativeReceipt(receipt); receiptOk=true; receiptStatus='PUBLISHED (authoritative)'; }
  catch(error){ receiptStatus=error.message; }
  const checks=[
    {id:'publication_receipt',pass:receiptOk,target:'an authoritative '+RECEIPT_FILE+' from the stage 61 adapter is present — '+receiptStatus},
    {id:'published',pass:receiptOk,target:'receipt claims PUBLISHED with url and external_id taken from the verified public post'},
    {id:'measurement_plan',pass:!!plan && Number(plan.observation_days)>0 && String(plan.metric||'').trim()!=='',target:'measurement plan has metric and observation window'},
    {id:'outcome_recorded',pass:!!outcome && Array.isArray(outcome.observations) && outcome.observations.length>0,target:'at least one measured outcome observation'},
    {id:'measured_value',pass:!!outcome && outcome.observations?.every(x=>String(x.value??'').trim()!==''),target:'every outcome has a measured value'},
    {id:'checked_at',pass:!!outcome && outcome.observations?.every(x=>String(x.checked_at??'').trim()!==''),target:'every outcome has checked_at'},
    {id:'source',pass:!!outcome && outcome.observations?.every(x=>Array.isArray(x.sources)&&x.sources.length>0&&x.sources.every(s=>/^https:\/\//i.test(String(s)))),target:'every outcome has HTTPS source'},
    {id:'baseline',pass:!!outcome && String(outcome.baseline??'').trim()!=='',target:'baseline is recorded'},
    {id:'target',pass:!!outcome && String(outcome.target??'').trim()!=='',target:'target is recorded'}
  ];
  const blockers=checks.filter(x=>!x.pass).map(x=>x.id);
  return {runtime:'value-mission-measurement-runtime-v1',run_id:runId,mission_id:run.manifest.mission_id,status:blockers.length?'BLOCKED':'MEASURED',checks,blockers,learning_authority:false};
}
function init(runId){
  const run=load(runId), file=join(run.dir,'outcome.json');
  if(existsSync(file)) throw new Error('outcome.json already exists; edit it instead of overwriting measurement data');
  const plan=readJson(join(run.dir,'measurement-plan.json'))||{};
  writeFileSync(file,JSON.stringify({mission_id:run.manifest.mission_id,run_id:runId,metric:plan.metric||'',observation_window_days:plan.observation_days||'',baseline:'',target:'',observations:[{value:'',unit:'',checked_at:'',sources:[],notes:''}],diagnosis:'',decision:''},null,2)+'\n');
  console.log('MISSION-MEASURE: INITIALIZED'); console.log('FILE: '+file.replace(ROOT+'/','')); console.log('NEXT: enter real measured outcomes and traceable sources, then run check');
}
function check(runId){ const result=inspect(runId); console.log(JSON.stringify(result,null,2)); if(result.status!=='MEASURED') process.exitCode=2; }
function report(runId){
  const run=load(runId), result=inspect(runId), outcome=readJson(join(run.dir,'outcome.json')), plan=readJson(join(run.dir,'measurement-plan.json'));
  if(result.status!=='MEASURED') { console.log('MISSION-MEASURE: BLOCKED'); console.log('BLOCKERS: '+result.blockers.join(', ')); process.exitCode=2; return; }
  const decision=String(outcome.decision||'').trim();
  const validDecision=['success','mixed','negative','inconclusive'].includes(decision);
  if(!validDecision){ console.log('MISSION-MEASURE: BLOCKED'); console.log('BLOCKERS: decision_not_recorded'); process.exitCode=2; return; }
  const artifact={runtime:'value-mission-measurement-runtime-v1',run_id:runId,mission_id:run.manifest.mission_id,status:'MEASUREMENT_COMPLETE',metric:plan.metric,observation_days:plan.observation_days,baseline:outcome.baseline,target:outcome.target,observations:outcome.observations,diagnosis:outcome.diagnosis||'',decision,learning_authority:false,causality_boundary:'Measured outcomes do not by themselves establish causality; interpret against the experiment design and confounders.'};
  writeFileSync(join(run.dir,'measurement-report.json'),JSON.stringify(artifact,null,2)+'\n'); console.log('MISSION-MEASURE: MEASUREMENT_COMPLETE'); console.log('DECISION: '+decision); console.log('ARTIFACT: '+run.dir.replace(ROOT+'/','')+'/measurement-report.json'); console.log('NEXT: create durable learning only from this measured evidence');
}
const [command,id]=process.argv.slice(2);
try { if(command==='init'&&id) init(id); else if(command==='check'&&id) check(id); else if(command==='report'&&id) report(id); else throw new Error('usage: value-mission-measurement-runtime.mjs init|check|report <run_id>'); }
catch(e){ fail(e instanceof Error?e.message:String(e)); }
