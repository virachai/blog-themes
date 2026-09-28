#!/usr/bin/env node
/** Stage 22G — Value Mission Learning & Next-Mission Runtime. Durable learning and next-mission proposal. */
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');
const LEARNINGS = join(ROOT, '04-revenue-system/07-intelligence/learnings.csv');
const MISSIONS = join(ROOT, '04-revenue-system/07-intelligence/value-missions.csv');
function fail(message){ console.error('MISSION-LEARN: ERROR '+message); process.exitCode=1; }
function load(runId){ const dir=join(RUNS,runId); const manifest=join(dir,'manifest.json'); if(!existsSync(manifest)) throw new Error('run not found: '+runId); return {dir,manifest:JSON.parse(readFileSync(manifest,'utf8'))}; }
function readJson(file){ return existsSync(file)?JSON.parse(readFileSync(file,'utf8')):null; }
function inspect(runId){
 const run=load(runId), report=readJson(join(run.dir,'measurement-report.json'));
 const checks=[
  {id:'measurement_report',pass:!!report,target:'measurement-report.json exists'},
  {id:'measurement_complete',pass:report?.status==='MEASUREMENT_COMPLETE',target:'measurement is complete'},
  {id:'decision',pass:['success','mixed','negative','inconclusive'].includes(report?.decision),target:'decision is recorded'},
  {id:'diagnosis',pass:String(report?.diagnosis||'').trim()!=='',target:'diagnosis is recorded'},
  {id:'evidence',pass:Array.isArray(report?.observations)&&report.observations.length>0,target:'measured observations exist'}
 ];
 const blockers=checks.filter(x=>!x.pass).map(x=>x.id);
 return {runtime:'value-mission-learning-runtime-v1',run_id:runId,mission_id:run.manifest.mission_id,status:blockers.length?'BLOCKED':'LEARNING_READY',checks,blockers,learning_authority:false};
}
function init(runId){
 const run=load(runId), result=inspect(runId); if(result.status!=='LEARNING_READY'){ console.log('MISSION-LEARN: BLOCKED'); console.log('BLOCKERS: '+result.blockers.join(', ')); process.exitCode=2; return; }
 const report=readJson(join(run.dir,'measurement-report.json'));
 const proposal={runtime:'value-mission-learning-runtime-v1',run_id:runId,mission_id:run.manifest.mission_id,status:'DRAFT',source:{measurement_report:'measurement-report.json',decision:report.decision},learning:{what_changed:'',evidence:'',confidence:'',scope:'',limits:'',action:''},next_mission:{issue:'',thesis:'',audience:'',problem:'',evidence_plan:'',value_class:run.manifest.mission.value_class,value_path:run.manifest.mission.value_path,success_metric:run.manifest.mission.success_metric},authority:{learning:false,mission_creation:false}};
 writeFileSync(join(run.dir,'learning-record.json'),JSON.stringify(proposal,null,2)+'\n');
 writeFileSync(join(run.dir,'next-mission.md'),['# Next Mission Proposal','',`- Source mission: ${run.manifest.mission_id}`,`- Source decision: ${report.decision}`,'','## Durable Learning','- What changed:','- Evidence:','- Confidence:','- Scope:','- Limits:','- Action:','','## Next Mission','- Issue:','- Thesis:','- Audience:','- Problem:','- Evidence plan:','- Value class:','- Value path:','- Success metric:','','> This is a proposal. It is not automatically added to the mission ledger.'].join('\n')+'\n');
 console.log('MISSION-LEARN: INITIALIZED'); console.log('ARTIFACTS: '+run.dir.replace(ROOT+'/','')+'/learning-record.json, next-mission.md'); console.log('NEXT: fill durable learning and next-mission proposal, then validate');
}
function validate(runId){
 const run=load(runId), result=inspect(runId), learning=readJson(join(run.dir,'learning-record.json'));
 const checks=[...result.checks,{id:'learning_record',pass:!!learning,target:'learning-record.json exists'},{id:'learning_text',pass:String(learning?.learning?.what_changed||'').trim()!==''&&String(learning?.learning?.evidence||'').trim()!==''&&String(learning?.learning?.confidence||'').trim()!=='',target:'learning has change, evidence, confidence'},{id:'learning_limits',pass:String(learning?.learning?.scope||'').trim()!==''&&String(learning?.learning?.limits||'').trim()!=='',target:'learning scope and limits are explicit'},{id:'next_mission',pass:['issue','thesis','audience','problem','evidence_plan','value_class','value_path','success_metric'].every(k=>String(learning?.next_mission?.[k]??'').trim()!==''),target:'next mission proposal is complete'}];
 const blockers=checks.filter(x=>!x.pass).map(x=>x.id); const status=blockers.length?'BLOCKED':'READY_FOR_REVIEW'; console.log(JSON.stringify({runtime:'value-mission-learning-runtime-v1',run_id:runId,mission_id:run.manifest.mission_id,status,checks,blockers,learning_authority:false,mission_creation_authority:false},null,2)); if(status==='BLOCKED')process.exitCode=2;
}
function commit(runId){
 const run=load(runId), result=inspect(runId), learning=readJson(join(run.dir,'learning-record.json')); if(result.status!=='LEARNING_READY') throw new Error('measurement is not ready for learning'); if(!learning) throw new Error('learning-record.json not found');
 const required=['what_changed','evidence','confidence','scope','limits','action']; if(!required.every(k=>String(learning.learning?.[k]||'').trim())) throw new Error('learning record incomplete');
 if(!['revenue','asset','infrastructure'].includes(learning.next_mission?.value_class)) throw new Error('invalid next mission value_class');
 const csvEscape=v=>'"'+String(v??'').replaceAll('"','""')+'"';
 if(!existsSync(LEARNINGS)) throw new Error('missing learnings ledger: '+LEARNINGS);
 const learningId='LRN-'+Date.now(); const report=readJson(join(run.dir,'measurement-report.json')); appendFileSync(LEARNINGS,[learningId,new Date().toISOString(),run.manifest.mission_id,learning.learning.evidence,learning.learning.what_changed,learning.learning.confidence,learning.learning.action,'proposed'].map(csvEscape).join(',')+'\n');
 const nextId='VLM-NEXT-'+Date.now(); writeFileSync(join(run.dir,'next-mission.json'),JSON.stringify({mission_id:nextId,status:'PROPOSED',source_learning:learningId,source_mission:run.manifest.mission_id,mission:learning.next_mission,authority:false},null,2)+'\n');
 console.log('MISSION-LEARN: COMMITTED'); console.log('LEARNING: '+learningId); console.log('NEXT MISSION: '+nextId); console.log('STATUS: PROPOSED — requires human/editorial review before ledger activation');
}
const [command,id]=process.argv.slice(2); try { if(command==='init'&&id)init(id); else if(command==='check'&&id)validate(id); else if(command==='commit'&&id)commit(id); else throw new Error('usage: value-mission-learning-runtime.mjs init|check|commit <run_id>'); } catch(e){ fail(e instanceof Error?e.message:String(e)); }
