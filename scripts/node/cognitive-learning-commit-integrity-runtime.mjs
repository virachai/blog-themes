#!/usr/bin/env node
/** Stage 52 — Cognitive Learning Commit Integrity Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const M=join(process.cwd(),'04-revenue-system/07-intelligence/cognitive-memory');
const COMMITS=join(M,'learning-commits.jsonl'), FEEDBACK=join(M,'policy-feedback.jsonl'), GATES=join(M,'learning-eligibility-gates.jsonl'), INTEGRITY=join(M,'learning-commit-integrity.jsonl');

function ensure(){mkdirSync(M,{recursive:true});for(const p of [COMMITS,FEEDBACK,GATES,INTEGRITY])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function add(row){appendFileSync(INTEGRITY,JSON.stringify({id:'COMMITINT-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...row})+'\n');}
function check(commitId){
  if(!commitId)throw Error('usage: check <commit_id> [reviewer] [notes]');
  const reviewer=process.argv[3]||'commit-integrity', notes=process.argv[4]||'';
  const c=read(COMMITS).find(x=>x.id===commitId); if(!c)throw Error('unknown commit id: '+commitId);
  const f=read(FEEDBACK).find(x=>x.id===c.feedback_id);
  const gates=f?read(GATES).filter(x=>x.feedback_id===f.id||x.execution_id===f.execution_id):[];
  const gate=gates.at(-1)||null;
  const findings=[];
  if(!f)findings.push('MISSING_FEEDBACK');
  if(!gate)findings.push('MISSING_LEARNING_ELIGIBILITY_GATE');
  else if(gate.gate!=='PASS'||gate.status!=='LEARNING_ELIGIBLE')findings.push('LEARNING_GATE_NOT_PASSED');
  if(f&&gate&&gate.feedback_id&&gate.feedback_id!==f.id)findings.push('FEEDBACK_LINEAGE_MISMATCH');
  if(f&&gate&&gate.execution_id!==f.execution_id)findings.push('EXECUTION_LINEAGE_MISMATCH');
  const row={commit_id:commitId,feedback_id:c.feedback_id,execution_id:f?.execution_id||gate?.execution_id||null,gate_id:gate?.id||null,validation_ids:gate?.validation_ids||[],reviewer,notes,findings,gate:findings.length?'BLOCK':'PASS',status:findings.length?'COMMIT_BLOCKED':'COMMIT_AUTHORIZED',next_action:findings.length?'review':'commit_integrity_verified'};
  add(row);
  console.log(JSON.stringify({runtime:'cognitive-learning-commit-integrity-runtime-v1',stage:52,status:row.status,integrity:row,authority:{commit_integrity_verification:true,learning_commit:false,belief_update:false,policy_edit:false,policy_activation:false,mission_creation:false}},null,2));
}
function review(id){const r=read(INTEGRITY).filter(x=>!id||x.id===id||x.commit_id===id);console.log(JSON.stringify({runtime:'cognitive-learning-commit-integrity-runtime-v1',status:'COMMIT_INTEGRITY_REVIEW',count:r.length,records:r,authority:{review_only:true,learning_commit:false,belief_update:false,mission_creation:false}},null,2));}
function status(){ensure();const r=read(INTEGRITY);console.log(JSON.stringify({runtime:'cognitive-learning-commit-integrity-runtime-v1',stage:52,status:'READY',checks:r.length,authorized:r.filter(x=>x.gate==='PASS').length,blocked:r.filter(x=>x.gate==='BLOCK').length,authority:{commit_integrity_verification:true,learning_commit:false,belief_update:false,policy_edit:false,policy_activation:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);
try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='check')check(a[0]);else if(cmd==='review')review(a[0]);else throw Error('usage: ... init|status|check <commit_id> [reviewer] [notes]|review [id]');}catch(e){console.error('COGNITIVE-LEARNING-COMMIT-INTEGRITY: ERROR '+e.message);process.exitCode=1}
