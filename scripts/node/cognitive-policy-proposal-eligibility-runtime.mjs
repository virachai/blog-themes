#!/usr/bin/env node
/** Stage 44 — Cognitive Policy Proposal Eligibility Runtime. */
import {existsSync,readFileSync,appendFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const M=join(process.cwd(),'04-revenue-system/07-intelligence/cognitive-memory');
const B=join(M,'policy-evidence-bindings.jsonl'), E=join(M,'policy-proposal-eligibility.jsonl');
function ensure(){mkdirSync(M,{recursive:true});for(const p of [B,E])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function add(x){appendFileSync(E,JSON.stringify({id:'PPE-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...x})+'\n');}
function assess(a){const [bindingId,reviewer='review',rationale='evidence-binding-reviewed',threshold='required-lineage']=a;if(!bindingId)throw Error('usage: assess <binding_id> [reviewer] [rationale] [threshold]');
 const b=read(B).find(x=>x.id===bindingId);if(!b)throw Error('unknown binding id: '+bindingId);if(b.gate!=='EVIDENCE_BOUND'||b.status!=='BOUND_PROPOSAL')throw Error('proposal eligibility requires EVIDENCE_BOUND binding');
 const row={binding_id:bindingId,knowledge_id:b.knowledge_id,reviewer,rationale,threshold,status:'PROPOSAL_ELIGIBILITY_PROPOSED',eligibility:'CANDIDATE',gate:'REVIEW_REQUIRED'};add(row);
 console.log(JSON.stringify({runtime:'cognitive-policy-proposal-eligibility-runtime-v1',status:row.status,eligibility:row,authority:{eligibility_assessment:true,policy_proposal:false,policy_activation:false,mission_creation:false}},null,2));}
function approve(id){const r=read(E),x=r.find(v=>v.id===id);if(!x)throw Error('unknown proposal eligibility id: '+id);if(x.eligibility!=='CANDIDATE')throw Error('eligibility is not CANDIDATE');
 const row={binding_id:x.binding_id,knowledge_id:x.knowledge_id,reviewer:x.reviewer,rationale:x.rationale,threshold:x.threshold,status:'PROPOSAL_ELIGIBLE',eligibility:'ELIGIBLE',gate:'PASSED',approved_from:id};add(row);
 console.log(JSON.stringify({runtime:'cognitive-policy-proposal-eligibility-runtime-v1',status:row.status,proposal_eligibility:row,authority:{eligibility_approval:true,policy_proposal:false,policy_activation:false,mission_creation:false}},null,2));}
function review(id){const r=read(E).filter(x=>!id||x.id===id);console.log(JSON.stringify({runtime:'cognitive-policy-proposal-eligibility-runtime-v1',status:'PROPOSAL_ELIGIBILITY_REVIEW',count:r.length,records:r,authority:{review_only:true,policy_proposal:false,policy_activation:false}},null,2));}
function status(){ensure();const r=read(E);console.log(JSON.stringify({runtime:'cognitive-policy-proposal-eligibility-runtime-v1',stage:44,status:'READY',records:r.length,candidates:r.filter(x=>x.eligibility==='CANDIDATE').length,eligible:r.filter(x=>x.eligibility==='ELIGIBLE').length,authority:{eligibility_assessment:true,eligibility_approval:true,policy_proposal:false,policy_activation:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);try{if(cmd==='init'||cmd==='status'){ensure();status()}else if(cmd==='assess')assess(a);else if(cmd==='approve')approve(a[0]);else if(cmd==='review')review(a[0]);else throw Error('usage: ... init|status|assess <binding_id> [reviewer] [rationale] [threshold]|approve <eligibility_id>|review [id]')}catch(e){console.error('COGNITIVE-POLICY-PROPOSAL-ELIGIBILITY: ERROR '+e.message);process.exitCode=1}
