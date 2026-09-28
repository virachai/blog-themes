#!/usr/bin/env node
/** Stage 39 — Cognitive Learning Commit & Belief Update Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT=process.cwd(), M=join(ROOT,'04-revenue-system/07-intelligence/cognitive-memory');
const FEEDBACK=join(M,'policy-feedback.jsonl'), BELIEFS=join(M,'beliefs.jsonl'), LESSONS=join(M,'lessons.jsonl'), COMMITS=join(M,'learning-commits.jsonl'), GATES=join(M,'learning-eligibility-gates.jsonl');

function fail(m){console.error('COGNITIVE-LEARNING-COMMIT: ERROR '+m);process.exitCode=1;}
function ensure(){mkdirSync(M,{recursive:true});for(const p of [FEEDBACK,BELIEFS,LESSONS,COMMITS,GATES])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function append(p,row){appendFileSync(p,JSON.stringify({id:row.id||'REC-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...row})+'\n');}
function commit(args){
 const [feedbackId,target='lesson',claim='',confidenceDelta='0'] = args;
 if(!feedbackId||!['lesson','belief'].includes(target)||!claim)throw new Error('usage: commit <feedback_id> <lesson|belief> <claim> [confidence_delta]');
 const f=read(FEEDBACK).find(x=>x.id===feedbackId); if(!f)throw new Error('unknown feedback id: '+feedbackId);
 const gates=read(GATES).filter(x=>x.feedback_id===feedbackId||x.execution_id===f.execution_id);
 const gate=gates.at(-1);
 if(!gate||gate.gate!=='PASS'||gate.status!=='LEARNING_ELIGIBLE')throw new Error('LEARNING_COMMIT_BLOCKED: Stage 51 eligibility gate must be PASS / LEARNING_ELIGIBLE');
 const delta=Number(confidenceDelta); if(!Number.isFinite(delta)||delta<-1||delta>1)throw new Error('confidence_delta must be -1..1');
 const prior=target==='belief'?read(BELIEFS).find(x=>x.claim===claim):null;
 const next=target==='belief'?Math.max(0,Math.min(1,Number(prior?.confidence??0)+delta)):null;
 const record={feedback_id:feedbackId,target,claim,confidence_delta:delta,prior_confidence:prior?.confidence??null,proposed_confidence:next,evidence:f.evidence,outcome_ids:f.outcome_ids,status:'COMMITTED'};
 append(COMMITS,record);
 if(target==='belief'){
   append(BELIEFS,{claim,confidence:next,source_feedback_id:feedbackId,version:(prior?.version??0)+1,evidence:f.outcome_ids,status:'LEARNED'});
 }else{
   append(LESSONS,{trigger:f.assessment,failure:delta<0?f.assessment:'',correction:claim,source_feedback_id:feedbackId,status:'LEARNED'});
 }
 console.log(JSON.stringify({runtime:'cognitive-learning-commit-runtime-v1',status:'LEARNING_COMMITTED',commit:record,authority:{learning_commit:true,belief_update:target==='belief',lesson_update:target==='lesson',policy_edit:false,policy_activation:false,mission_creation:false}},null,2));
}
function rollback(commitId){
 const c=read(COMMITS).find(x=>x.id===commitId); if(!c)throw new Error('unknown commit id: '+commitId);
 if(c.target!=='belief')throw new Error('rollback currently requires a belief commit');
 const b=read(BELIEFS).filter(x=>x.source_feedback_id===c.feedback_id&&x.claim===c.claim).at(-1); if(!b)throw new Error('no committed belief found');
 const prior=b.prior_confidence??c.prior_confidence??0;
 append(COMMITS,{rollback_of:commitId,target:'belief',claim:c.claim,confidence_delta:prior-(b.confidence??0),prior_confidence:b.confidence,proposed_confidence:prior,status:'ROLLED_BACK'});
 append(BELIEFS,{claim:c.claim,confidence:prior,source_feedback_id:c.feedback_id,version:(b.version??0)+1,evidence:c.outcome_ids,status:'ROLLBACK'});
 console.log(JSON.stringify({runtime:'cognitive-learning-commit-runtime-v1',status:'LEARNING_ROLLED_BACK',rollback_of:commitId,claim:c.claim,restored_confidence:prior,authority:{rollback:true,belief_update:true,policy_edit:false,mission_creation:false}},null,2));
}
function review(id){const rows=read(COMMITS).filter(x=>!id||x.id===id);console.log(JSON.stringify({runtime:'cognitive-learning-commit-runtime-v1',status:'COMMIT_REVIEW',count:rows.length,commits:rows,authority:{review_only:true,belief_update:false,mission_creation:false}},null,2));}
function status(){ensure();console.log(JSON.stringify({runtime:'cognitive-learning-commit-runtime-v1',stage:39,status:'READY',commits:read(COMMITS).length,beliefs:read(BELIEFS).length,lessons:read(LESSONS).length,authority:{learning_commit:true,belief_update:true,rollback:true,policy_edit:false,policy_activation:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);
try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='commit')commit(a);else if(cmd==='rollback')rollback(a[0]);else if(cmd==='review')review(a[0]);else throw new Error('usage: cognitive-learning-commit-runtime.mjs init|status|commit <feedback_id> <lesson|belief> <claim> [confidence_delta]|rollback <commit_id>|review [id]');}catch(e){fail(e instanceof Error?e.message:String(e));}
