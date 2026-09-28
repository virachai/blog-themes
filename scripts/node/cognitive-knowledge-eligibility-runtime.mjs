#!/usr/bin/env node
/** Stage 42 — Cognitive Knowledge Promotion & Policy Eligibility Runtime. */
import {existsSync,readFileSync,appendFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const M=join(process.cwd(),'04-revenue-system/07-intelligence/cognitive-memory');
const PROM=join(M,'learning-promotions.jsonl'), ELIG=join(M,'knowledge-eligibility.jsonl');
function ensure(){mkdirSync(M,{recursive:true});for(const p of [PROM,ELIG])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function add(x){appendFileSync(ELIG,JSON.stringify({id:'ELIG-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...x})+'\n');}
function assess(a){const [id,scope='policy',purpose='decision-support',evidence='trusted-learning']=a;if(!id)throw Error('usage: assess <promotion_id> [scope] [purpose] [evidence]');
 const p=read(PROM).find(x=>x.id===id);if(!p)throw Error('unknown promotion id: '+id);
 if(p.trust!=='TRUSTED'||p.status!=='TRUSTED')throw Error('eligibility requires TRUSTED knowledge');
 const x={knowledge_id:id,scope,purpose,evidence,status:'ELIGIBILITY_PROPOSED',eligibility:'CANDIDATE',gate:'REVIEW_REQUIRED'};
 add(x);console.log(JSON.stringify({runtime:'cognitive-knowledge-eligibility-runtime-v1',status:x.status,eligibility:x,authority:{eligibility_proposal:true,policy_creation:false,policy_activation:false,belief_update:false,mission_creation:false}},null,2));}
function approve(id){const r=read(ELIG),x=r.find(v=>v.id===id);if(!x)throw Error('unknown eligibility id: '+id);if(x.eligibility!=='CANDIDATE')throw Error('eligibility is not CANDIDATE');
 add({knowledge_id:x.knowledge_id,scope:x.scope,purpose:x.purpose,evidence:x.evidence,status:'ELIGIBLE',eligibility:'ELIGIBLE',gate:'PASSED',approved_from:id});
 console.log(JSON.stringify({runtime:'cognitive-knowledge-eligibility-runtime-v1',status:'ELIGIBLE',knowledge_id:x.knowledge_id,authority:{eligibility_approval:true,policy_creation:false,policy_activation:false,belief_update:false,mission_creation:false}},null,2));}
function review(id){const r=read(ELIG).filter(x=>!id||x.id===id);console.log(JSON.stringify({runtime:'cognitive-knowledge-eligibility-runtime-v1',status:'ELIGIBILITY_REVIEW',count:r.length,records:r,authority:{review_only:true,policy_creation:false,mission_creation:false}},null,2));}
function status(){ensure();const r=read(ELIG);console.log(JSON.stringify({runtime:'cognitive-knowledge-eligibility-runtime-v1',stage:42,status:'READY',records:r.length,candidates:r.filter(x=>x.eligibility==='CANDIDATE').length,eligible:r.filter(x=>x.eligibility==='ELIGIBLE').length,authority:{eligibility_proposal:true,eligibility_approval:true,policy_creation:false,policy_activation:false,belief_update:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);try{if(cmd==='init'||cmd==='status'){ensure();status()}else if(cmd==='assess')assess(a);else if(cmd==='approve')approve(a[0]);else if(cmd==='review')review(a[0]);else throw Error('usage: ... init|status|assess <promotion_id> [scope] [purpose] [evidence]|approve <eligibility_id>|review [id]')}catch(e){console.error('COGNITIVE-KNOWLEDGE-ELIGIBILITY: ERROR '+e.message);process.exitCode=1}
