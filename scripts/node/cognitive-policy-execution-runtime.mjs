#!/usr/bin/env node
/** Stage 37 — Cognitive Policy Execution & Outcome Measurement Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT=process.cwd();
const MEMORY_ROOT=join(ROOT,'04-revenue-system/07-intelligence/cognitive-memory');
const POLICIES=join(MEMORY_ROOT,'policies.jsonl');
const EVENTS=join(MEMORY_ROOT,'policy-events.jsonl');
const EXECUTIONS=join(MEMORY_ROOT,'policy-executions.jsonl');
const OUTCOMES=join(MEMORY_ROOT,'policy-outcomes.jsonl');

function fail(m){console.error('COGNITIVE-POLICY-EXECUTION: ERROR '+m);process.exitCode=1;}
function ensure(){mkdirSync(MEMORY_ROOT,{recursive:true});for(const p of [POLICIES,EVENTS,EXECUTIONS,OUTCOMES])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function append(p,row){appendFileSync(p,JSON.stringify({id:row.id||'REC-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...row})+'\n');}
function policy(id){
 const p=read(POLICIES).find(x=>x.id===id); if(!p)throw new Error('unknown policy id: '+id);
 const ev=read(EVENTS).filter(x=>x.policy_id===id); let state=p.status||'PROPOSED',version=0;
 for(const e of ev){if(e.event==='ACTIVATE'){state='ACTIVE';version=e.version??version+1;}else if(e.event==='SUSPEND'&&state==='ACTIVE')state='SUSPENDED';else if(e.event==='RESUME'&&state==='SUSPENDED')state='ACTIVE';else if(e.event==='RETIRE')state='RETIRED';else if(e.event==='ROLLBACK')state='PROPOSED';}
 if(state==='ACTIVE'&&p.expires_at&&new Date(p.expires_at).getTime()<=Date.now())state='SUSPENDED';
 return {...p,status:state,version};
}
function execute(args){
 const [policyId,context=''] = args; if(!policyId||!context)throw new Error('usage: execute <policy_id> <context>');
 const p=policy(policyId); if(p.status!=='ACTIVE')throw new Error('policy must be ACTIVE');
 const e={execution_id:'EXEC-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),policy_id:policyId,policy_version:p.version,context,condition:p.condition,action:p.action,status:'EXECUTED',authority:false};
 append(EXECUTIONS,e);
 console.log(JSON.stringify({runtime:'cognitive-policy-execution-runtime-v1',status:'POLICY_EXECUTED',execution:e,authority:{execution_record:true,outcome_measurement:false,policy_edit:false,belief_update:false,mission_creation:false}},null,2));
}
function outcome(args){
 const [executionId,observed,status='OBSERVED'] = args; if(!executionId||!observed)throw new Error('usage: outcome <execution_id> <observed> [status]');
 const e=read(EXECUTIONS).find(x=>x.execution_id===executionId); if(!e)throw new Error('unknown execution id: '+executionId);
 const o={outcome_id:'OUTCOME-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),execution_id:executionId,policy_id:e.policy_id,policy_version:e.policy_version,observed,status,measured_at:new Date().toISOString(),authority:false};
 append(OUTCOMES,o);
 console.log(JSON.stringify({runtime:'cognitive-policy-execution-runtime-v1',status:'OUTCOME_RECORDED',outcome:o,authority:{outcome_measurement:true,belief_update:false,policy_edit:false,mission_creation:false}},null,2));
}
function review(policyId){
 const xs=read(EXECUTIONS).filter(x=>!policyId||x.policy_id===policyId), os=read(OUTCOMES).filter(x=>!policyId||x.policy_id===policyId);
 console.log(JSON.stringify({runtime:'cognitive-policy-execution-runtime-v1',status:'MEASUREMENT_REVIEW',executions:xs.length,outcomes:os.length,records:{executions:xs,outcomes:os},authority:{measurement_only:true,belief_update:false,policy_edit:false,mission_creation:false}},null,2));
}
function status(){ensure();console.log(JSON.stringify({runtime:'cognitive-policy-execution-runtime-v1',stage:37,status:'READY',executions:read(EXECUTIONS).length,outcomes:read(OUTCOMES).length,authority:{policy_execution:true,outcome_measurement:true,policy_activation:false,policy_edit:false,belief_update:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);
try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='execute')execute(a);else if(cmd==='outcome')outcome(a);else if(cmd==='review')review(a[0]);else throw new Error('usage: cognitive-policy-execution-runtime.mjs init|status|execute <policy_id> <context>|outcome <execution_id> <observed> [status]|review [policy_id]');}catch(e){fail(e instanceof Error?e.message:String(e));}
