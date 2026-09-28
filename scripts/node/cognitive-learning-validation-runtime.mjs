#!/usr/bin/env node
/** Stage 40 — Cognitive Learning Validation & Regression Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT=process.cwd(), M=join(ROOT,'04-revenue-system/07-intelligence/cognitive-memory');
const COMMITS=join(M,'learning-commits.jsonl'), BELIEFS=join(M,'beliefs.jsonl'), FEEDBACK=join(M,'policy-feedback.jsonl'), VALIDATIONS=join(M,'learning-validations.jsonl');

function fail(m){console.error('COGNITIVE-LEARNING-VALIDATION: ERROR '+m);process.exitCode=1;}
function ensure(){mkdirSync(M,{recursive:true});for(const p of [COMMITS,BELIEFS,FEEDBACK,VALIDATIONS])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function append(row){appendFileSync(VALIDATIONS,JSON.stringify({id:'VALIDATION-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...row})+'\n');}
function validate(args){
 const [commitId,expected='neutral'] = args; if(!commitId)throw new Error('usage: validate <commit_id> [positive|neutral|negative]');
 if(!['positive','neutral','negative'].includes(expected))throw new Error('expected must be positive|neutral|negative');
 const c=read(COMMITS).find(x=>x.id===commitId); if(!c)throw new Error('unknown commit id: '+commitId);
 const f=read(FEEDBACK).find(x=>x.id===c.feedback_id); if(!f)throw new Error('missing source feedback: '+c.feedback_id);
 const delta=Number(c.confidence_delta??0);
 const regression=expected==='negative' || (expected==='positive'&&delta<0);
 const result=regression?'REGRESSION_FLAG':'VALIDATED';
 const row={commit_id:commitId,feedback_id:c.feedback_id,target:c.target,expected,confidence_delta:delta,result,gate:regression?'BLOCK':'PASS',status:'REVIEW_REQUIRED'};
 append(row);
 console.log(JSON.stringify({runtime:'cognitive-learning-validation-runtime-v1',status:result,row,authority:{validation:true,regression_detection:true,learning_reversal:false,belief_update:false,policy_edit:false,mission_creation:false}},null,2));
}
function drift(claim){
 const rows=read(BELIEFS).filter(x=>!claim||x.claim===claim);
 const deltas=rows.slice(1).map((x,i)=>Number(x.confidence)-Number(rows[i].confidence));
 const negative=deltas.filter(x=>x<0).length;
 console.log(JSON.stringify({runtime:'cognitive-learning-validation-runtime-v1',status:'DRIFT_SCAN',claim:claim||null,versions:rows.length,deltas,negative_transitions:negative,drift:negative>1?'DETECTED':'NONE',authority:{detection_only:true,belief_update:false,mission_creation:false}},null,2));
}
function review(id){const rows=read(VALIDATIONS).filter(x=>!id||x.id===id);console.log(JSON.stringify({runtime:'cognitive-learning-validation-runtime-v1',status:'VALIDATION_REVIEW',count:rows.length,validations:rows,authority:{review_only:true,belief_update:false,mission_creation:false}},null,2));}
function status(){ensure();console.log(JSON.stringify({runtime:'cognitive-learning-validation-runtime-v1',stage:40,status:'READY',validations:read(VALIDATIONS).length,regressions:read(VALIDATIONS).filter(x=>x.result==='REGRESSION_FLAG').length,authority:{validation:true,regression_detection:true,drift_detection:true,belief_update:false,policy_edit:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);
try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='validate')validate(a);else if(cmd==='drift')drift(a[0]);else if(cmd==='review')review(a[0]);else throw new Error('usage: cognitive-learning-validation-runtime.mjs init|status|validate <commit_id> [positive|neutral|negative]|drift [claim]|review [id]');}catch(e){fail(e instanceof Error?e.message:String(e));}
