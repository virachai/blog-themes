#!/usr/bin/env node
/** Stage 43 — Cognitive Policy Evidence Binding Runtime. */
import {existsSync,readFileSync,appendFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const M=join(process.cwd(),'04-revenue-system/07-intelligence/cognitive-memory');
const E=join(M,'knowledge-eligibility.jsonl'), B=join(M,'policy-evidence-bindings.jsonl');
function ensure(){mkdirSync(M,{recursive:true});for(const p of [E,B])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function add(x){appendFileSync(B,JSON.stringify({id:'BIND-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...x})+'\n');}
function bind(a){const [knowledgeId,policyScope='policy',purpose='policy-proposal',claim='derived-from-eligible-knowledge',evidence='eligibility-record']=a;if(!knowledgeId)throw Error('usage: bind <eligibility_id> [policy_scope] [purpose] [claim] [evidence]');
 const rows=read(E), x=rows.find(v=>v.id===knowledgeId); if(!x)throw Error('unknown eligibility id: '+knowledgeId);
 if(x.eligibility!=='ELIGIBLE'||x.status!=='ELIGIBLE')throw Error('binding requires ELIGIBLE knowledge');
 const row={knowledge_id:knowledgeId,policy_scope:policyScope,purpose,claim,evidence,status:'BOUND_PROPOSAL',gate:'EVIDENCE_BOUND'};add(row);
 console.log(JSON.stringify({runtime:'cognitive-policy-evidence-binding-runtime-v1',status:row.status,binding:row,authority:{evidence_binding:true,policy_proposal:false,policy_activation:false,belief_update:false,mission_creation:false}},null,2));}
function review(id){const r=read(B).filter(x=>!id||x.id===id);console.log(JSON.stringify({runtime:'cognitive-policy-evidence-binding-runtime-v1',status:'EVIDENCE_BINDING_REVIEW',count:r.length,bindings:r,authority:{review_only:true,policy_proposal:false,policy_activation:false}},null,2));}
function status(){ensure();const r=read(B);console.log(JSON.stringify({runtime:'cognitive-policy-evidence-binding-runtime-v1',stage:43,status:'READY',bindings:r.length,evidence_bound:r.filter(x=>x.gate==='EVIDENCE_BOUND').length,authority:{evidence_binding:true,policy_proposal:false,policy_activation:false,belief_update:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);try{if(cmd==='init'||cmd==='status'){ensure();status()}else if(cmd==='bind')bind(a);else if(cmd==='review')review(a[0]);else throw Error('usage: ... init|status|bind <eligibility_id> [policy_scope] [purpose] [claim] [evidence]|review [id]')}catch(e){console.error('COGNITIVE-POLICY-EVIDENCE-BINDING: ERROR '+e.message);process.exitCode=1}
