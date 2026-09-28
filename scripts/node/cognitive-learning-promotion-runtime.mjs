#!/usr/bin/env node
/** Stage 41 — Cognitive Learning Promotion Runtime. */
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT=process.cwd(), M=join(ROOT,'04-revenue-system/07-intelligence/cognitive-memory');
const COMMITS=join(M,'learning-commits.jsonl'), VALIDATIONS=join(M,'learning-validations.jsonl'), PROMOTIONS=join(M,'learning-promotions.jsonl');

function fail(m){console.error('COGNITIVE-LEARNING-PROMOTION: ERROR '+m);process.exitCode=1;}
function ensure(){mkdirSync(M,{recursive:true});for(const p of [COMMITS,VALIDATIONS,PROMOTIONS])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function append(row){appendFileSync(PROMOTIONS,JSON.stringify({id:'PROMOTION-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...row})+'\n');}
function promote(args){
 const [commitId,reviewer='reviewed',evidence='validated-learning'] = args;
 if(!commitId)throw new Error('usage: promote <commit_id> [reviewer] [evidence]');
 const c=read(COMMITS).find(x=>x.id===commitId); if(!c)throw new Error('unknown commit id: '+commitId);
 const validations=read(VALIDATIONS).filter(x=>x.commit_id===commitId);
 if(!validations.length)throw new Error('promotion requires validation for commit: '+commitId);
 if(validations.some(x=>x.gate==='BLOCK'))throw new Error('promotion blocked by regression validation');
 const row={commit_id:commitId,target:c.target,reviewer,evidence,validation_ids:validations.map(x=>x.id),status:'PROMOTION_PROPOSED',trust:'CANDIDATE'};
 append(row);
 console.log(JSON.stringify({runtime:'cognitive-learning-promotion-runtime-v1',status:'PROMOTION_PROPOSED',promotion:row,authority:{promotion_proposal:true,trust_upgrade:false,belief_update:false,policy_creation:false,mission_creation:false}},null,2));
}
function trust(id){
 const rows=read(PROMOTIONS); const p=rows.find(x=>x.id===id); if(!p)throw new Error('unknown promotion id: '+id);
 if(p.status!=='PROMOTION_PROPOSED')throw new Error('promotion must be PROPOSED');
 const updated={...p,status:'TRUSTED',trust:'TRUSTED',reviewed_at:new Date().toISOString()};
 append({promotion_of:id,commit_id:p.commit_id,target:p.target,reviewer:p.reviewer,evidence:p.evidence,validation_ids:p.validation_ids,status:'TRUSTED',trust:'TRUSTED',previous_status:p.status});
 console.log(JSON.stringify({runtime:'cognitive-learning-promotion-runtime-v1',status:'LEARNING_TRUSTED',promotion:updated,authority:{trust_promotion:true,belief_update:false,policy_creation:false,mission_creation:false}},null,2));
}
function review(id){const rows=read(PROMOTIONS).filter(x=>!id||x.id===id);console.log(JSON.stringify({runtime:'cognitive-learning-promotion-runtime-v1',status:'PROMOTION_REVIEW',count:rows.length,promotions:rows,authority:{review_only:true,belief_update:false,mission_creation:false}},null,2));}
function status(){ensure();const rows=read(PROMOTIONS);console.log(JSON.stringify({runtime:'cognitive-learning-promotion-runtime-v1',stage:41,status:'READY',promotions:rows.length,candidates:rows.filter(x=>x.trust==='CANDIDATE').length,trusted:rows.filter(x=>x.trust==='TRUSTED').length,authority:{promotion_proposal:true,trust_promotion:true,belief_update:false,policy_creation:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);
try{if(cmd==='init'||cmd==='status'){if(cmd==='init')ensure();status();}else if(cmd==='promote')promote(a);else if(cmd==='trust')trust(a[0]);else if(cmd==='review')review(a[0]);else throw new Error('usage: cognitive-learning-promotion-runtime.mjs init|status|promote <commit_id> [reviewer] [evidence]|trust <promotion_id>|review [id]');}catch(e){fail(e instanceof Error?e.message:String(e));}
