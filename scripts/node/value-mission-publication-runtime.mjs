#!/usr/bin/env node
/** Stage 22E — Value Mission Publication Runtime. Approval-gated publication adapter boundary. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');
function fail(message){ console.error('MISSION-PUBLISH: ERROR '+message); process.exitCode=1; }
function load(runId){ const dir=join(RUNS,runId); const manifest=join(dir,'manifest.json'); if(!existsSync(manifest)) throw new Error('run not found: '+runId); return {dir,manifest:JSON.parse(readFileSync(manifest,'utf8'))}; }
function readJson(file){ return existsSync(file)?JSON.parse(readFileSync(file,'utf8')):null; }
function inspect(runId){
  const run=load(runId), candidate=readJson(join(run.dir,'release-candidate.json'));
  const checks=[
    {id:'release_candidate',pass:!!candidate,target:'release-candidate.json exists'},
    {id:'release_ready',pass:candidate?.status==='READY_FOR_RELEASE_APPROVAL' && candidate?.gates?.release==='READY_FOR_APPROVAL',target:'release candidate is ready for approval'},
    {id:'approval',pass:candidate?.approval?.status==='APPROVED',target:'explicit approval is APPROVED'},
    {id:'publish_boundary',pass:candidate?.release_authority===false,target:'publication authority remains adapter-gated'}
  ];
  const blockers=checks.filter(x=>!x.pass).map(x=>x.id);
  return {runtime:'value-mission-publication-runtime-v1',run_id:runId,mission_id:run.manifest.mission_id,status:blockers.length?'BLOCKED':'APPROVED_FOR_ADAPTER',checks,blockers,publication_authority:false};
}
function prepare(runId){
  const run=load(runId), result=inspect(runId);
  const receipt={runtime:'value-mission-publication-runtime-v1',run_id:runId,mission_id:run.manifest.mission_id,status:result.status,publication_authority:false,adapter:'manual-or-trusted-blogspot-adapter',publication:{status:'NOT_EXECUTED',url:'',published_at:'',external_id:''},approval:{status:'PENDING'},checks:result.checks,boundary:'No external publication is performed by this deterministic runtime unless an approved adapter is explicitly invoked.'};
  writeFileSync(join(run.dir,'publication-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
  console.log('MISSION-PUBLISH: '+result.status); console.log('MISSION: '+run.manifest.mission_id); console.log('RUN: '+runId); console.log('ARTIFACT: '+run.dir.replace(ROOT+'/','')+'/publication-receipt.json');
  if(result.status==='BLOCKED'){ console.log('BLOCKERS: '+result.blockers.join(', ')); console.log('NEXT: approve the release candidate, then invoke a trusted publication adapter'); } else console.log('NEXT: invoke the trusted adapter and record the real publication URL/id in publication-receipt.json');
  if(result.status==='BLOCKED') process.exitCode=2;
}
const [command,id]=process.argv.slice(2);
try { if(command==='check'&&id) console.log(JSON.stringify(inspect(id),null,2)); else if(command==='prepare'&&id) prepare(id); else throw new Error('usage: value-mission-publication-runtime.mjs check|prepare <run_id>'); }
catch(e){ fail(e instanceof Error?e.message:String(e)); }
