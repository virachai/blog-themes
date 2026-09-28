#!/usr/bin/env node
/** Stage 55 — Cognitive Learning Provenance Integrity & Tamper Detection Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const M=join(process.cwd(),'04-revenue-system/07-intelligence/cognitive-memory');
const COMMITS=join(M,'learning-commits.jsonl'), FEEDBACK=join(M,'policy-feedback.jsonl'), GATES=join(M,'learning-eligibility-gates.jsonl'), ATTR=join(M,'policy-outcome-attributions.jsonl'), OUT=join(M,'policy-outcomes.jsonl'), EVID=join(M,'policy-execution-evidence.jsonl'), PROV=join(M,'learning-commit-provenance.jsonl'), INT=join(M,'learning-provenance-integrity.jsonl');

function ensure(){mkdirSync(M,{recursive:true});for(const p of [COMMITS,FEEDBACK,GATES,ATTR,OUT,EVID,PROV,INT])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function add(row){appendFileSync(INT,JSON.stringify({id:'INT-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...row})+'\n');}
function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
function digest(v){return createHash('sha256').update(canonical(v)).digest('hex');}
function resolve(p){
 const c=read(COMMITS).find(x=>x.id===p.commit_id), f=read(FEEDBACK).find(x=>x.id===p.feedback_id), g=read(GATES).find(x=>x.id===p.eligibility_gate_id), a=read(ATTR).find(x=>x.id===p.attribution_id), e=read(EVID).find(x=>x.id===p.evidence_id);
 const outcomes=read(OUT).filter(x=>(p.outcome_ids||[]).includes(x.outcome_id)||(p.outcome_ids||[]).includes(x.id)), findings=[];
 if(!c)findings.push('COMMIT_MISSING');
 if(!f||f.execution_id!==p.execution_id||f.id!==p.feedback_id)findings.push('FEEDBACK_LINEAGE_MISMATCH');
 if(!g||g.execution_id!==p.execution_id||g.feedback_id!==p.feedback_id||g.gate!=='PASS'||g.status!=='LEARNING_ELIGIBLE')findings.push('ELIGIBILITY_GATE_INVALID');
 if(!a||a.execution_id!==p.execution_id||a.gate!=='PASS'||a.learning_eligible!==true)findings.push('ATTRIBUTION_INVALID');
 if(outcomes.length!==(p.outcome_ids||[]).length||!outcomes.length)findings.push('OUTCOME_PROVENANCE_INVALID');
 if(!e||e.execution_id!==p.execution_id)findings.push('EVIDENCE_PROVENANCE_INVALID');
 const chain=['OUTCOME','EVIDENCE','ATTRIBUTION','FEEDBACK','ELIGIBILITY_GATE','LEARNING_COMMIT'];
 if(canonical(p.chain)!==canonical(chain))findings.push('CHAIN_INVALID');
 const snapshot={commit:c||null,feedback:f||null,gate:g||null,attribution:a||null,outcomes,evidence:e||null,chain:p.chain||null};
 return {snapshot,findings,source_digest:digest(snapshot)};
}
function check(id){
 const p=read(PROV).find(x=>x.id===id||x.commit_id===id);if(!p)throw Error('unknown provenance id: '+id);
 const r=resolve(p), prior=read(INT).filter(x=>x.provenance_id===p.id).at(-1), drift=prior?.source_digest&&prior.source_digest!==r.source_digest, baseline=!prior, findings=[...r.findings];
 if(drift)findings.push('SOURCE_DIGEST_DRIFT');
 const status=findings.length?(drift?'TAMPER_DETECTED':'PROVENANCE_BROKEN'):(baseline?'BASELINE_ESTABLISHED':'INTEGRITY_VERIFIED');
 const row={provenance_id:p.id,commit_id:p.commit_id,source_digest:r.source_digest,baseline,findings,gate:findings.length?'BLOCK':'PASS',status,chain:p.chain};add(row);
 console.log(JSON.stringify({runtime:'cognitive-learning-provenance-integrity-runtime-v1',stage:55,status,row,authority:{provenance_integrity_verification:true,tamper_detection:true,learning_commit:false,belief_update:false,policy_edit:false,mission_creation:false}},null,2));
}
function audit(){ensure();const ps=read(PROV),results=ps.map(p=>{const r=resolve(p);return {provenance_id:p.id,findings:r.findings,status:r.findings.length?'BLOCK':'PASS'}});console.log(JSON.stringify({runtime:'cognitive-learning-provenance-integrity-runtime-v1',stage:55,status:results.some(x=>x.status==='BLOCK')?'INTEGRITY_FINDINGS':'INTEGRITY_CLEAN',provenance_records:results.length,blocked:results.filter(x=>x.status==='BLOCK').length,verified:results.filter(x=>x.status==='PASS').length,results,authority:{provenance_integrity_verification:true,tamper_detection:true,learning_commit:false}},null,2));}
function status(){ensure();const r=read(INT);console.log(JSON.stringify({runtime:'cognitive-learning-provenance-integrity-runtime-v1',stage:55,status:'READY',integrity_records:r.length,verified:r.filter(x=>x.status==='INTEGRITY_VERIFIED').length,baselines:r.filter(x=>x.status==='BASELINE_ESTABLISHED').length,tampered:r.filter(x=>x.status==='TAMPER_DETECTED').length,broken:r.filter(x=>x.status==='PROVENANCE_BROKEN').length,authority:{provenance_integrity_verification:true,tamper_detection:true,learning_commit:false,belief_update:false,policy_edit:false,mission_creation:false}},null,2));}
function review(id){const r=read(INT).filter(x=>!id||x.id===id||x.provenance_id===id||x.commit_id===id);console.log(JSON.stringify({runtime:'cognitive-learning-provenance-integrity-runtime-v1',status:'INTEGRITY_REVIEW',count:r.length,records:r,authority:{review_only:true,learning_commit:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);
try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='check')check(a[0]);else if(cmd==='audit')audit();else if(cmd==='review')review(a[0]);else throw Error('usage: init|status|check <provenance_id>|audit|review [id]');}catch(e){console.error('COGNITIVE-LEARNING-PROVENANCE-INTEGRITY: ERROR '+e.message);process.exitCode=1}
