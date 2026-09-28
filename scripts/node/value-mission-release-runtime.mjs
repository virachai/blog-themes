#!/usr/bin/env node
/** Stage 22D — Value Mission Release Candidate Runtime. Fail-closed release preparation. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');
function fail(message){ console.error('MISSION-RELEASE: ERROR '+message); process.exitCode=1; }
function load(runId){ const dir=join(RUNS,runId); const manifest=join(dir,'manifest.json'); if(!existsSync(manifest)) throw new Error('run not found: '+runId); return {dir,manifest:JSON.parse(readFileSync(manifest,'utf8'))}; }
function readJson(file){ return existsSync(file)?JSON.parse(readFileSync(file,'utf8')):null; }
function inspect(runId){
  const run=load(runId), asset=readJson(join(run.dir,'asset-spec.json')), report=readJson(join(run.dir,'asset-report.json'));
  const checks=[
    {id:'asset_spec',pass:!!asset,target:'asset-spec.json exists'},
    {id:'asset_package',pass:existsSync(join(run.dir,'asset-package.md')),target:'asset-package.md exists'},
    {id:'evidence_ready',pass:asset?.status==='RELEASE_CANDIDATE' && asset?.provenance?.evidence_gate==='EVIDENCE_READY',target:'asset evidence gate is EVIDENCE_READY'},
    {id:'asset_authority',pass:asset?.provenance?.evidence_authority===false,target:'evidence authority remains explicit'},
    {id:'release_boundary',pass:report?.authority?.release===false,target:'release authority is not granted by runtime'}
  ];
  const blockers=checks.filter(x=>!x.pass).map(x=>x.id);
  return {runtime:'value-mission-release-runtime-v1',run_id:runId,mission_id:run.manifest.mission_id,status:blockers.length?'BLOCKED':'READY_FOR_RELEASE_APPROVAL',checks,blockers,release_authority:false};
}
function build(runId){
  const run=load(runId), result=inspect(runId), asset=readJson(join(run.dir,'asset-spec.json'));
  const candidate={runtime:'value-mission-release-runtime-v1',run_id:runId,mission_id:run.manifest.mission_id,status:result.status,release_authority:false,approval_required:true,approval:{status:'PENDING',approved_by:'',approved_at:'',notes:''},source:{signal_id:run.manifest.mission.signal_id,evidence_sources:asset?.traceability?.sources||[]},asset:{spec:'asset-spec.json',package:'asset-package.md'},gates:{release:result.status==='READY_FOR_RELEASE_APPROVAL'?'READY_FOR_APPROVAL':'BLOCKED',publication:'NOT_EXECUTED',measurement:'NOT_STARTED'},boundary:'This runtime prepares a release candidate only; it does not publish, claim publication success, or grant release authority.'};
  writeFileSync(join(run.dir,'release-candidate.json'),JSON.stringify(candidate,null,2)+'\n');
  writeFileSync(join(run.dir,'release-report.json'),JSON.stringify({runtime:'value-mission-release-runtime-v1',run_id:runId,mission_id:run.manifest.mission_id,status:result.status,checks:result.checks,blockers:result.blockers,authority:{release:false,publish:false}},null,2)+'\n');
  console.log('MISSION-RELEASE: '+result.status); console.log('MISSION: '+run.manifest.mission_id); console.log('RUN: '+runId); console.log('ARTIFACTS: '+run.dir.replace(ROOT+'/','')+'/release-candidate.json, release-report.json');
  if(result.status==='BLOCKED'){ console.log('BLOCKERS: '+result.blockers.join(', ')); console.log('NEXT: satisfy the asset/evidence gate, then rerun prepare'); } else console.log('NEXT: obtain explicit approval before any publication adapter is invoked');
  if(result.status==='BLOCKED') process.exitCode=2;
}
const [command,id]=process.argv.slice(2);
try { if(command==='check'&&id) console.log(JSON.stringify(inspect(id),null,2)); else if(command==='prepare'&&id) build(id); else throw new Error('usage: value-mission-release-runtime.mjs check|prepare <run_id>'); }
catch(e){ fail(e instanceof Error?e.message:String(e)); }
