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
  // This runtime inspects readiness; it does not publish. It used to write its
  // result to publication-receipt.json, which made a not-published run look like
  // it had produced a receipt and put a second writer on that path. The readiness
  // record now lives in its own artifact, and only the stage 61 adapter may write
  // a receipt.
  const plan={runtime:'value-mission-publication-runtime-v1',run_id:runId,mission_id:run.manifest.mission_id,status:result.status,publication_authority:false,adapter:'manual-or-trusted-blogspot-adapter',publication_plan:{status:'NOT_EXECUTED',url:'',published_at:'',external_id:''},approval:{status:'PENDING'},checks:result.checks,boundary:'No external publication is performed by this deterministic runtime unless an approved adapter is explicitly invoked. This artifact is a readiness check, not a publication receipt.'};
  writeFileSync(join(run.dir,'value-publication-plan.json'),JSON.stringify(plan,null,2)+'\n');
  console.log('MISSION-PUBLISH: '+result.status); console.log('MISSION: '+run.manifest.mission_id); console.log('RUN: '+runId); console.log('ARTIFACT: '+run.dir.replace(ROOT+'/','')+'/value-publication-plan.json');
  if(result.status==='BLOCKED'){ console.log('BLOCKERS: '+result.blockers.join(', ')); console.log('NEXT: approve the release candidate, then invoke a trusted publication adapter'); } else console.log('NEXT: invoke the trusted adapter; a publication receipt is written only by the stage 61 adapter after it verifies the live public post');
  if(result.status==='BLOCKED') process.exitCode=2;
}
const [command,id]=process.argv.slice(2);
try { if(command==='check'&&id) console.log(JSON.stringify(inspect(id),null,2)); else if(command==='prepare'&&id) prepare(id); else throw new Error('usage: value-mission-publication-runtime.mjs check|prepare <run_id>'); }
catch(e){ fail(e instanceof Error?e.message:String(e)); }
