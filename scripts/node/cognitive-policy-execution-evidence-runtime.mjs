#!/usr/bin/env node
/** Stage 49 — Cognitive Policy Execution Evidence & Outcome Integrity Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const M=join(process.cwd(),'04-revenue-system/07-intelligence/cognitive-memory');
const EXEC=join(M,'policy-executions.jsonl'), OUT=join(M,'policy-outcomes.jsonl'), AUTH=join(M,'policy-execution-authorizations.jsonl');
const LEDGER=join(M,'policy-execution-evidence.jsonl');

function ensure(){mkdirSync(M,{recursive:true});for(const p of [EXEC,OUT,AUTH,LEDGER])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function add(row){appendFileSync(LEDGER,JSON.stringify({id:'EXEVID-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...row})+'\n');}
function authorization(execution){return read(AUTH).filter(x=>x.policy_id===execution.policy_id&&x.policy_version===execution.policy_version&&x.gate==='PASS'&&x.status==='EXECUTION_AUTHORIZED').at(-1)||null;}
function evidence(args){
  const [executionId,evidence=''] = args;
  if(!executionId||!evidence)throw Error('usage: bind <execution_id> <evidence>');
  const e=read(EXEC).find(x=>x.execution_id===executionId);if(!e)throw Error('unknown execution id: '+executionId);
  const a=authorization(e), findings=[];
  if(!a)findings.push('MISSING_EXECUTION_AUTHORIZATION');
  const outcomes=read(OUT).filter(x=>x.execution_id===executionId);
  const row={execution_id:executionId,policy_id:e.policy_id,policy_version:e.policy_version,authorization_id:a?.id||null,outcome_ids:outcomes.map(x=>x.outcome_id),evidence,findings,gate:findings.length?'BLOCK':'PASS',status:findings.length?'EVIDENCE_BLOCKED':'EVIDENCE_BOUND'};
  add(row);
  console.log(JSON.stringify({runtime:'cognitive-policy-execution-evidence-runtime-v1',status:row.status,evidence:row,authority:{evidence_binding:true,outcome_integrity:true,policy_edit:false,belief_update:false,mission_creation:false}},null,2));
}
function check(executionId){
  const e=read(EXEC).find(x=>x.execution_id===executionId);if(!e)throw Error('unknown execution id: '+executionId);
  const a=authorization(e),os=read(OUT).filter(x=>x.execution_id===executionId),rows=read(LEDGER).filter(x=>x.execution_id===executionId),findings=[];
  if(!a)findings.push('MISSING_EXECUTION_AUTHORIZATION');
  if(!os.length)findings.push('MISSING_OUTCOME');
  if(!rows.length)findings.push('MISSING_EVIDENCE_BINDING');
  if(rows.length&&!rows.at(-1).evidence)findings.push('EMPTY_EVIDENCE');
  const status=findings.length?'INTEGRITY_BLOCK':'INTEGRITY_PASS';
  console.log(JSON.stringify({runtime:'cognitive-policy-execution-evidence-runtime-v1',status,execution_id:executionId,policy_id:e.policy_id,policy_version:e.policy_version,authorization_id:a?.id||null,outcome_ids:os.map(x=>x.outcome_id),evidence_ids:rows.map(x=>x.id),findings,authority:{integrity_verification:true,policy_edit:false,belief_update:false,mission_creation:false}},null,2));
}
function review(id){const r=read(LEDGER).filter(x=>!id||x.id===id||x.execution_id===id||x.policy_id===id);console.log(JSON.stringify({runtime:'cognitive-policy-execution-evidence-runtime-v1',status:'EXECUTION_EVIDENCE_REVIEW',count:r.length,evidence:r,authority:{review_only:true,policy_edit:false}},null,2));}
function status(){ensure();const r=read(LEDGER);console.log(JSON.stringify({runtime:'cognitive-policy-execution-evidence-runtime-v1',stage:49,status:'READY',evidence_bindings:r.length,bound:r.filter(x=>x.gate==='PASS').length,blocked:r.filter(x=>x.gate==='BLOCK').length,authority:{evidence_binding:true,outcome_integrity:true,policy_edit:false,belief_update:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);
try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='bind')evidence(a);else if(cmd==='check')check(a[0]);else if(cmd==='review')review(a[0]);else throw Error('usage: ... init|status|bind <execution_id> <evidence>|check <execution_id>|review [id]');}catch(e){console.error('COGNITIVE-POLICY-EXECUTION-EVIDENCE: ERROR '+e.message);process.exitCode=1}
