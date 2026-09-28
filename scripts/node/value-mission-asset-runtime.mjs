#!/usr/bin/env node
/** Stage 22C — Value Mission Asset Runtime. Evidence-gated asset package builder. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolvePublicationTitle } from './publication-payload.mjs';
const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');
function fail(message){ console.error('MISSION-ASSET: ERROR '+message); process.exitCode=1; }
function load(runId){ const dir=join(RUNS,runId); const manifest=join(dir,'manifest.json'); if(!existsSync(manifest)) throw new Error('run not found: '+runId); return {dir,manifest:JSON.parse(readFileSync(manifest,'utf8'))}; }
function evidence(run){ const file=join(run.dir,'evidence.json'); return existsSync(file)?JSON.parse(readFileSync(file,'utf8')):null; }
function evidenceGate(runId){ const run=load(runId), e=evidence(run); const obs=Array.isArray(e?.observations)?e.observations:[]; const checks=[
{id:'evidence_file',pass:!!e,target:'evidence.json exists'},
{id:'observations_present',pass:obs.length>0,target:'>= 1 observation'},
{id:'traceable_sources',pass:obs.length>0&&obs.every(x=>Array.isArray(x.sources)&&x.sources.length>0),target:'every observation has sources'},
{id:'https_sources',pass:obs.length>0&&obs.every(x=>x.sources.every(s=>/^https:\/\//i.test(String(s)))),target:'all sources use HTTPS'},
{id:'claim_recorded',pass:obs.length>0&&obs.every(x=>String(x.claim??'').trim()!==''),target:'every observation records a claim'},
{id:'uncertainty_recorded',pass:obs.length>0&&obs.every(x=>String(x.uncertainty??'').trim()!==''),target:'every observation records uncertainty'}];
return {run,observations:obs,gate:{status:checks.every(x=>x.pass)?'EVIDENCE_READY':'BLOCKED',checks,blockers:checks.filter(x=>!x.pass).map(x=>x.id)}}; }
function build(runId){ const {run,observations,gate}=evidenceGate(runId); const m=run.manifest.mission; const sources=[...new Set(observations.flatMap(x=>x.sources||[]))]; const title=resolvePublicationTitle({mission:m}); const spec={runtime:'value-mission-asset-runtime-v1',mission_id:m.mission_id,run_id:runId,title:title.title,publication:{title_source:title.source,publication_blocker:title.title?null:'title_missing'},status:gate.status==='EVIDENCE_READY'?'RELEASE_CANDIDATE':'BLOCKED',traceability:{signal_id:m.signal_id,evidence_observations:observations.length,sources},objective:m.issue,audience:m.audience,problem:m.problem,thesis:m.thesis,value_class:m.value_class,value_path:m.value_path,success_metric:m.success_metric,required_sections:['Problem / context','Evidence and what it supports','Editorial thesis','Practical implications','Uncertainty / limitations','Next action'],provenance:{evidence_gate:gate.status,evidence_authority:false}};
writeFileSync(join(run.dir,'asset-spec.json'),JSON.stringify(spec,null,2)+'\n');
const evidenceLines=observations.map((x,i)=>`### Observation ${i+1}\n- Observation: ${x.observation}\n- Claim supported: ${x.claim}\n- Sources: ${x.sources.join(', ')}\n- Checked: ${x.checked_at||'not recorded'}\n- Uncertainty: ${x.uncertainty}\n- Notes: ${x.notes||''}`).join('\n\n');
const draft=['# Asset Package',``,`> Status: ${spec.status}`,`> Mission: ${m.mission_id}`,`> Run: ${runId}`,'','## Editorial Thesis',m.thesis,'','## Audience',m.audience,'','## User Problem',m.problem,'','## Evidence',evidenceLines||'_No evidence has passed the evidence gate._','','## Asset Structure',...spec.required_sections.map(x=>`- ${x}`),'','## Value Path',m.value_path,'','## Release Boundary','This package is not published. Publication requires an explicit release gate.'].join('\n')+'\n';
writeFileSync(join(run.dir,'asset-package.md'),draft); writeFileSync(join(run.dir,'asset-report.json'),JSON.stringify({runtime:'value-mission-asset-runtime-v1',run_id:runId,mission_id:m.mission_id,status:spec.status,evidence_gate:gate,artifacts:['asset-spec.json','asset-package.md','asset-report.json'],authority:{asset:false,release:false}},null,2)+'\n');
console.log('MISSION-ASSET: '+spec.status); console.log('MISSION: '+m.mission_id); console.log('RUN: '+runId); console.log('ARTIFACTS: '+run.dir.replace(ROOT+'/','')+'/asset-spec.json, asset-package.md, asset-report.json'); if(spec.status==='BLOCKED') { console.log('BLOCKERS: '+gate.blockers.join(', ')); console.log('NEXT: add real evidence, then rerun build'); } else console.log('NEXT: review the asset package, pass editorial quality gates, then request explicit release approval'); if(spec.status==='BLOCKED') process.exitCode=2; }
const [command,id]=process.argv.slice(2); try { if(command==='build'&&id) build(id); else throw new Error('usage: value-mission-asset-runtime.mjs build <run_id>'); } catch(e){ fail(e instanceof Error?e.message:String(e)); }
