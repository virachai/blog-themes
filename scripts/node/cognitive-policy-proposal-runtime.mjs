#!/usr/bin/env node
/** Stage 45 — Cognitive Policy Proposal Runtime. */
import {existsSync,readFileSync,appendFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const M=join(process.cwd(),'04-revenue-system/07-intelligence/cognitive-memory');
const E=join(M,'policy-proposal-eligibility.jsonl'),P=join(M,'policies.jsonl');
function ensure(){mkdirSync(M,{recursive:true});for(const p of [E,P])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function add(x){appendFileSync(P,JSON.stringify({id:'POL-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),lifecycle:'PROPOSED',authority:false,...x})+'\n');}
function propose(a){const [eligibilityId,name,scope,condition,action,confidence='0.5',source='stage-45-evidence-lineage',preconditions='review-required',expiresAt='',rollback='manual-review']=a;if(!eligibilityId||!name||!scope||!condition||!action)throw Error('usage: propose <eligibility_id> <name> <scope> <condition> <action> [confidence] [source] [preconditions] [expires_at] [rollback]');
 const e=read(E).find(x=>x.id===eligibilityId);if(!e)throw Error('unknown proposal eligibility id: '+eligibilityId);if(e.eligibility!=='ELIGIBLE'||e.status!=='PROPOSAL_ELIGIBLE')throw Error('policy proposal requires PROPOSAL_ELIGIBLE evidence');
 const c=Number(confidence);if(!Number.isFinite(c)||c<0||c>1)throw Error('confidence must be 0..1');
 const row={name,scope,condition,action,confidence:c,source,preconditions,expires_at:expiresAt||null,rollback,evidence_lineage:{proposal_eligibility_id:eligibilityId,binding_id:e.binding_id,knowledge_id:e.knowledge_id},status:'PROPOSED'};
 add(row);console.log(JSON.stringify({runtime:'cognitive-policy-proposal-runtime-v1',status:'PROPOSED',policy:row,authority:{policy_proposal:true,policy_activation:false,policy_edit:false,belief_update:false,mission_creation:false}},null,2));}
function review(id){const r=read(P).filter(x=>!id||x.id===id);console.log(JSON.stringify({runtime:'cognitive-policy-proposal-runtime-v1',status:'POLICY_PROPOSAL_REVIEW',count:r.length,policies:r,authority:{review_only:true,policy_activation:false,belief_update:false}},null,2));}
function status(){ensure();const r=read(P);console.log(JSON.stringify({runtime:'cognitive-policy-proposal-runtime-v1',stage:45,status:'READY',policies:r.length,proposed:r.filter(x=>x.lifecycle==='PROPOSED').length,authority:{policy_proposal:true,policy_activation:false,policy_edit:false,belief_update:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);try{if(cmd==='init'||cmd==='status'){ensure();status()}else if(cmd==='propose')propose(a);else if(cmd==='review')review(a[0]);else throw Error('usage: ... init|status|propose <eligibility_id> <name> <scope> <condition> <action> [confidence] [source] [preconditions] [expires_at] [rollback]|review [id]')}catch(e){console.error('COGNITIVE-POLICY-PROPOSAL: ERROR '+e.message);process.exitCode=1}
