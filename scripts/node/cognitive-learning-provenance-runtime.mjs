#!/usr/bin/env node
/** Stage 54 — Cognitive Learning Commit Provenance Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const M=join(process.cwd(),'04-revenue-system/07-intelligence/cognitive-memory');
const COMMITS=join(M,'learning-commits.jsonl'), FEEDBACK=join(M,'policy-feedback.jsonl'), GATES=join(M,'learning-eligibility-gates.jsonl'), ATTR=join(M,'policy-outcome-attributions.jsonl'), OUT=join(M,'policy-outcomes.jsonl'), EVID=join(M,'policy-execution-evidence.jsonl'), PROV=join(M,'learning-commit-provenance.jsonl');

function ensure(){mkdirSync(M,{recursive:true});for(const p of [COMMITS,FEEDBACK,GATES,ATTR,OUT,EVID,PROV])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function add(row){appendFileSync(PROV,JSON.stringify({id:'PROV-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...row})+'\n');}
function build(commitId){
 const c=read(COMMITS).find(x=>x.id===commitId); if(!c)throw Error('unknown commit id: '+commitId);
 const f=read(FEEDBACK).find(x=>x.id===c.feedback_id), g=f?read(GATES).filter(x=>x.feedback_id===f.id||x.execution_id===f.execution_id).at(-1):null;
 const a=f?read(ATTR).filter(x=>x.execution_id===f.execution_id).at(-1):null;
 const outcomeIds=a?.outcome_ids||f?.outcome_ids||[];
 const outcomes=read(OUT).filter(x=>outcomeIds.includes(x.outcome_id)||outcomeIds.includes(x.id));
 const evidence=read(EVID).filter(x=>x.execution_id===f?.execution_id).at(-1);
 const findings=[];
 if(!f)findings.push('MISSING_FEEDBACK');
 if(!g||g.gate!=='PASS'||g.status!=='LEARNING_ELIGIBLE')findings.push('MISSING_OR_INVALID_ELIGIBILITY_GATE');
 if(!a||a.gate!=='PASS'||a.learning_eligible!==true)findings.push('MISSING_OR_INVALID_ATTRIBUTION');
 if(!outcomes.length)findings.push('MISSING_OUTCOME_PROVENANCE');
 if(!evidence)findings.push('MISSING_EVIDENCE_PROVENANCE');
 const row={commit_id:commitId,feedback_id:f?.id||null,execution_id:f?.execution_id||g?.execution_id||null,attribution_id:a?.id||null,outcome_ids:outcomes.map(x=>x.outcome_id||x.id),evidence_id:evidence?.id||null,eligibility_gate_id:g?.id||null,findings,gate:findings.length?'BLOCK':'PASS',status:findings.length?'PROVENANCE_INCOMPLETE':'PROVENANCE_VERIFIED',chain:['OUTCOME','EVIDENCE','ATTRIBUTION','FEEDBACK','ELIGIBILITY_GATE','LEARNING_COMMIT']};
 add(row);
 console.log(JSON.stringify({runtime:'cognitive-learning-provenance-runtime-v1',stage:54,status:row.status,provenance:row,authority:{provenance_verification:true,learning_commit:false,belief_update:false,policy_edit:false,mission_creation:false}},null,2));
}
function status(){ensure();const r=read(PROV);console.log(JSON.stringify({runtime:'cognitive-learning-provenance-runtime-v1',stage:54,status:'READY',provenance_records:r.length,verified:r.filter(x=>x.gate==='PASS').length,incomplete:r.filter(x=>x.gate==='BLOCK').length,authority:{provenance_verification:true,learning_commit:false,belief_update:false,policy_edit:false,mission_creation:false}},null,2));}
function review(id){const r=read(PROV).filter(x=>!id||x.id===id||x.commit_id===id);console.log(JSON.stringify({runtime:'cognitive-learning-provenance-runtime-v1',status:'PROVENANCE_REVIEW',count:r.length,records:r,authority:{review_only:true,learning_commit:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);
try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='build')build(a[0]);else if(cmd==='review')review(a[0]);else throw Error('usage: ... init|status|build <commit_id>|review [id]');}catch(e){console.error('COGNITIVE-LEARNING-PROVENANCE: ERROR '+e.message);process.exitCode=1}
