#!/usr/bin/env node
/** Stage 38 — Cognitive Policy Outcome Evaluation & Learning Feedback Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT=process.cwd(), M=join(ROOT,'04-revenue-system/07-intelligence/cognitive-memory');
const POLICIES=join(M,'policies.jsonl'), EXECUTIONS=join(M,'policy-executions.jsonl'), OUTCOMES=join(M,'policy-outcomes.jsonl'), FEEDBACK=join(M,'policy-feedback.jsonl');

function fail(m){console.error('COGNITIVE-POLICY-FEEDBACK: ERROR '+m);process.exitCode=1;}
function ensure(){mkdirSync(M,{recursive:true});for(const p of [POLICIES,EXECUTIONS,OUTCOMES,FEEDBACK])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function append(row){appendFileSync(FEEDBACK,JSON.stringify({id:'FEEDBACK-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...row})+'\n');}
function evaluate(args){
 const [executionId,assessment,evidence='observed-outcome'] = args;
 if(!executionId||!assessment)throw new Error('usage: evaluate <execution_id> <assessment> [evidence]');
 const e=read(EXECUTIONS).find(x=>x.execution_id===executionId); if(!e)throw new Error('unknown execution id: '+executionId);
 const o=read(OUTCOMES).filter(x=>x.execution_id===executionId); if(!o.length)throw new Error('no observed outcome for execution: '+executionId);
 const f={execution_id:executionId,policy_id:e.policy_id,policy_version:e.policy_version,assessment,evidence,outcome_ids:o.map(x=>x.outcome_id),status:'PROPOSED_LEARNING',next_action:'review'};
 append(f);
 console.log(JSON.stringify({runtime:'cognitive-policy-feedback-runtime-v1',status:'LEARNING_FEEDBACK_PROPOSED',feedback:f,authority:{outcome_evaluation:true,learning_proposal:true,belief_update:false,policy_edit:false,policy_activation:false,mission_creation:false}},null,2));
}
function review(policyId){
 const rows=read(FEEDBACK).filter(x=>!policyId||x.policy_id===policyId);
 console.log(JSON.stringify({runtime:'cognitive-policy-feedback-runtime-v1',status:'FEEDBACK_REVIEW',count:rows.length,feedback:rows,authority:{review_only:true,belief_update:false,policy_edit:false,mission_creation:false}},null,2));
}
function status(){ensure();console.log(JSON.stringify({runtime:'cognitive-policy-feedback-runtime-v1',stage:38,status:'READY',feedback:read(FEEDBACK).length,authority:{outcome_evaluation:true,learning_proposal:true,belief_update:false,policy_edit:false,policy_activation:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);
try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='evaluate')evaluate(a);else if(cmd==='review')review(a[0]);else throw new Error('usage: cognitive-policy-feedback-runtime.mjs init|status|evaluate <execution_id> <assessment> [evidence]|review [policy_id]');}catch(e){fail(e instanceof Error?e.message:String(e));}
