#!/usr/bin/env node
/** Stage 50 — Cognitive Policy Outcome Attribution & Learning Integrity Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const M=join(process.cwd(),'04-revenue-system/07-intelligence/cognitive-memory');
const EXEC=join(M,'policy-executions.jsonl'), OUT=join(M,'policy-outcomes.jsonl'), EVID=join(M,'policy-execution-evidence.jsonl');
const ATTR=join(M,'policy-outcome-attributions.jsonl');

function ensure(){mkdirSync(M,{recursive:true});for(const p of [EXEC,OUT,EVID,ATTR])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function add(row){appendFileSync(ATTR,JSON.stringify({id:'ATTR-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...row})+'\n');}
function attribute(args){
  const [executionId,level='UNCERTAIN',rationale='',confounders=''] = args;
  const allowed=new Set(['DIRECT','LIKELY','UNCERTAIN','NOT_ATTRIBUTABLE']);
  if(!executionId||!allowed.has(level)||!rationale)throw Error('usage: attribute <execution_id> <DIRECT|LIKELY|UNCERTAIN|NOT_ATTRIBUTABLE> <rationale> [confounders]');
  const e=read(EXEC).find(x=>x.execution_id===executionId);if(!e)throw Error('unknown execution id: '+executionId);
  const outcomes=read(OUT).filter(x=>x.execution_id===executionId);
  const evidence=read(EVID).filter(x=>x.execution_id===executionId&&x.gate==='PASS'&&x.status==='EVIDENCE_BOUND').at(-1);
  const findings=[];
  if(!outcomes.length)findings.push('MISSING_OUTCOME');
  if(!evidence)findings.push('MISSING_BOUND_EVIDENCE');
  if(!rationale.trim())findings.push('MISSING_ATTRIBUTION_RATIONALE');
  if((level==='DIRECT'||level==='LIKELY')&&!confounders.trim())findings.push('MISSING_CONFOUNDER_ASSESSMENT');
  const learningEligible=!findings.length&&(level==='DIRECT'||level==='LIKELY');
  const row={execution_id:executionId,policy_id:e.policy_id,policy_version:e.policy_version,evidence_id:evidence?.id||null,outcome_ids:outcomes.map(x=>x.outcome_id),attribution:level,rationale,confounders,findings,learning_eligible:learningEligible,gate:findings.length?'BLOCK':(learningEligible?'PASS':'REVIEW'),status:findings.length?'ATTRIBUTION_BLOCKED':(learningEligible?'ATTRIBUTION_VERIFIED':'ATTRIBUTION_REVIEW')};
  add(row);
  console.log(JSON.stringify({runtime:'cognitive-policy-outcome-attribution-runtime-v1',status:row.status,attribution:row,authority:{outcome_attribution:true,learning_eligibility:learningEligible,learning_commit:false,policy_edit:false,belief_update:false,mission_creation:false}},null,2));
}
function check(executionId){
  const rows=read(ATTR).filter(x=>x.execution_id===executionId), latest=rows.at(-1)||null;
  if(!latest)throw Error('no attribution record for execution: '+executionId);
  const findings=[...(latest.findings||[])];
  const status=findings.length?'LEARNING_INTEGRITY_BLOCK':latest.learning_eligible?'LEARNING_INTEGRITY_PASS':'LEARNING_INTEGRITY_REVIEW';
  console.log(JSON.stringify({runtime:'cognitive-policy-outcome-attribution-runtime-v1',status,execution_id:executionId,attribution_id:latest.id,attribution:latest.attribution,learning_eligible:latest.learning_eligible,findings,authority:{integrity_verification:true,learning_commit:false,policy_edit:false,belief_update:false,mission_creation:false}},null,2));
}
function review(id){const r=read(ATTR).filter(x=>!id||x.id===id||x.execution_id===id||x.policy_id===id);console.log(JSON.stringify({runtime:'cognitive-policy-outcome-attribution-runtime-v1',status:'ATTRIBUTION_REVIEW',count:r.length,attributions:r,authority:{review_only:true,learning_commit:false}},null,2));}
function status(){ensure();const r=read(ATTR);console.log(JSON.stringify({runtime:'cognitive-policy-outcome-attribution-runtime-v1',stage:50,status:'READY',attributions:r.length,learning_eligible:r.filter(x=>x.learning_eligible===true&&x.gate==='PASS').length,blocked:r.filter(x=>x.gate==='BLOCK').length,review:r.filter(x=>x.gate==='REVIEW').length,authority:{outcome_attribution:true,learning_eligibility:true,learning_commit:false,policy_edit:false,belief_update:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);
try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='attribute')attribute(a);else if(cmd==='check')check(a[0]);else if(cmd==='review')review(a[0]);else throw Error('usage: ... init|status|attribute <execution_id> <level> <rationale> [confounders]|check <execution_id>|review [id]');}catch(e){console.error('COGNITIVE-POLICY-OUTCOME-ATTRIBUTION: ERROR '+e.message);process.exitCode=1}
