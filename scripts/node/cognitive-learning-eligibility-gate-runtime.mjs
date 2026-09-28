#!/usr/bin/env node
/** Stage 51 — Cognitive Learning Eligibility & Commit Gate Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const M=join(process.cwd(),'04-revenue-system/07-intelligence/cognitive-memory');
const ATTR=join(M,'policy-outcome-attributions.jsonl'), FEEDBACK=join(M,'policy-feedback.jsonl'), VALID=join(M,'learning-validations.jsonl'), GATE=join(M,'learning-eligibility-gates.jsonl');

function ensure(){mkdirSync(M,{recursive:true});for(const p of [ATTR,FEEDBACK,VALID,GATE])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function add(row){appendFileSync(GATE,JSON.stringify({id:'LEARNGATE-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...row})+'\n');}
function check(args){
  const [executionId,reviewer='learning-gate',notes=''] = args;
  if(!executionId)throw Error('usage: check <execution_id> [reviewer] [notes]');
  const a=read(ATTR).filter(x=>x.execution_id===executionId).at(-1), f=read(FEEDBACK).filter(x=>x.execution_id===executionId).at(-1);
  const findings=[];
  if(!a)findings.push('MISSING_ATTRIBUTION');
  else if(a.gate!=='PASS'||a.learning_eligible!==true)findings.push('ATTRIBUTION_NOT_LEARNING_ELIGIBLE');
  if(!f)findings.push('MISSING_FEEDBACK');
  else if(f.status!=='PROPOSED_LEARNING')findings.push('FEEDBACK_NOT_PROPOSED');
  const validations=f?read(VALID).filter(x=>x.commit_id&&x.feedback_id===f.id):[];
  if(validations.some(x=>x.gate==='BLOCK'||x.result==='REGRESSION_FLAG'))findings.push('REGRESSION_BLOCK');
  const row={execution_id:executionId,attribution_id:a?.id||null,feedback_id:f?.id||null,validation_ids:validations.map(x=>x.id),reviewer,notes,findings,gate:findings.length?'BLOCK':'PASS',status:findings.length?'LEARNING_BLOCKED':'LEARNING_ELIGIBLE',next_action:findings.length?'review':'eligible_for_commit'};
  add(row);
  console.log(JSON.stringify({runtime:'cognitive-learning-eligibility-gate-runtime-v1',status:row.status,gate:row,authority:{learning_eligibility_gate:true,learning_commit:false,belief_update:false,policy_edit:false,mission_creation:false}},null,2));
}
function review(id){const r=read(GATE).filter(x=>!id||x.id===id||x.execution_id===id);console.log(JSON.stringify({runtime:'cognitive-learning-eligibility-gate-runtime-v1',status:'LEARNING_GATE_REVIEW',count:r.length,gates:r,authority:{review_only:true,learning_commit:false}},null,2));}
function status(){ensure();const r=read(GATE);console.log(JSON.stringify({runtime:'cognitive-learning-eligibility-gate-runtime-v1',stage:51,status:'READY',gates:r.length,eligible:r.filter(x=>x.gate==='PASS').length,blocked:r.filter(x=>x.gate==='BLOCK').length,authority:{learning_eligibility_gate:true,learning_commit:false,belief_update:false,policy_edit:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);
try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='check')check(a);else if(cmd==='review')review(a[0]);else throw Error('usage: ... init|status|check <execution_id> [reviewer] [notes]|review [id]');}catch(e){console.error('COGNITIVE-LEARNING-ELIGIBILITY-GATE: ERROR '+e.message);process.exitCode=1}
