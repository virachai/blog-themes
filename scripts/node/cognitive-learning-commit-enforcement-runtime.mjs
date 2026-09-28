#!/usr/bin/env node
/** Stage 53 — Cognitive Learning Commit Enforcement Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const M=join(process.cwd(),'04-revenue-system/07-intelligence/cognitive-memory');
const COMMITS=join(M,'learning-commits.jsonl'), GATES=join(M,'learning-eligibility-gates.jsonl'), ENFORCEMENT=join(M,'learning-commit-enforcement.jsonl');

function ensure(){mkdirSync(M,{recursive:true});for(const p of [COMMITS,GATES,ENFORCEMENT])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function add(row){appendFileSync(ENFORCEMENT,JSON.stringify({id:'COMMITENF-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...row})+'\n');}
function audit(){
 const commits=read(COMMITS), gates=read(GATES), results=commits.map(c=>{
   const g=gates.filter(x=>x.feedback_id===c.feedback_id).at(-1);
   const blocked=!g||g.gate!=='PASS'||g.status!=='LEARNING_ELIGIBLE';
   return {commit_id:c.id,feedback_id:c.feedback_id,gate_id:g?.id||null,gate:g?.gate||null,status:blocked?'BYPASS_DETECTED':'ENFORCED'};
 });
 for(const row of results)add(row);
 console.log(JSON.stringify({runtime:'cognitive-learning-commit-enforcement-runtime-v1',stage:53,status:results.some(x=>x.status==='BYPASS_DETECTED')?'ENFORCEMENT_BREACH':'ENFORCEMENT_CLEAN',results,authority:{commit_enforcement_audit:true,learning_commit:false,belief_update:false,policy_edit:false,mission_creation:false}},null,2));
}
function status(){ensure();const r=read(ENFORCEMENT);console.log(JSON.stringify({runtime:'cognitive-learning-commit-enforcement-runtime-v1',stage:53,status:'READY',audits:r.length,bypasses:r.filter(x=>x.status==='BYPASS_DETECTED').length,enforced:r.filter(x=>x.status==='ENFORCED').length,authority:{commit_enforcement_audit:true,learning_commit:false,belief_update:false,policy_edit:false,mission_creation:false}},null,2));}
function review(id){const r=read(ENFORCEMENT).filter(x=>!id||x.id===id||x.commit_id===id);console.log(JSON.stringify({runtime:'cognitive-learning-commit-enforcement-runtime-v1',status:'ENFORCEMENT_REVIEW',count:r.length,records:r,authority:{review_only:true,learning_commit:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);
try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='audit')audit();else if(cmd==='review')review(a[0]);else throw Error('usage: ... init|status|audit|review [id]');}catch(e){console.error('COGNITIVE-LEARNING-COMMIT-ENFORCEMENT: ERROR '+e.message);process.exitCode=1}
