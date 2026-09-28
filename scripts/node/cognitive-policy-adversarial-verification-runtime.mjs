#!/usr/bin/env node
/** Stage 46 — Cognitive Policy Proposal Adversarial Verification Runtime. */
import {existsSync,readFileSync,appendFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const M=join(process.cwd(),'04-revenue-system/07-intelligence/cognitive-memory');
const P=join(M,'policies.jsonl'),V=join(M,'policy-verifications.jsonl');
function ensure(){mkdirSync(M,{recursive:true});for(const p of [P,V])if(!existsSync(p))writeFileSync(p,'');}
function read(p){ensure();return readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);}
function add(x){appendFileSync(V,JSON.stringify({id:'VERIFY-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),created_at:new Date().toISOString(),authority:false,...x})+'\n');}
function verify(a){const [id,attack='standard',reviewer='verification-runtime',notes='adversarial-check']=a;if(!id)throw Error('usage: verify <policy_id> [attack] [reviewer] [notes]');
 const p=read(P).find(x=>x.id===id);if(!p)throw Error('unknown policy id: '+id);const l=p.evidence_lineage||{};
 const findings=[];if(!l.proposal_eligibility_id)findings.push('MISSING_PROPOSAL_ELIGIBILITY');if(!l.binding_id)findings.push('MISSING_EVIDENCE_BINDING');if(!l.knowledge_id)findings.push('MISSING_KNOWLEDGE_LINEAGE');if(!p.condition)findings.push('MISSING_CONDITION');if(!p.action)findings.push('MISSING_ACTION');if(!p.rollback)findings.push('MISSING_ROLLBACK');
 const gate=findings.length?'BLOCK':'PASS';const row={policy_id:id,policy_version:p.version||1,attack,reviewer,notes,findings,gate,status:gate==='PASS'?'VERIFIED':'REGRESSION_FLAG'};add(row);
 console.log(JSON.stringify({runtime:'cognitive-policy-adversarial-verification-runtime-v1',status:row.status,verification:row,authority:{adversarial_verification:true,policy_activation:false,policy_edit:false,belief_update:false,mission_creation:false}},null,2));}
function review(id){const r=read(V).filter(x=>!id||x.id===id);console.log(JSON.stringify({runtime:'cognitive-policy-adversarial-verification-runtime-v1',status:'VERIFICATION_REVIEW',count:r.length,verifications:r,authority:{review_only:true,policy_activation:false}},null,2));}
function status(){ensure();const r=read(V);console.log(JSON.stringify({runtime:'cognitive-policy-adversarial-verification-runtime-v1',stage:46,status:'READY',verifications:r.length,passed:r.filter(x=>x.gate==='PASS').length,blocked:r.filter(x=>x.gate==='BLOCK').length,authority:{adversarial_verification:true,policy_activation:false,policy_edit:false,belief_update:false,mission_creation:false}},null,2));}
const [cmd,...a]=process.argv.slice(2);try{if(cmd==='init'||cmd==='status'){ensure();status()}else if(cmd==='verify')verify(a);else if(cmd==='review')review(a[0]);else throw Error('usage: ... init|status|verify <policy_id> [attack] [reviewer] [notes]|review [id]')}catch(e){console.error('COGNITIVE-POLICY-ADVERSARIAL: ERROR '+e.message);process.exitCode=1}
